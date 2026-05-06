/**
 * 成就系统
 * 管理成就定义、进度检查、面板显示
 * 成就可解锁配方
 */

import { getAchievementStats } from './state.js';
import { unlockAchievementRecipes, isRecipeUnlocked, getAllRecipes } from './recipes.js';

// ──────────────────────────────────────────────────
// 成就定义
// ──────────────────────────────────────────────────

const ACHIEVEMENTS = [
  {
    id: 'first_craft',
    name: '初次合成',
    desc: '合成第一个料理',
    icon: '⚗️',
    statKey: 'totalCrafts',
    threshold: 1,
    reward: { type: 'recipe', label: '解锁：星光汤' },
  },
  {
    id: 'craft_5',
    name: '合成达人',
    desc: '合成 5 个料理',
    icon: '🔬',
    statKey: 'totalCrafts',
    threshold: 5,
    reward: { type: 'recipe', label: '解锁：大地丰收' },
  },
  {
    id: 'craft_20',
    name: '合成大师',
    desc: '合成 20 个料理',
    icon: '🏆',
    statKey: 'totalCrafts',
    threshold: 20,
    reward: { type: 'recipe', label: '解锁：元素漩涡' },
  },
  {
    id: 'feed_10',
    name: '喂食新手',
    desc: '拖拽喂食 10 次',
    icon: '🍽️',
    statKey: 'totalDragFeeds',
    threshold: 10,
    reward: { type: 'recipe', label: '解锁：甜心特调' },
  },
  {
    id: 'feed_50',
    name: '喂食达人',
    desc: '拖拽喂食 50 次',
    icon: '👨‍🍳',
    statKey: 'totalDragFeeds',
    threshold: 50,
    reward: { type: 'recipe', label: '解锁：彩虹汽水' },
  },
  {
    id: 'combo_5',
    name: '连击新星',
    desc: '在一次游戏中达到 5 连击',
    icon: '💫',
    statKey: 'maxComboEver',
    threshold: 5,
    reward: { type: 'recipe', label: '解锁：诡异三重奏' },
  },
  {
    id: 'speed_feeds_10',
    name: '极速投喂',
    desc: '触发投掷速度加成 10 次',
    icon: '🚀',
    statKey: 'totalSpeedBonuses',
    threshold: 10,
    reward: { type: 'recipe', label: '解锁：极致抽象' },
  },
  {
    id: 'hate_feeder',
    name: '勇气试炼',
    desc: '喂食厌恶食物 5 次',
    icon: '💪',
    statKey: 'totalHatedFeeds',
    threshold: 5,
    reward: null,
  },
  {
    id: 'big_feeder',
    name: '大胃王',
    desc: '拖拽喂食总计 100 次',
    icon: '🐉',
    statKey: 'totalDragFeeds',
    threshold: 100,
    reward: null,
  },
  {
    id: 'first_punish',
    name: '我的锅',
    desc: '合成出第一个惩罚配方',
    icon: '☠️',
    statKey: 'punishmentCrafts',
    threshold: 1,
    reward: null,
  },
  {
    id: 'all_recipes',
    name: '美食收藏家',
    desc: '解锁所有配方（已完成全部成就后自动达成）',
    icon: '👑',
    statKey: null,
    threshold: null,
    reward: null,
  },
];

// ──────────────────────────────────────────────────
// 状态
// ──────────────────────────────────────────────────

const ACH_SAVE_KEY = 'achievement-completed';

function loadCompletedSet() {
  try {
    const raw = localStorage.getItem(ACH_SAVE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
}

function saveCompletedSet(set) {
  localStorage.setItem(ACH_SAVE_KEY, JSON.stringify([...set]));
}

let completedAchievements = loadCompletedSet();

// ──────────────────────────────────────────────────
// 对外接口
// ──────────────────────────────────────────────────

/**
 * 初始化成就系统
 */
export function initAchievements() {
  completedAchievements = loadCompletedSet();
}

/**
 * 获取所有成就定义
 */
export function getAllAchievements() {
  return ACHIEVEMENTS;
}

/**
 * 检查成就是否已完成
 */
export function isAchievementCompleted(id) {
  return completedAchievements.has(id);
}

/**
 * 获取成就的当前进度
 * @returns {object} { current, max, percent }
 */
export function getAchievementProgress(achievement) {
  if (achievement.id === 'all_recipes') {
    // 特殊成就：全部配方解锁
    const total = getAllRecipes().length;
    const unlocked = getAllRecipes().filter(r => isRecipeUnlocked(r.id)).length;
    return { current: unlocked, max: total, percent: total > 0 ? (unlocked / total) * 100 : 0 };
  }
  const stats = getAchievementStats();
  const current = stats[achievement.statKey] || 0;
  return { current, max: achievement.threshold, percent: Math.min(100, (current / achievement.threshold) * 100) };
}

/**
 * 检查成就进度，触发完成事件
 * 每次喂食/合成后调用
 */
export function checkAchievements() {
  const stats = getAchievementStats();
  let newlyCompleted = [];

  for (const ach of ACHIEVEMENTS) {
    if (completedAchievements.has(ach.id)) continue;

    let isCompleted = false;

    if (ach.id === 'all_recipes') {
      // 全部配方解锁 + 其他成就全部完成
      const allOthersDone = ACHIEVEMENTS.filter(a => a.id !== 'all_recipes').every(a => completedAchievements.has(a.id));
      const totalRecipes = getAllRecipes().length;
      const unlockedRecipes = getAllRecipes().filter(r => isRecipeUnlocked(r.id)).length;
      isCompleted = allOthersDone && unlockedRecipes >= totalRecipes;
    } else {
      const currentVal = stats[ach.statKey] || 0;
      isCompleted = currentVal >= ach.threshold;
    }

    if (isCompleted) {
      completedAchievements.add(ach.id);
      saveCompletedSet(completedAchievements);
      newlyCompleted.push(ach);

      // 成就奖励：解锁配方
      if (ach.reward && ach.reward.type === 'recipe') {
        unlockAchievementRecipes(ach.id);
      }
    }
  }

  if (newlyCompleted.length > 0) {
    // 触发成就完成事件
    try {
      window.dispatchEvent(new CustomEvent('achievement:completed', {
        detail: { achievements: newlyCompleted }
      }));
    } catch (e) {}
  }

  return newlyCompleted;
}

/**
 * 打开成就面板
 */
let panelOpen = false;

export function openAchievementPanel() {
  const modal = document.getElementById('achievement-modal');
  if (modal) {
    modal.classList.add('active');
    panelOpen = true;
    renderAchievementList();
  }
}

export function closeAchievementPanel() {
  const modal = document.getElementById('achievement-modal');
  if (modal) {
    modal.classList.remove('active');
    panelOpen = false;
  }
}

export function refreshAchievementPanel() {
  if (panelOpen) {
    renderAchievementList();
  }
}

// ──────────────────────────────────────────────────
// 面板渲染
// ──────────────────────────────────────────────────

function renderAchievementList() {
  const container = document.getElementById('achievement-list');
  const progressEl = document.getElementById('achievement-progress');
  if (!container) return;

  const total = ACHIEVEMENTS.length;
  const completed = completedAchievements.size;

  if (progressEl) {
    progressEl.textContent = `已完成 ${completed}/${total}`;
  }

  container.innerHTML = '';

  ACHIEVEMENTS.forEach(ach => {
    const done = completedAchievements.has(ach.id);
    const prog = getAchievementProgress(ach);

    const item = document.createElement('div');
    item.className = `achievement-item ${done ? 'achievement-done' : ''}`;
    item.style.cssText = `
      background: ${done ? 'rgba(100, 200, 100, 0.08)' : '#2a2a3a'};
      border-radius: 8px;
      border: 2px solid ${done ? '#4a8' : '#3a3a4a'};
      padding: 12px 16px;
      margin-bottom: 8px;
      transition: background 0.2s;
      opacity: ${done ? 0.8 : 1};
    `;

    // 进度条
    const barPercent = Math.min(100, prog.percent);
    const barColor = done ? '#4a8' : (barPercent > 0 ? '#6a9fd5' : '#444');

    item.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 22px;">${ach.icon}</span>
          <span style="color: ${done ? '#8d8' : '#fff'}; font-size: 14px; font-weight: 500;">
            ${ach.name}
            ${done ? '<span style="color: #4a8; font-size: 12px; margin-left: 6px;">✅ 已完成</span>' : ''}
          </span>
        </div>
        ${done ? '' : `<span style="color: #999; font-size: 12px;">${prog.current}/${prog.max}</span>`}
      </div>
      <div style="color: #999; font-size: 11px; margin-bottom: 6px;">${ach.desc}</div>
      ${done ? '' : `
        <div style="width: 100%; height: 6px; background: #1a1a2a; border-radius: 3px; overflow: hidden;">
          <div style="width: ${barPercent}%; height: 100%; background: ${barColor}; border-radius: 3px; transition: width 0.3s;"></div>
        </div>
      `}
      ${ach.reward ? `
        <div style="margin-top: 6px; font-size: 11px; color: ${done ? '#4a8' : '#779'};">
          ${done ? '✅ ' : '🎁 '}${ach.reward.label}
        </div>
      ` : ''}
    `;

    container.appendChild(item);
  });
}

/**
 * 创建成就按钮（Canvas 中的按钮）
 */
export function createAchievementButton() {
  const btn = add([
    rect(100, 36),
    pos(width() - 130, 150),
    anchor('topleft'),
    color(60, 60, 90),
    outline(2, rgb(100, 100, 140)),
    z(30),
    fixed(),
    area(),
  ]);

  btn.add([text('🏆', { size: 18 }), pos(20, 18), anchor('center')]);
  btn.add([text('成就', { size: 16 }), pos(60, 18), anchor('center'), color(200, 200, 220)]);

  btn.onHover(() => btn.color = rgb(80, 80, 120));
  btn.onHoverEnd(() => btn.color = rgb(60, 60, 90));
  btn.onClick(() => isAchievementPanelOpen() ? closeAchievementPanel() : openAchievementPanel());

  onUpdate(() => btn.pos.x = width() - 130);
}

export function isAchievementPanelOpen() {
  return panelOpen;
}

/**
 * 初始化成就面板系统
 */
export function initAchievementPanelSystem() {
  createAchievementButton();

  // 注册全局关闭函数
  window.closeAchievementPanel = closeAchievementPanel;

  // 点击遮罩关闭
  const modal = document.getElementById('achievement-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAchievementPanel();
      }
    });
  }

  // 监听成就完成事件，刷新面板
  try {
    window.addEventListener('achievement:completed', () => {
      refreshAchievementPanel();
    });
  } catch (e) {}
}
