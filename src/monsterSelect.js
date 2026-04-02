/**
 * 怪兽选择模块
 * 处理怪兽选择界面的显示和交互
 */

import { MONSTER_TYPES, setMonsterType, loadSavedMonsterType } from './monster.js';

let selectedMonsterId = null;
let onSelectCallback = null;

/**
 * 怪兽预览图标（SVG 精灵图）
 */
const MONSTER_PREVIEWS = {
  default: {
    svg: '/assets/monster-default.svg',
    bgGradient: 'linear-gradient(135deg, #2d9a52, #1a5a32)',
  },
  mike: {
    svg: '/assets/monster-mike.svg',
    bgGradient: 'linear-gradient(135deg, #50d878, #1a8848)',
  },
  fang: {
    svg: '/assets/monster-fang.svg',
    bgGradient: 'linear-gradient(135deg, #8858b8, #4a2080)',
  },
};

/**
 * 初始化怪兽选择系统
 */
export function initMonsterSelectSystem() {
  // 加载之前保存的选择
  loadSavedMonsterType();
}

/**
 * 显示怪兽选择界面
 * @param {Function} onSelect - 选择完成后的回调函数
 */
export function showMonsterSelect(onSelect) {
  onSelectCallback = onSelect;
  
  const modal = document.getElementById('monster-select-modal');
  if (!modal) return;
  
  modal.classList.add('active');
  renderMonsterGrid();
  
  // 重置选择状态
  selectedMonsterId = null;
  updateMonsterInfo(null);
  updateConfirmButton();
}

/**
 * 隐藏怪兽选择界面
 */
export function hideMonsterSelect() {
  const modal = document.getElementById('monster-select-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

/**
 * 渲染怪兽选择网格
 */
function renderMonsterGrid() {
  const grid = document.getElementById('monster-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  Object.entries(MONSTER_TYPES).forEach(([id, config]) => {
    const card = document.createElement('div');
    card.className = 'monster-card';
    card.dataset.monsterId = id;
    
    const preview = MONSTER_PREVIEWS[id] || MONSTER_PREVIEWS.default;
    
    card.innerHTML = `
      <div class="monster-card-preview" style="background: ${preview.bgGradient}">
        <img src="${preview.svg}" alt="${config.name}" class="monster-preview-img" />
      </div>
      <div class="monster-card-name">${config.name}</div>
      <div class="monster-card-ability">${getAbilityText(config.specialAbility)}</div>
    `;
    
    card.addEventListener('click', () => selectMonster(id));
    card.addEventListener('mouseenter', () => showMonsterPreview(id));
    
    grid.appendChild(card);
  });
}

/**
 * 获取特殊能力文本
 */
function getAbilityText(ability) {
  const abilities = {
    null: '基础怪兽',
    'recipe_hint': '可查看配方提示',
    'weird_food_bonus': '奇怪食物友好',
  };
  return abilities[ability] || '基础怪兽';
}

/**
 * 选择怪兽
 */
function selectMonster(monsterId) {
  selectedMonsterId = monsterId;
  
  // 更新选中状态
  document.querySelectorAll('.monster-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.monsterId === monsterId);
  });
  
  // 更新信息面板
  updateMonsterInfo(monsterId);
  updateConfirmButton();
}

/**
 * 显示怪兽预览（悬停时）
 */
function showMonsterPreview(monsterId) {
  updateMonsterInfo(monsterId);
}

/**
 * 更新怪兽信息面板
 */
function updateMonsterInfo(monsterId) {
  const nameEl = document.getElementById('monster-info-name');
  const descEl = document.getElementById('monster-info-desc');
  const statsEl = document.getElementById('monster-info-stats');
  
  if (!nameEl || !descEl || !statsEl) return;
  
  if (!monsterId) {
    nameEl.textContent = '请选择一只怪兽';
    descEl.textContent = '点击上方的怪兽卡片查看详情';
    statsEl.innerHTML = '';
    return;
  }
  
  const config = MONSTER_TYPES[monsterId];
  if (!config) return;
  
  nameEl.textContent = config.name;
  descEl.textContent = config.description;
  
  // 渲染属性条
  const hungerPercent = (1 / config.hungerDrain) * 100;
  const growthPercent = config.growthRate * 100;
  
  statsEl.innerHTML = `
    <div class="monster-stat">
      <span class="monster-stat-label">饱食消耗</span>
      <div class="monster-stat-bar">
        <div class="monster-stat-fill hunger" style="width: ${hungerPercent}%"></div>
      </div>
    </div>
    <div class="monster-stat">
      <span class="monster-stat-label">成长速度</span>
      <div class="monster-stat-bar">
        <div class="monster-stat-fill growth" style="width: ${growthPercent}%"></div>
      </div>
    </div>
  `;
}

/**
 * 更新确认按钮状态
 */
function updateConfirmButton() {
  const btn = document.getElementById('monster-confirm-btn');
  if (!btn) return;
  
  btn.disabled = !selectedMonsterId;
  
  if (selectedMonsterId) {
    btn.textContent = `选择 ${MONSTER_TYPES[selectedMonsterId]?.name || '怪兽'} 开始游戏`;
    btn.onclick = confirmSelection;
  } else {
    btn.textContent = '请先选择一只怪兽';
    btn.onclick = null;
  }
}

/**
 * 确认选择
 */
function confirmSelection() {
  if (!selectedMonsterId) return;
  
  setMonsterType(selectedMonsterId);
  hideMonsterSelect();
  
  if (onSelectCallback) {
    onSelectCallback(selectedMonsterId);
  }
}

/**
 * 获取当前选中的怪兽ID
 */
export function getSelectedMonsterId() {
  return selectedMonsterId;
}
