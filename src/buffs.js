/**
 * Buff 系统模块
 * 管理料理产物的即时临时效果
 */

// 当前活跃的 buff 列表
let activeBuffs = [];

// Buff UI 引用
let buffBarContainer = null;
let buffIcons = [];

/**
 * Buff 类型定义
 * 每种 buff 有唯一 id、显示名、颜色、图标
 */
export const BUFF_TYPES = {
  // 饱食度不下降
  hungerFreeze: {
    id: 'hungerFreeze',
    name: '饱食守护',
    description: '饱食度暂停下降',
    icon: '🛡️',
    color: [100, 200, 255],
  },
  // 饱食度下降减半
  hungerDrainHalf: {
    id: 'hungerDrainHalf',
    name: '元素循环',
    description: '饱食度下降速度减半',
    icon: '♻️',
    color: [120, 200, 180],
  },
  // 生命值不下降
  healthFreeze: {
    id: 'healthFreeze',
    name: '液态护盾',
    description: '生命值暂停下降',
    icon: '💚',
    color: [100, 255, 150],
  },
  // 全局分数倍率
  scoreMultiplier: {
    id: 'scoreMultiplier',
    name: '饱餐盛宴',
    description: '所有食物得分翻倍',
    icon: '⭐',
    color: [255, 215, 0],
  },
  // 食物生成速度加快
  foodSpawnRate: {
    id: 'foodSpawnRate',
    name: '食物丰收',
    description: '食物生成速度翻倍',
    icon: '🌾',
    color: [180, 255, 100],
  },
  // 忽略厌恶（厌恶食物视为普通）
  ignoreHate: {
    id: 'ignoreHate',
    name: '虚空侵蚀',
    description: '厌恶食物视为普通',
    icon: '🌀',
    color: [170, 120, 255],
  },
  // 特定类别加成
  categoryBonus: {
    id: 'categoryBonus',
    name: '属性共鸣',
    description: '特定类别食物得分翻倍',
    icon: '🔮',
    color: [255, 150, 200],
  },
  // 诅咒增幅：高分但加速饥饿
  cursedBoost: {
    id: 'cursedBoost',
    name: '诅咒增幅',
    description: '得分×2.5，饱食度加速下降',
    icon: '💀',
    color: [200, 50, 50],
  },
  // 完美早餐：全面增益
  megaBoost: {
    id: 'megaBoost',
    name: '完美早餐',
    description: '食物密度2倍，所有得分2倍',
    icon: '👑',
    color: [255, 215, 0],
  },
  // ═══ 惩罚 debuff（由惩罚配方触发）═══
  // 饱食加速：饱食度下降加速（惩罚）
  foodSpoil: {
    id: 'foodSpoil',
    name: '食物腐败',
    description: '饱食度下降速度翻倍',
    icon: '💀',
    color: [80, 180, 80],
  },
  // 虚弱诅咒：拖拽阻力加重（惩罚）
  weakness: {
    id: 'weakness',
    name: '虚弱诅咒',
    description: '拖拽食物消耗加快',
    icon: '⚡',
    color: [150, 80, 200],
  },
};

/**
 * 应用一个 buff
 * @param {string} buffTypeId - BUFF_TYPES 中的 key
 * @param {number} duration - 持续时间（秒）
 * @param {object} params - 额外参数（如 category、multiplier 等）
 */
export function applyBuff(buffTypeId, duration, params = {}) {
  const buffDef = BUFF_TYPES[buffTypeId];
  if (!buffDef) {
    console.warn(`[Buff] 未知 buff 类型: ${buffTypeId}`);
    return;
  }

  // 如果同类型 buff 已存在，刷新时间并合并参数
  const existing = activeBuffs.find(b => b.typeId === buffTypeId);
  if (existing) {
    existing.remaining = duration;
    existing.params = { ...existing.params, ...params };
    existing.pulseTimer = 0; // 重置脉冲动画
    console.log(`[Buff] 刷新 ${buffDef.name}，持续 ${duration}s`);
  } else {
    activeBuffs.push({
      typeId: buffTypeId,
      remaining: duration,
      maxDuration: duration,
      params,
      pulseTimer: 0,
    });
    console.log(`[Buff] 激活 ${buffDef.name}，持续 ${duration}s`);
  }

  // 显示 buff 激活特效
  showBuffActivateEffect(buffDef, duration);
}

/**
 * 检查是否有某个 buff 处于激活状态
 */
export function hasBuff(buffTypeId) {
  return activeBuffs.some(b => b.typeId === buffTypeId);
}

/**
 * 获取某个 buff 的参数
 */
export function getBuffParams(buffTypeId) {
  const buff = activeBuffs.find(b => b.typeId === buffTypeId);
  return buff ? buff.params : null;
}

/**
 * 获取全局分数倍率（考虑所有影响分数的 buff）
 */
export function getScoreMultiplier() {
  let multiplier = 1;

  // 饱餐盛宴：全局2倍
  if (hasBuff('scoreMultiplier')) {
    multiplier *= 2;
  }

  // 诅咒增幅：2.5倍
  if (hasBuff('cursedBoost')) {
    multiplier *= 2.5;
  }

  // 完美早餐：2倍
  if (hasBuff('megaBoost')) {
    multiplier *= 2;
  }

  // 事件系统倍率
  try {
    if (window.__eventScoreMultiplier) multiplier *= 3;
    if (window.__eventScoreHalved) multiplier *= 0.5;
  } catch (e) {}

  return multiplier;
}

/**
 * 获取食物生成间隔倍率（值越小生成越快）
 */
export function getFoodSpawnIntervalMultiplier() {
  let multiplier = 1;

  // 食物丰收：间隔减半（生成更快）
  if (hasBuff('foodSpawnRate')) {
    multiplier *= 0.5;
  }

  // 完美早餐：间隔减半
  if (hasBuff('megaBoost')) {
    multiplier *= 0.5;
  }

  return multiplier;
}

/**
 * 获取饱食度下降倍率
 */
export function getHungerDrainMultiplier() {
  let multiplier = 1;

  // 饱食守护：不下降
  if (hasBuff('hungerFreeze')) {
    return 0;
  }

  // 元素循环：减半
  if (hasBuff('hungerDrainHalf')) {
    multiplier *= 0.5;
  }

  // 诅咒增幅：加速
  if (hasBuff('cursedBoost')) {
    multiplier *= 2;
  }

  // 食物腐败：加速（惩罚）
  if (hasBuff('foodSpoil')) {
    multiplier *= 1.5;
  }

  return multiplier;
}

/**
 * 检查生命值是否应该下降
 */
export function shouldHealthDrain() {
  // 液态护盾：不下降
  if (hasBuff('healthFreeze')) {
    return false;
  }
  return true;
}

/**
 * 检查是否忽略厌恶
 */
export function shouldIgnoreHate() {
  return hasBuff('ignoreHate') || hasBuff('megaBoost');
}

/**
 * 获取特定类别的加成倍率
 * @param {string} category - 食物类别
 */
export function getCategoryBonus(category) {
  let multiplier = 1;

  // 属性共鸣：特定类别加成
  for (const buff of activeBuffs) {
    if (buff.typeId === 'categoryBonus' && buff.params.category === category) {
      multiplier *= (buff.params.multiplier || 2);
    }
  }

  return multiplier;
}

/**
 * 获取所有活跃 buff
 */
export function getActiveBuffs() {
  return [...activeBuffs];
}

/**
 * 更新所有 buff 的计时器
 * @param {number} dt - 帧间隔
 */
export function updateBuffs(dt) {
  for (let i = activeBuffs.length - 1; i >= 0; i--) {
    const buff = activeBuffs[i];
    buff.remaining -= dt;
    buff.pulseTimer += dt;

    // buff 过期
    if (buff.remaining <= 0) {
      const buffDef = BUFF_TYPES[buff.typeId];
      if (buffDef) {
        console.log(`[Buff] ${buffDef.name} 已过期`);
        showBuffExpireEffect(buffDef);
      }
      activeBuffs.splice(i, 1);
    }
  }
}

/**
 * 清除所有 buff（游戏重置时使用）
 */
export function clearAllBuffs() {
  activeBuffs = [];
}

// ========== UI 部分 ==========

/**
 * 创建 buff 栏 UI
 */
export function createBuffBar() {
  buffBarContainer = add([
    pos(10, 160),
    z(50),
    fixed(),
    'buff-bar',
  ]);

  // 标题
  buffBarContainer.add([
    text('BUFF', { size: 12 }),
    pos(0, 0),
    color(180, 180, 200),
    opacity(0.6),
  ]);

  return buffBarContainer;
}

/**
 * 更新 buff 栏的显示
 */
export function updateBuffBarDisplay() {
  if (!buffBarContainer || !buffBarContainer.exists()) return;

  // 清理旧的图标
  for (const icon of buffIcons) {
    if (icon && icon.exists && icon.exists()) {
      icon.destroy();
    }
  }
  buffIcons = [];

  // 为每个活跃 buff 创建图标
  activeBuffs.forEach((buff, index) => {
    const buffDef = BUFF_TYPES[buff.typeId];
    if (!buffDef) return;

    const yPos = 20 + index * 40;
    const progress = buff.remaining / buff.maxDuration;

    // 背景条
    const bgBar = buffBarContainer.add([
      rect(120, 32),
      pos(0, yPos),
      color(buffDef.color[0] * 0.2, buffDef.color[1] * 0.2, buffDef.color[2] * 0.2),
      opacity(0.7),
      z(0),
    ]);

    // 进度条
    const progressBar = buffBarContainer.add([
      rect(120 * progress, 32),
      pos(0, yPos),
      color(buffDef.color[0], buffDef.color[1], buffDef.color[2]),
      opacity(0.4),
      z(1),
    ]);

    // 即将过期时闪烁
    let finalOpacity = 0.4;
    if (buff.remaining < 3) {
      finalOpacity = 0.2 + Math.sin(buff.pulseTimer * 8) * 0.3;
    }
    progressBar.opacity = finalOpacity;

    // 图标 + 名称
    const iconText = buffBarContainer.add([
      text(`${buffDef.icon} ${buffDef.name}`, { size: 12 }),
      pos(5, yPos + 4),
      color(255, 255, 255),
      opacity(buff.remaining < 3 ? 0.5 + Math.sin(buff.pulseTimer * 8) * 0.5 : 1),
      z(2),
    ]);

    // 剩余时间
    const timeText = buffBarContainer.add([
      text(`${Math.ceil(buff.remaining)}s`, { size: 10 }),
      pos(100, yPos + 8),
      color(buffDef.color[0], buffDef.color[1], buffDef.color[2]),
      opacity(buff.remaining < 3 ? 0.5 + Math.sin(buff.pulseTimer * 8) * 0.5 : 1),
      z(2),
    ]);

    buffIcons.push(bgBar, progressBar, iconText, timeText);
  });
}

// ========== 特效部分 ==========

/**
 * Buff 激活特效
 */
function showBuffActivateEffect(buffDef, duration) {
  const centerX = width() / 2;
  const centerY = height() / 2 - 50;

  // 光环扩散
  add([
    circle(30),
    pos(centerX, centerY),
    color(buffDef.color[0], buffDef.color[1], buffDef.color[2]),
    opacity(0.6),
    anchor('center'),
    z(30),
    {
      life: 0.8,
      update() {
        this.life -= dt();
        const expandProgress = 1 - this.life / 0.8;
        this.scale = vec2(1 + expandProgress * 4);
        this.opacity = this.life * 0.75;
        if (this.life <= 0) this.destroy();
      }
    },
  ]);

  // Buff 名称浮动文字
  add([
    text(`${buffDef.icon} ${buffDef.name}`, { size: 22 }),
    pos(centerX, centerY - 30),
    anchor('center'),
    color(buffDef.color[0], buffDef.color[1], buffDef.color[2]),
    opacity(1),
    z(31),
    {
      life: 1.5,
      update() {
        this.life -= dt();
        this.pos.y -= 35 * dt();
        this.opacity = Math.min(1, this.life);
        if (this.life <= 0) this.destroy();
      }
    },
  ]);

  // 持续时间提示
  add([
    text(`持续 ${duration} 秒`, { size: 14 }),
    pos(centerX, centerY + 5),
    anchor('center'),
    color(220, 220, 240),
    opacity(0.8),
    z(31),
    {
      life: 1.2,
      update() {
        this.life -= dt();
        this.pos.y -= 25 * dt();
        this.opacity = Math.min(0.8, this.life * 0.8);
        if (this.life <= 0) this.destroy();
      }
    },
  ]);

  // 粒子散射
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const speed = rand(100, 200);
    add([
      circle(rand(3, 6)),
      pos(centerX, centerY),
      color(buffDef.color[0], buffDef.color[1], buffDef.color[2]),
      opacity(0.8),
      lifespan(0.6),
      z(30),
      {
        update() {
          this.pos.x += Math.cos(angle) * speed * dt();
          this.pos.y += Math.sin(angle) * speed * dt();
          this.opacity -= dt() * 1.5;
        }
      },
    ]);
  }
}

/**
 * Buff 过期特效
 */
function showBuffExpireEffect(buffDef) {
  const centerX = width() / 2;
  const centerY = height() / 2 - 50;

  add([
    text(`${buffDef.icon} ${buffDef.name} 结束`, { size: 16 }),
    pos(centerX, centerY - 10),
    anchor('center'),
    color(150, 150, 170),
    opacity(0.7),
    z(31),
    {
      life: 1,
      update() {
        this.life -= dt();
        this.pos.y -= 20 * dt();
        this.opacity = this.life * 0.7;
        if (this.life <= 0) this.destroy();
      }
    },
  ]);
}
