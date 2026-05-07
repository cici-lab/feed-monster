/**
 * 随机事件系统
 * 每隔一段时间随机触发特殊事件，效果强于普通buff
 * 包含正面和负面事件，增加游戏不可预测性
 */

import { gameState, addScore } from './state.js';
import { hasBuff, applyBuff } from './buffs.js';

// ── 事件状态 ──
let activeEvent = null;       // 当前活跃的事件对象
let eventTimer = 0;           // 距下一次事件的倒计时
let eventIntervalMin = 8;    // 事件最小间隔（秒）
let eventIntervalMax = 15;    // 事件最大间隔（秒）
let eventTimeoutId = null;    // setTimeout ID

// ── 事件类型常量（供外部判断）──
export const EVENT_TYPES = {
  FOOD_RAIN: 'food_rain',
  SCORE_BOOST: 'score_boost',
  HUNGER_FILL: 'hunger_fill',
  ENERGY_RESTORE: 'energy_restore',
  JOY_BURST: 'joy_burst',
  GRAVITY_FLIP: 'gravity_flip',
  ENERGY_LEAK: 'energy_leak',
  HUNGER_CRISIS: 'hunger_crisis',
  DARK_SHROUD: 'dark_shroud',
  MYSTERY_VISITOR: 'mystery_visitor',
};

// ── 事件定义 ──
const EVENTS = [
  // ═══ 正面事件 ═══
  {
    id: EVENT_TYPES.FOOD_RAIN,
    name: '食材风暴',
    icon: '🌧️',
    type: 'positive',
    description: '大量食材从天而降！',
    color: [100, 200, 255],
    effect: '持续8秒快速生成食物',
    duration: 8,
    weight: 3,
  },
  {
    id: EVENT_TYPES.SCORE_BOOST,
    name: '双倍狂欢',
    icon: '🎉',
    type: 'positive',
    description: '所有得分翻三倍！',
    color: [255, 215, 0],
    effect: '得分×3，持续12秒',
    duration: 12,
    weight: 2,
  },
  {
    id: EVENT_TYPES.HUNGER_FILL,
    name: '饱食祝福',
    icon: '🍖',
    type: 'positive',
    description: '怪兽饱食度瞬间回满！',
    color: [255, 180, 80],
    effect: '饱食度恢复至100',
    duration: 0, // 即时
    weight: 3,
  },
  {
    id: EVENT_TYPES.ENERGY_RESTORE,
    name: '能量涌动',
    icon: '⚡',
    type: 'positive',
    description: '鼠标能量完全恢复！',
    color: [100, 255, 200],
    effect: '鼠标能量恢复至100',
    duration: 0, // 即时
    weight: 3,
  },
  {
    id: EVENT_TYPES.JOY_BURST,
    name: '好感爆发',
    icon: '💖',
    type: 'positive',
    description: '怪兽开心值暴涨！',
    color: [255, 100, 200],
    effect: '开心值大幅提升',
    duration: 0,
    weight: 2,
  },
  {
    id: EVENT_TYPES.MYSTERY_VISITOR,
    name: '神秘访客',
    icon: '👽',
    type: 'positive',
    description: '一只稀有食材出现了！',
    color: [200, 100, 255],
    effect: '生成一个稀有食材',
    duration: 0,
    weight: 1, // 稀有
  },

  // ═══ 负面事件 ═══
  {
    id: EVENT_TYPES.GRAVITY_FLIP,
    name: '引力异常',
    icon: '🌀',
    type: 'negative',
    description: '食材飘动速度翻倍！',
    color: [200, 100, 100],
    effect: '食材移动加速，持续8秒',
    duration: 8,
    weight: 3,
  },
  {
    id: EVENT_TYPES.ENERGY_LEAK,
    name: '能量泄漏',
    icon: '🔋',
    type: 'negative',
    description: '鼠标能量快速流失！',
    color: [255, 80, 80],
    effect: '鼠标能量下降30点',
    duration: 0,
    weight: 3,
  },
  {
    id: EVENT_TYPES.HUNGER_CRISIS,
    name: '饱食危机',
    icon: '😵',
    type: 'negative',
    description: '怪兽突然饿了……',
    color: [150, 200, 100],
    effect: '饱食度下降30点',
    duration: 0,
    weight: 2,
  },
  {
    id: EVENT_TYPES.DARK_SHROUD,
    name: '暗影笼罩',
    icon: '🌑',
    type: 'negative',
    description: '黑暗降临，得分减半！',
    color: [120, 80, 160],
    effect: '得分减半，持续10秒',
    duration: 10,
    weight: 2,
  },
];

/**
 * 获取总权重
 */
function getTotalWeight() {
  return EVENTS.reduce((sum, e) => sum + e.weight, 0);
}

/**
 * 按权重随机选择一个事件
 */
function pickRandomEvent() {
  const totalWeight = getTotalWeight();
  let roll = Math.random() * totalWeight;
  for (const event of EVENTS) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return EVENTS[0];
}

/**
 * 重置事件计时器
 */
function resetTimer() {
  const interval = eventIntervalMin + Math.random() * (eventIntervalMax - eventIntervalMin);
  eventTimer = interval;
}

/**
 * 执行事件
 */
function triggerEvent(eventDef) {
  if (activeEvent) return;

  activeEvent = eventDef;
  console.log('[Event] 触发:', eventDef.name);

  // 广播事件触发
  try {
    window.dispatchEvent(new CustomEvent('game:event', {
      detail: { event: eventDef }
    }));
  } catch (e) {}

  // 执行事件效果
  switch (eventDef.id) {
    case EVENT_TYPES.FOOD_RAIN:
      window.__eventFastFood = true;
      setTimeout(() => { window.__eventFastFood = false; }, eventDef.duration * 1000);
      break;

    case EVENT_TYPES.SCORE_BOOST:
      applyBuff('scoreMultiplier', eventDef.duration);
      // 再额外叠一层让得分×3（scoreMultiplier是×2，叠加两次得×4，这里清掉再做一次特殊处理）
      // 实际上我们用一个特殊标记来处理
      window.__eventScoreMultiplier = true;
      setTimeout(() => { window.__eventScoreMultiplier = false; }, eventDef.duration * 1000);
      break;

    case EVENT_TYPES.HUNGER_FILL:
      gameState.hunger = 100;
      break;

    case EVENT_TYPES.ENERGY_RESTORE:
      // 通过事件通知 cursorHealth 恢复
      try {
        window.dispatchEvent(new CustomEvent('cursor:restore'));
      } catch (e) {}
      break;

    case EVENT_TYPES.JOY_BURST:
      gameState.happiness = Math.min(100, (gameState.happiness || 50) + 30);
      break;

    case EVENT_TYPES.MYSTERY_VISITOR:
      // 通过事件通知生成稀有食物
      try {
        window.dispatchEvent(new CustomEvent('game:spawnRare'));
      } catch (e) {}
      break;

    case EVENT_TYPES.GRAVITY_FLIP:
      window.__eventFastFood = true;
      setTimeout(() => { window.__eventFastFood = false; }, eventDef.duration * 1000);
      break;

    case EVENT_TYPES.ENERGY_LEAK:
      try {
        window.dispatchEvent(new CustomEvent('cursor:drain', { detail: { amount: 30 } }));
      } catch (e) {}
      break;

    case EVENT_TYPES.HUNGER_CRISIS:
      gameState.hunger = Math.max(0, gameState.hunger - 30);
      break;

    case EVENT_TYPES.DARK_SHROUD:
      window.__eventScoreHalved = true;
      setTimeout(() => { window.__eventScoreHalved = false; }, eventDef.duration * 1000);
      break;
  }

  // 非持续事件在显示后立即清除
  if (eventDef.duration === 0) {
    setTimeout(() => {
      activeEvent = null;
      resetTimer();
    }, 2000);
  } else {
    // 持续事件在持续时间结束后清除
    setTimeout(() => {
      activeEvent = null;
      resetTimer();
    }, eventDef.duration * 1000 + 500);
  }
}

/**
 * 每帧更新——检查事件计时器
 * @param {number} dt - 帧间隔
 */
export function updateEvents(dt) {
  if (activeEvent) return; // 已有事件，不生成新事件

  eventTimer -= dt;
  if (eventTimer <= 0) {
    const event = pickRandomEvent();
    triggerEvent(event);
    // 事件触发后，timer在事件结束后重置
    return true;
  }
  return false;
}

/**
 * 获取当前活跃事件（用于UI显示）
 */
export function getActiveEvent() {
  return activeEvent;
}

/**
 * 检查是否有事件活跃
 */
export function hasActiveEvent() {
  return activeEvent !== null;
}

/**
 * 获取事件得分倍率
 * 返回 1（正常）或 0.5（暗影笼罩时）
 */
export function getEventScoreMultiplier() {
  if (window.__eventScoreMultiplier) return 3;
  if (window.__eventScoreHalved) return 0.5;
  return 1;
}

/**
 * 获取食物速度倍率
 */
export function getEventFoodSpeedMultiplier() {
  if (window.__eventFastFood) return 3;
  return 1;
}

/**
 * 初始化事件系统
 */
export function initEventSystem() {
  resetTimer();
  activeEvent = null;
  window.__eventScoreMultiplier = false;
  window.__eventFastFood = false;
  window.__eventScoreHalved = false;

  // 避免重复注册事件监听器
  if (window.__eventsInitialized) return;
  window.__eventsInitialized = true;

  window.addEventListener('game:event', (e) => {
    showEventNotification(e.detail.event);
  });
}

/**
 * 显示事件通知（大字屏幕中央提示）
 */
function showEventNotification(eventDef) {
  const centerX = 600;
  const centerY = 300;

  // 背景闪光
  const flashColor = eventDef.type === 'positive' ? [100, 255, 150] : [255, 100, 100];
  add([
    rect(width(), height()),
    color(flashColor[0], flashColor[1], flashColor[2]),
    opacity(0),
    z(200),
    fixed(),
    'event-flash',
    {
      life: 0.6,
      update() {
        this.life -= dt();
        if (this.life > 0.5) {
          this.opacity = (0.6 - this.life) * 2 * 0.15;
        } else {
          this.opacity = this.life * 2 * 0.15;
        }
        if (this.life <= 0) this.destroy();
      }
    },
  ]);

  // 事件图标（大号）
  add([
    text(eventDef.icon, { size: 60 }),
    pos(centerX, centerY - 60),
    anchor('center'),
    opacity(1),
    z(210),
    {
      life: 1.5,
      update() {
        this.life -= dt();
        this.pos.y -= 20 * dt();
        this.opacity = Math.min(1, this.life);
        if (this.life <= 0) this.destroy();
      }
    },
  ]);

  // 事件名称
  const nameColor = eventDef.type === 'positive' ? [100, 255, 180] : [255, 150, 150];
  add([
    text(eventDef.name, { size: 36, bold: true }),
    pos(centerX, centerY),
    anchor('center'),
    color(nameColor[0], nameColor[1], nameColor[2]),
    opacity(1),
    z(210),
    {
      life: 1.8,
      update() {
        this.life -= dt();
        this.pos.y -= 15 * dt();
        this.opacity = Math.min(1, this.life);
        if (this.life <= 0) this.destroy();
      }
    },
  ]);

  // 事件描述
  add([
    text(eventDef.description, { size: 18 }),
    pos(centerX, centerY + 45),
    anchor('center'),
    color(220, 220, 240),
    opacity(1),
    z(209),
    {
      life: 1.8,
      update() {
        this.life -= dt();
        this.pos.y -= 15 * dt();
        this.opacity = Math.min(0.8, this.life);
        if (this.life <= 0) this.destroy();
      }
    },
  ]);

  // 类型标签
  const tagColor = eventDef.type === 'positive' ? [80, 200, 120] : [200, 80, 80];
  add([
    text(eventDef.type === 'positive' ? '✨ 正面事件' : '💀 负面事件', { size: 14 }),
    pos(centerX, centerY + 75),
    anchor('center'),
    color(tagColor[0], tagColor[1], tagColor[2]),
    opacity(0.7),
    z(209),
    {
      life: 1.5,
      update() {
        this.life -= dt();
        this.opacity = Math.min(0.7, this.life * 0.5);
        if (this.life <= 0) this.destroy();
      }
    },
  ]);
}

/**
 * 重置事件系统（游戏重启时调用）
 */
export function resetEvents() {
  activeEvent = null;
  resetTimer();
  window.__eventScoreMultiplier = false;
  window.__eventFastFood = false;
  window.__eventScoreHalved = false;
}
