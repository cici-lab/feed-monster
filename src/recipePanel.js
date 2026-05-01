/**
 * 配方面板模块 - HTML弹窗版本
 */

import { RARITY_CONFIG, getAllRecipes, isRecipeUnlocked, getRecipeHint, getRecipeProgress, checkRecipeUnlockThreshold, getRecipeUnlockHint, getUnlockProgress, RARITY_THRESHOLDS } from './recipes.js';
import { registerRecipePanelFuncs } from './console.js';

let isOpen = false;

/**
 * RGB数组转CSS颜色
 */
function rgbToCss(col) {
  if (!col || col.length < 3) return '#888888';
  return `rgb(${col[0]}, ${col[1]}, ${col[2]})`;
}

/**
 * 创建配方按钮（Canvas中的按钮）
 */
export function createRecipeButton() {
  const btn = add([
    rect(100, 36),
    pos(width() - 130, 110),
    anchor('topleft'),
    color(60, 60, 90),
    outline(2, rgb(100, 100, 140)),
    z(30),
    fixed(),
    area(),
  ]);

  btn.add([text('⚗️', { size: 18 }), pos(20, 18), anchor('center')]);
  btn.add([text('配方', { size: 16 }), pos(60, 18), anchor('center'), color(200, 200, 220)]);

  btn.onHover(() => btn.color = rgb(80, 80, 120));
  btn.onHoverEnd(() => btn.color = rgb(60, 60, 90));
  btn.onClick(() => isOpen ? closeRec() : openRec());

  onUpdate(() => btn.pos.x = width() - 130);
}

/**
 * 渲染配方列表
 */
function renderRecipeList() {
  const container = document.getElementById('recipe-list');
  const progressEl = document.getElementById('recipe-progress');
  if (!container) return;

  const recipes = getAllRecipes();
  const progress = getRecipeProgress();
  const unlockProgress = getUnlockProgress();

  // 更新进度（配方已发现数量 + 最高分解锁进度）
  if (progressEl) {
    progressEl.textContent = `${progress.unlocked}/${progress.total} 已发现 | 最高分: ${unlockProgress.highScore}`;
  }

  // 渲染列表
  container.innerHTML = '';

  recipes.forEach(recipe => {
    const discovered = isRecipeUnlocked(recipe.id);
    const rarityUnlocked = checkRecipeUnlockThreshold(recipe.id);
    const rCfg = RARITY_CONFIG[recipe.rarity] || RARITY_CONFIG['common'];

    // 判断配方可见状态
    // - 已发现：显示完整信息
    // - 未发现但稀有度已解锁（达到门槛）：显示名称但条件模糊
    // - 未发现且稀有度未解锁：显示为锁定（???）
    const isVisible = discovered || rarityUnlocked;
    const showDetails = discovered;

    const item = document.createElement('div');
    item.className = 'recipe-item';
    item.style.borderColor = rgbToCss(rCfg.color);

    const priority = recipe.priority || 0;

    if (!isVisible) {
      // 完全隐藏：稀有度未达到门槛
      item.innerHTML = `
        <div class="recipe-item-header">
          <span class="recipe-item-name locked">🔒 ???</span>
          <span class="recipe-rarity" style="background: ${rgbToCss(rCfg.bgColor)}; border: 1px solid ${rgbToCss(rCfg.color)}">${rCfg.icon || ''} ${rCfg.name || '普通'}</span>
        </div>
        <div class="recipe-hint">${getRecipeUnlockHint(recipe.id)}</div>
      `;
    } else if (!discovered) {
      // 稀有度已解锁但尚未合成过
      item.innerHTML = `
        <div class="recipe-item-header">
          <span class="recipe-item-name" style="color: #aaa;">${recipe.name}</span>
          <span class="recipe-rarity" style="background: ${rgbToCss(rCfg.bgColor)}; border: 1px solid ${rgbToCss(rCfg.color)}">${rCfg.icon || ''} ${rCfg.name || '普通'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="recipe-item-points">${recipe.points} 分</span>
          <div class="recipe-ingredients"><span class="recipe-desc">优先级 ${priority}</span></div>
        </div>
        <div class="recipe-hint">${getRecipeHint(recipe.id)}</div>
      `;
    } else {
      // 已发现：显示完整信息
      item.innerHTML = `
        <div class="recipe-item-header">
          <span class="recipe-item-name">${recipe.name}</span>
          <span class="recipe-rarity" style="background: ${rgbToCss(rCfg.bgColor)}; border: 1px solid ${rgbToCss(rCfg.color)}">${rCfg.icon || ''} ${rCfg.name || '普通'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="recipe-item-points">${recipe.points} 分</span>
          <div class="recipe-ingredients"><span class="recipe-desc">优先级 ${priority}</span></div>
        </div>
        <div class="recipe-desc">${recipe.description || ''}</div>
        <div class="recipe-hint">${getRecipeHint(recipe.id)}</div>
      `;
    }

    container.appendChild(item);
  });
}

/**
 * 打开配方面板
 */
export function openRec() {
  const modal = document.getElementById('recipe-modal');
  if (modal) {
    modal.classList.add('active');
    isOpen = true;
    renderRecipeList();
  }
}

/**
 * 关闭配方面板
 */
export function closeRec() {
  const modal = document.getElementById('recipe-modal');
  if (modal) {
    modal.classList.remove('active');
    isOpen = false;
  }
}

/**
 * 刷新面板
 */
export function refreshRecipePanel() {
  if (isOpen) {
    renderRecipeList();
  }
}

/**
 * 初始化配方面板系统
 */
export function initRecipePanelSystem() {
  createRecipeButton();

  // 注册全局关闭函数
  window.closeRecipePanel = closeRec;

  // 点击遮罩关闭
  const modal = document.getElementById('recipe-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeRec();
      }
    });
  }

  // 注册控制台函数
  registerRecipePanelFuncs(openRec, closeRec);

  // 监听分数变化，实时刷新配方面板（解锁状态会基于持久化的 highScore 计算）
  try {
    window.addEventListener('score:changed', () => {
      refreshRecipePanel();
    });
  } catch (e) {
    // 非浏览器环境忽略
  }
}
