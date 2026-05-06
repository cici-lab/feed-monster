/**
 * 鼠标光环系统模块
 * 实现光环替代鼠标光标、与怪兽情绪联动
 * 视觉效果：多层光环、呼吸动画、粒子拖尾、发光效果
 */

import { monsterMood, feedFeedback } from './state.js';
import { hasBuff } from './buffs.js';

// 鼠标血量状态
export const cursorState = {
  health: 100,           // 当前血量 0-100
  maxHealth: 100,        // 最大血量
  recoveryRate: 2,       // 空闲恢复速率（每秒）
  isDragging: false,     // 是否正在拖拽食物
  dragDistance: 0,       // 本次拖拽累计距离（每帧累计，消耗后归零）
  dragDistanceCost: 0.03,// 每像素消耗能量（拖1200像素=36能量）
  lowEnergyThreshold: 30,// 低能量阈值（低于此值时拖拽阻力）
  isWeak: false,         // 是否处于虚弱状态
  weakTimer: 0,          // 虚弱状态计时器
  weakDuration: 8,       // 虚弱状态持续时间（秒）
  lastPos: { x: 0, y: 0 },// 上一帧位置
  isMoving: false,       // 是否在移动
  moveSpeed: 0,          // 移动速度
  breathPhase: 0,        // 呼吸动画相位

  // 纯净移动模式：移动不消耗能量（只有拖拽才消耗）
  // 保留 moveCost 是为了兼容，但不再用于自动消耗
  moveCost: 0,
};

// 光环组件引用
let outerGlow = null;
let mainRing = null;
let innerRing = null;
let core = null;
let pulseRing = null;
let updateHandler = null;
let lastFeedFeedbackHandledAt = 0;

// 粒子数组
let trailParticles = [];
let sparkleParticles = [];

// 配置
const CONFIG = {
  baseRadius: 22,        // 基础光环半径
  maxRadius: 32,         // 最大光环半径
  minRadius: 10,         // 最小光环半径
  trailLength: 12,       // 拖尾长度
  trailFadeSpeed: 0.15,  // 拖尾消失速度
  breathSpeed: 2,        // 呼吸速度
  breathAmount: 4,       // 呼吸幅度
  glowPulseSpeed: 3,     // 发光脉动速度
  maxSparkles: 8,        // 最大闪烁粒子数
};

// 情绪关联颜色配置
const MOOD_COLORS = {
  happy: {
    primary: [255, 215, 0],      // 金色
    secondary: [255, 127, 80],   // 珊瑚橙
    glow: [255, 200, 100],       // 发光色
    core: [255, 255, 220],       // 核心光点
  },
  normal: {
    primary: [152, 216, 200],    // 薄荷绿
    secondary: [135, 206, 235],  // 天蓝
    glow: [150, 200, 220],       // 发光色
    core: [255, 255, 255],       // 核心光点
  },
  sad: {
    primary: [184, 169, 201],    // 薰衣草灰
    secondary: [160, 196, 212],  // 冰蓝
    glow: [140, 160, 200],       // 发光色
    core: [200, 210, 230],       // 核心光点
  },
};

// 喂食反馈颜色
const FEEDBACK_COLORS = {
  loved: [255, 100, 150],    // 粉红
  liked: [100, 255, 150],    // 绿色
  neutral: [200, 200, 200],  // 灰色
  hated: [255, 80, 80],      // 红色
};

// 脉冲效果状态
let pulseRadius = 0;
let pulseOpacity = 0;
let pulseColor = [255, 255, 255];

/**
 * 初始化鼠标光环系统
 */
export function initCursorHealth() {
  // 清理之前的实例
  cleanupCursorHealth();
  
  // 隐藏系统鼠标
  const canvas = document.getElementById('game-container');
  if (canvas) {
    canvas.style.cursor = 'auto';
  }
  document.body.style.cursor = 'auto';
  
  const initialPos = mousePos();
  cursorState.lastPos = { x: initialPos.x, y: initialPos.y };
  
  // 外发光层
  outerGlow = add([
    circle(CONFIG.baseRadius + 15),
    pos(initialPos.x, initialPos.y),
    color(150, 200, 220),
    opacity(0.15),
    anchor('center'),
    z(98),
    'cursor-outer-glow',
  ]);
  
  // 主光环
  mainRing = add([
    circle(CONFIG.baseRadius),
    pos(initialPos.x, initialPos.y),
    color(152, 216, 200),
    opacity(0.85),
    anchor('center'),
    z(99),
    'cursor-main-ring',
  ]);
  
  // 内环
  innerRing = add([
    circle(CONFIG.baseRadius * 0.5),
    pos(initialPos.x, initialPos.y),
    color(135, 206, 235),
    opacity(0.4),
    anchor('center'),
    z(100),
    'cursor-inner-ring',
  ]);
  
  // 核心光点
  core = add([
    circle(6),
    pos(initialPos.x, initialPos.y),
    color(255, 255, 255),
    opacity(1),
    anchor('center'),
    z(101),
    'cursor-core',
  ]);
  
  // 脉冲效果层
  pulseRing = add([
    circle(CONFIG.baseRadius + 5),
    pos(initialPos.x, initialPos.y),
    color(255, 255, 255),
    opacity(0),
    anchor('center'),
    z(102),
    'cursor-pulse',
  ]);
  
  // 主更新循环
  updateHandler = onUpdate(() => {
    updateCursorPosition();
    updateHealthRecovery();
    updateAuraVisuals();
    updateTrail();
    updateSparkles();
    updateWeakState();
    updateBreathAnimation();
    updatePulse();
    updateFeedFeedback();
  });
  
  // 每次初始化都重置反馈处理时间，避免跨场景重复触发
  lastFeedFeedbackHandledAt = 0;
  
  return {
    takeDamage,
    heal,
    triggerPulse,
    getCursorPos,
    isWeak: () => cursorState.isWeak,
    getHealth: () => cursorState.health,
    startCursorDrag,
    endCursorDrag,
    getDragMultiplier,
  };
}

/**
 * 更新光环位置
 */
function updateCursorPosition() {
  const currentPos = mousePos();
  
  // 安全获取 dt，防止除零
  const deltaTime = Math.max(dt(), 0.001);
  
  // 计算移动距离和速度
  const dx = currentPos.x - cursorState.lastPos.x;
  const dy = currentPos.y - cursorState.lastPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 限制速度在合理范围内
  cursorState.moveSpeed = Math.min(distance / deltaTime, 2000);
  cursorState.isMoving = distance > 2;
  
  // 能量消耗不再在移动时触发，只在拖拽时消耗
  // 按拖拽距离累计，在 updateHealthRecovery 中消耗
  if (cursorState.isDragging && distance > 0) {
    cursorState.dragDistance += distance;
  }
  
  // 计算目标位置
  let targetX = currentPos.x;
  let targetY = currentPos.y;
  
  // 虚弱状态下移动变慢
  if (cursorState.isWeak) {
    const lerpFactor = 0.3;
    const currentAuraPos = mainRing ? mainRing.pos : currentPos;
    targetX = currentAuraPos.x + (currentPos.x - currentAuraPos.x) * lerpFactor;
    targetY = currentAuraPos.y + (currentPos.y - currentAuraPos.y) * lerpFactor;
  }
  
  // 更新所有组件位置
  if (outerGlow && outerGlow.exists()) {
    outerGlow.pos.x = targetX;
    outerGlow.pos.y = targetY;
  }
  if (mainRing && mainRing.exists()) {
    mainRing.pos.x = targetX;
    mainRing.pos.y = targetY;
  }
  if (innerRing && innerRing.exists()) {
    innerRing.pos.x = targetX;
    innerRing.pos.y = targetY;
  }
  if (core && core.exists()) {
    core.pos.x = targetX;
    core.pos.y = targetY;
  }
  if (pulseRing && pulseRing.exists()) {
    pulseRing.pos.x = targetX;
    pulseRing.pos.y = targetY;
  }
  
  // 更新拖尾粒子位置
  for (const p of trailParticles) {
    if (p.obj && p.obj.exists()) {
      // 拖尾粒子不跟随
    }
  }
  
  // 记录位置
  cursorState.lastPos = { x: currentPos.x, y: currentPos.y };
}

/**
 * 更新光环视觉效果
 */
function updateAuraVisuals() {
  const healthPercent = cursorState.health / cursorState.maxHealth;
  const mood = monsterMood.current;
  const intensity = monsterMood.intensity;
  
  // 呼吸动画偏移
  const breathOffset = Math.sin(cursorState.breathPhase) * CONFIG.breathAmount;
  
  // 根据情绪获取颜色
  const moodColors = MOOD_COLORS[mood] || MOOD_COLORS.normal;
  
  // 根据血量调整半径
  const healthRadius = CONFIG.minRadius + (CONFIG.maxRadius - CONFIG.minRadius) * healthPercent;
  
  // 根据情绪调整效果强度
  let breathMultiplier = 1;
  let glowIntensity = 1;
  let sparkleChance = 0.02;
  let currentBreathSpeed = CONFIG.breathSpeed;
  
  if (mood === 'happy') {
    breathMultiplier = 1.3;
    glowIntensity = 1.2 + intensity * 0.3;
    sparkleChance = 0.05;
    currentBreathSpeed = 3;
  } else if (mood === 'sad') {
    breathMultiplier = 0.7;
    glowIntensity = 0.8;
    sparkleChance = 0.005;
    currentBreathSpeed = 1.5;
  }
  
  // 更新呼吸速度
  cursorState.breathPhase += currentBreathSpeed * dt();
  
  // 计算最终半径
  const baseRadius = healthRadius + breathOffset * breathMultiplier;
  
  // 低能量状态特殊效果（拖拽能量不足）
  const isLowEnergy = cursorState.isDragging && healthPercent < 0.3;
  
  // 虚弱状态特殊处理
  if (cursorState.isWeak) {
    // 紫色脉动
    const weakPulse = 0.5 + Math.sin(time() * 5) * 0.3;
    const weakColor = [180, 100, 220].map(c => Math.round(c * weakPulse));
    
    if (outerGlow && outerGlow.exists()) {
      outerGlow.radius = baseRadius + 15;
      outerGlow.color = rgb(150, 80, 200);
      outerGlow.opacity = 0.15 * 1.5;
    }
    if (mainRing && mainRing.exists()) {
      mainRing.radius = baseRadius;
      mainRing.color = rgb(weakColor[0], weakColor[1], weakColor[2]);
      mainRing.opacity = 0.85;
    }
    if (innerRing && innerRing.exists()) {
      innerRing.radius = baseRadius * 0.5;
      innerRing.color = rgb(150, 80, 200);
      innerRing.opacity = 0.4;
    }
    if (core && core.exists()) {
      core.radius = 4 + healthPercent * 4;
      core.color = rgb(200, 150, 255);
      core.opacity = 0.9;
    }
  } else if (isLowEnergy) {
    // 低能量拖拽：红色闪烁警示
    const redPulse = 0.6 + Math.sin(time() * 12) * 0.4;
    if (outerGlow && outerGlow.exists()) {
      outerGlow.radius = baseRadius + 10;
      outerGlow.color = rgb(255, 80, 80);
      outerGlow.opacity = 0.12 * redPulse;
    }
    if (mainRing && mainRing.exists()) {
      mainRing.radius = baseRadius * 0.7;
      mainRing.color = rgb(255, 80 + Math.floor(healthPercent * 170), 80);
      mainRing.opacity = 0.6 + Math.sin(time() * 10) * 0.3;
    }
    if (innerRing && innerRing.exists()) {
      innerRing.radius = baseRadius * 0.35;
      innerRing.color = rgb(255, 100, 100);
      innerRing.opacity = 0.3 + Math.sin(time() * 15) * 0.2;
    }
    if (core && core.exists()) {
      core.radius = 3 + healthPercent * 3;
      core.color = rgb(255, 150, 150);
      core.opacity = 0.7 + Math.sin(time() * 8) * 0.2;
    }
  } else {
    // 正常状态 - 使用情绪颜色
    if (outerGlow && outerGlow.exists()) {
      outerGlow.radius = baseRadius + 15;
      outerGlow.color = rgb(moodColors.glow[0], moodColors.glow[1], moodColors.glow[2]);
      outerGlow.opacity = (0.12 + Math.sin(time() * CONFIG.glowPulseSpeed) * 0.05) * glowIntensity;
    }
    
    if (mainRing && mainRing.exists()) {
      mainRing.radius = baseRadius;
      mainRing.color = rgb(moodColors.primary[0], moodColors.primary[1], moodColors.primary[2]);
      
      // 低血时急促脉动
      if (healthPercent < 0.3) {
        mainRing.opacity = 0.5 + Math.sin(time() * 10) * 0.35;
      } else {
        mainRing.opacity = 0.85 + Math.sin(time() * 2) * 0.05;
      }
    }
    
    if (innerRing && innerRing.exists()) {
      innerRing.radius = baseRadius * 0.5;
      innerRing.color = rgb(moodColors.secondary[0], moodColors.secondary[1], moodColors.secondary[2]);
      innerRing.opacity = 0.4 + Math.sin(time() * 3) * 0.1;
    }
    
    if (core && core.exists()) {
      const coreSize = 4 + healthPercent * 4 + Math.sin(time() * 4) * 1;
      core.radius = coreSize;
      core.color = rgb(moodColors.core[0], moodColors.core[1], moodColors.core[2]);
      core.opacity = 0.9 + Math.sin(time() * 5) * 0.1;
    }
    
    // 开心状态添加额外粒子
    if (mood === 'happy' && Math.random() < sparkleChance) {
      const posX = mainRing ? mainRing.pos.x : mousePos().x;
      const posY = mainRing ? mainRing.pos.y : mousePos().y;
      createSparkle(posX, posY, baseRadius);
    }
  }
}

/**
 * 更新血量恢复/消耗
 * 核心规则：移动不消耗能量，只有拖拽食物才消耗
 * 消耗按拖拽距离计算（拖越远耗越多）
 */
function updateHealthRecovery() {
  if (cursorState.isWeak) {
    cursorState.dragDistance = 0; // 虚弱时清除累计距离
    return;
  }
  
  if (cursorState.isDragging && cursorState.dragDistance > 0) {
    // 按累计拖拽距离消耗能量
    let costRate = cursorState.dragDistanceCost;
    if (hasBuff('weakness')) {
      costRate *= 2; // 虚弱诅咒：每像素消耗翻倍
    }
    const energyCost = cursorState.dragDistance * costRate;
    cursorState.health = Math.max(0, cursorState.health - energyCost);
    cursorState.dragDistance = 0; // 消耗后清零

    if (cursorState.health <= 0) {
      enterWeakState();
      return;
    }
  } else if (!cursorState.isDragging) {
    // 空闲时快速恢复
    cursorState.dragDistance = 0;
    if (cursorState.health < cursorState.maxHealth) {
      cursorState.health = Math.min(
        cursorState.maxHealth,
        cursorState.health + cursorState.recoveryRate * dt()
      );
    }
  }
}

/**
 * 更新拖尾效果
 */
function updateTrail() {
  const healthPercent = cursorState.health / cursorState.maxHealth;
  const mood = monsterMood.current;
  
  // 根据情绪调整拖尾长度
  let maxTrail = CONFIG.trailLength;
  if (mood === 'happy') maxTrail = 15;
  else if (mood === 'sad') maxTrail = 6;
  
  // 获取当前位置
  const currentPos = mainRing && mainRing.exists() ? mainRing.pos : mousePos();
  
  // 移动时添加拖尾粒子
  if (cursorState.isMoving && trailParticles.length < maxTrail && Math.random() < 0.5) {
    const moodColors = MOOD_COLORS[mood] || MOOD_COLORS.normal;
    const trailColor = moodColors.primary;
    
    const particle = add([
      circle(3 + healthPercent * 4),
      pos(currentPos.x, currentPos.y),
      color(trailColor[0], trailColor[1], trailColor[2]),
      opacity(0.5),
      anchor('center'),
      z(97),
      'trail-particle',
    ]);
    
    trailParticles.push({
      obj: particle,
      life: 1,
      baseRadius: 3 + healthPercent * 4,
    });
  }
  
  // 更新拖尾粒子
  for (let i = trailParticles.length - 1; i >= 0; i--) {
    const p = trailParticles[i];
    p.life -= CONFIG.trailFadeSpeed * dt();
    
    if (p.life <= 0 || !p.obj || !p.obj.exists()) {
      if (p.obj && p.obj.exists()) {
        p.obj.destroy();
      }
      trailParticles.splice(i, 1);
      continue;
    }
    
    // 渐变淡出
    p.obj.opacity = p.life * 0.5;
    p.obj.radius = p.baseRadius * p.life;
  }
}

/**
 * 创建闪烁粒子
 */
function createSparkle(x, y, radius) {
  const angle = Math.random() * Math.PI * 2;
  const dist = radius + Math.random() * 8;
  
  const sparkle = add([
    circle(2),
    pos(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist),
    color(255, 255, 255),
    opacity(0.7),
    anchor('center'),
    z(103),
    'sparkle',
  ]);
  
  sparkleParticles.push({
    obj: sparkle,
    life: 0.4,
    vx: Math.cos(angle) * 15,
    vy: Math.sin(angle) * 15,
  });
}

/**
 * 更新闪烁粒子效果
 */
function updateSparkles() {
  for (let i = sparkleParticles.length - 1; i >= 0; i--) {
    const p = sparkleParticles[i];
    p.life -= dt();
    
    if (p.life <= 0 || !p.obj || !p.obj.exists()) {
      if (p.obj && p.obj.exists()) {
        p.obj.destroy();
      }
      sparkleParticles.splice(i, 1);
      continue;
    }
    
    p.obj.pos.x += p.vx * dt();
    p.obj.pos.y += p.vy * dt();
    p.obj.opacity = p.life * 1.75;
  }
  
  // 安全阈值：防止异常情况下粒子无限增长导致卡死
  const maxTotalSparkles = CONFIG.maxSparkles + 32;
  while (sparkleParticles.length > maxTotalSparkles) {
    const p = sparkleParticles.shift();
    if (p?.obj?.exists && p.obj.exists()) {
      p.obj.destroy();
    }
  }
}

/**
 * 更新虚弱状态
 */
function updateWeakState() {
  if (cursorState.isWeak) {
    cursorState.weakTimer -= dt();
    
    if (cursorState.weakTimer <= 0) {
      exitWeakState();
    }
  }
}

/**
 * 更新呼吸动画
 */
function updateBreathAnimation() {
  // 呼吸速度在 updateAuraVisuals 中根据状态调整
}

/**
 * 更新脉冲效果
 */
function updatePulse() {
  if (pulseRing && pulseRing.exists()) {
    if (pulseOpacity > 0) {
      pulseOpacity -= dt() * 3;
      pulseRadius += dt() * 100;
      
      pulseRing.radius = pulseRadius;
      pulseRing.opacity = Math.max(0, pulseOpacity);
    } else {
      pulseRing.opacity = 0;
    }
  }
}

/**
 * 更新喂食反馈效果
 */
function updateFeedFeedback() {
  if (feedFeedback.triggered) {
    const elapsed = Date.now() - feedFeedback.timestamp;
    
    // 每次 triggerFeedFeedback 只处理一次，避免 100ms 窗口内每帧重复生成粒子
    if (feedFeedback.timestamp !== lastFeedFeedbackHandledAt && elapsed < 300) {
      lastFeedFeedbackHandledAt = feedFeedback.timestamp;
      const currentPos = mainRing && mainRing.exists() ? mainRing.pos : mousePos();
      
      if (feedFeedback.type === 'loved') {
        // 喜爱：大量爱心粒子
        for (let i = 0; i < 8; i++) {
          createHeartParticle(currentPos.x, currentPos.y);
        }
        triggerPulse('positive');
      } else if (feedFeedback.type === 'hated') {
        // 厌恶：震荡效果
        triggerPulse('negative');
      }
    }
    
    // 反馈处理完成后尽快重置
    if (elapsed > 300) {
      feedFeedback.triggered = false;
    }
  }
}

/**
 * 创建爱心粒子
 */
function createHeartParticle(x, y) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 50 + Math.random() * 100;
  
  const heart = add([
    circle(4),
    pos(x, y),
    color(255, 100, 150),
    opacity(1),
    anchor('center'),
    z(103),
    'heart-particle',
  ]);
  
  sparkleParticles.push({
    obj: heart,
    life: 0.8,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 30,
  });
}

/**
 * 进入虚弱状态
 */
function enterWeakState() {
  cursorState.isWeak = true;
  cursorState.weakTimer = cursorState.weakDuration;
  
  const currentPos = mainRing && mainRing.exists() ? mainRing.pos : mousePos();
  showWeakNotification(currentPos.x, currentPos.y);
  triggerPulse('negative');
}

/**
 * 退出虚弱状态
 */
function exitWeakState() {
  cursorState.isWeak = false;
  cursorState.health = 30;
  
  const currentPos = mainRing && mainRing.exists() ? mainRing.pos : mousePos();
  showRecoveryNotification(currentPos.x, currentPos.y);
  triggerPulse('positive');
}

/**
 * 受到伤害
 */
export function takeDamage(amount, source = 'unknown') {
  if (cursorState.isWeak) return;
  
  cursorState.health = Math.max(0, cursorState.health - amount);
  
  const currentPos = mainRing && mainRing.exists() ? mainRing.pos : mousePos();
  showDamageNumber(currentPos.x, currentPos.y, amount);
  triggerPulse('negative');
  
  if (cursorState.health <= 0) {
    enterWeakState();
    return; // 避免与 updateHealthRecovery 重复触发
  }
}

/**
 * 恢复血量
 */
export function heal(amount, source = 'unknown') {
  if (cursorState.isWeak && source !== 'time') {
    return;
  }
  
  const oldHealth = cursorState.health;
  cursorState.health = Math.min(cursorState.maxHealth, cursorState.health + amount);
  const actualHeal = cursorState.health - oldHealth;
  
  if (actualHeal > 0) {
    const currentPos = mainRing && mainRing.exists() ? mainRing.pos : mousePos();
    showHealNumber(currentPos.x, currentPos.y, actualHeal);
    triggerPulse('positive');
  }
}

/**
 * 触发脉动效果
 */
export function triggerPulse(type = 'neutral') {
  switch (type) {
    case 'positive':
      pulseColor = [100, 255, 150];
      break;
    case 'negative':
      pulseColor = [255, 100, 100];
      break;
    default:
      pulseColor = [255, 255, 255];
  }
  
  pulseRadius = CONFIG.baseRadius;
  pulseOpacity = 0.6;
  
  if (pulseRing && pulseRing.exists()) {
    pulseRing.color = rgb(pulseColor[0], pulseColor[1], pulseColor[2]);
  }
}

/**
 * 获取当前鼠标位置
 */
export function getCursorPos() {
  if (mainRing && mainRing.exists()) {
    return { x: mainRing.pos.x, y: mainRing.pos.y };
  }
  const pos = mousePos();
  return { x: pos.x, y: pos.y };
}

/**
 * 显示伤害数字
 */
function showDamageNumber(x, y, amount) {
  add([
    text(`-${Math.round(amount)}`, { size: 20 }),
    pos(x, y - 30),
    anchor('center'),
    color(255, 100, 100),
    opacity(1),
    lifespan(0.8),
    z(105),
    {
      update() {
        this.pos.y -= 40 * dt();
      }
    },
  ]);
}

/**
 * 显示恢复数字
 */
function showHealNumber(x, y, amount) {
  add([
    text(`+${Math.round(amount)}`, { size: 20 }),
    pos(x, y - 30),
    anchor('center'),
    color(100, 255, 150),
    opacity(1),
    lifespan(0.8),
    z(105),
    {
      update() {
        this.pos.y -= 40 * dt();
      }
    },
  ]);
}

/**
 * 显示虚弱状态提示（增强版——让玩家明确知道这是设计）
 */
function showWeakNotification(x, y) {
  // 主文字：大字弹跳效果
  const mainText = add([
    text('😩 拖不动啦~', { size: 36 }),
    pos(x, y - 70),
    anchor('center'),
    color(255, 200, 100),
    opacity(1),
    lifespan(2.5),
    z(105),
    {
      update() {
        this.opacity = Math.max(0, this.opacity - dt() * 0.35);
        this.pos.y -= 5 * dt(); // 缓慢上浮
      }
    },
  ]);

  // 副文字：提示恢复时间
  add([
    text(`休息 ${cursorState.weakDuration} 秒就好了...`, { size: 16 }),
    pos(x, y - 35),
    anchor('center'),
    color(180, 150, 200),
    opacity(1),
    lifespan(2.5),
    z(105),
    {
      update() {
        this.opacity = Math.max(0, this.opacity - dt() * 0.35);
        this.pos.y -= 5 * dt();
      }
    },
  ]);

  // 震荡粒子（叹号）
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
    const speed = rand(80, 150);
    add([
      text('❗', { size: 14 }),
      pos(x, y - 40),
      anchor('center'),
      opacity(0.8),
      lifespan(0.6),
      z(104),
      {
        update() {
          this.pos.x += Math.cos(angle) * speed * dt();
          this.pos.y += Math.sin(angle) * speed * dt() - 30 * dt();
          this.opacity -= dt() * 1.5;
        }
      },
    ]);
  }
}

/**
 * 显示恢复状态提示
 */
function showRecoveryNotification(x, y) {
  add([
    text('💪 恢复啦！继续喂！', { size: 24 }),
    pos(x, y - 50),
    anchor('center'),
    color(100, 255, 180),
    opacity(1),
    lifespan(1.5),
    z(105),
    {
      update() {
        this.opacity = Math.max(0, this.opacity - dt() * 0.67);
        this.pos.y -= 10 * dt();
      }
    },
  ]);
}

/**
 * 重置鼠标血量状态
 */
export function resetCursorHealth() {
  cursorState.health = 100;
  cursorState.isWeak = false;
  cursorState.isDragging = false;
  cursorState.dragDistance = 0;
  cursorState.weakTimer = 0;
  cursorState.lastPos = { x: mousePos().x, y: mousePos().y };
}

/**
 * 清理鼠标光环系统
 */
export function cleanupCursorHealth() {
  // 恢复系统鼠标
  const canvas = document.getElementById('game-container');
  if (canvas) {
    canvas.style.cursor = 'auto';
  }
  document.body.style.cursor = 'auto';
  
  // 取消更新处理器
  if (updateHandler) {
    try {
      if (typeof updateHandler.cancel === 'function') {
        updateHandler.cancel();
      } else if (typeof updateHandler === 'function') {
        updateHandler();
      }
    } catch (e) {}
    updateHandler = null;
  }
  
  // 清理拖尾粒子
  for (const p of trailParticles) {
    if (p.obj && p.obj.exists()) {
      p.obj.destroy();
    }
  }
  trailParticles = [];
  
  // 清理闪烁粒子
  for (const p of sparkleParticles) {
    if (p.obj && p.obj.exists()) {
      p.obj.destroy();
    }
  }
  sparkleParticles = [];
  
  // 清理光环组件
  if (outerGlow && outerGlow.exists()) {
    outerGlow.destroy();
  }
  if (mainRing && mainRing.exists()) {
    mainRing.destroy();
  }
  if (innerRing && innerRing.exists()) {
    innerRing.destroy();
  }
  if (core && core.exists()) {
    core.destroy();
  }
  if (pulseRing && pulseRing.exists()) {
    pulseRing.destroy();
  }
  
  outerGlow = null;
  mainRing = null;
  innerRing = null;
  core = null;
  pulseRing = null;
  lastFeedFeedbackHandledAt = 0;
}

/**
 * 获取光环实例（供外部使用）
 */
export function getCursorAura() {
  return mainRing;
}

// ═══════════════════════════════════════════════════════════
// 拖拽能量接口（供 drag.js 调用）
// ═══════════════════════════════════════════════════════════

/**
 * 开始拖拽消耗能量
 * 由 drag.js 在 startDrag 时调用
 */
export function startCursorDrag() {
  cursorState.isDragging = true;
  cursorState.dragDistance = 0;
}

/**
 * 结束拖拽（停止能量消耗）
 * 由 drag.js 在 endDrag 时调用
 */
export function endCursorDrag() {
  cursorState.isDragging = false;
}

/**
 * 获取当前拖拽阻力系数
 * @returns {number} 0-1，1=正常拖拽，0=无法拖拽
 * 
 * 规则：
 * - health > 30% → 返回 1（正常）
 * - health 1-30% → 返回 0.2~0.99（delta 衰减，粘手感）
 * - health = 0% → 返回 0（无法拖拽）
 */
export function getDragMultiplier() {
  if (cursorState.isWeak || cursorState.health <= 0) return 0;
  
  const healthPercent = cursorState.health / cursorState.maxHealth;
  
  if (healthPercent >= cursorState.lowEnergyThreshold / 100) {
    return 1; // 能量充足，正常拖拽
  }
  
  // 低能量：0.2 ~ 0.99 的阻尼系数
  // health=30% → 1.0, health=0% → 0.2
  const t = healthPercent / (cursorState.lowEnergyThreshold / 100);
  return 0.2 + t * 0.8;
}
