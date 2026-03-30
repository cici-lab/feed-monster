/**
 * 配方面板模块 - HTML弹窗版本
 */

import { RARITY_CONFIG, getAllRecipes, isRecipeUnlocked, getRecipeHint, getRecipeProgress } from './recipes.js';
import { FOOD_TYPES } from './food.js';
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

  // 更新进度
  if (progressEl) {
    progressEl.textContent = `${progress.unlocked}/${progress.total} 已解锁`;
  }

  // 渲染列表
  container.innerHTML = '';

  recipes.forEach(recipe => {
    const unlocked = isRecipeUnlocked(recipe.id);
    const rCfg = RARITY_CONFIG[recipe.rarity] || RARITY_CONFIG['common'];
    
    const item = document.createElement('div');
    item.className = 'recipe-item';
    item.style.borderColor = rgbToCss(rCfg.color);

    // 构建食材HTML
    let ingredientsHtml = '';
    if (unlocked && recipe.ingredients) {
      recipe.ingredients.forEach(ing => {
        const f = FOOD_TYPES[ing];
        if (f) {
          ingredientsHtml += `<div class="recipe-ing-icon" style="background: ${rgbToCss(f.color)}" title="${f.name}"></div>`;
        }
      });
    } else {
      for (let i = 0; i < 3; i++) {
        ingredientsHtml += `<div class="recipe-ing-icon">?</div>`;
      }
    }

    item.innerHTML = `
      <div class="recipe-item-header">
        <span class="recipe-item-name${unlocked ? '' : ' locked'}">${unlocked ? recipe.name : '???'}</span>
        <span class="recipe-rarity" style="background: ${rgbToCss(rCfg.bgColor)}; border: 1px solid ${rgbToCss(rCfg.color)}">${rCfg.icon || ''} ${rCfg.name || '普通'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="recipe-item-points${unlocked ? '' : ' locked'}">${unlocked ? recipe.points + ' 分' : '???'}</span>
        <div class="recipe-ingredients">${ingredientsHtml}</div>
      </div>
      ${unlocked 
        ? `<div class="recipe-desc">${recipe.description || ''}</div>` 
        : `<div class="recipe-hint">💡 ${getRecipeHint(recipe.id)}</div>`
      }
    `;

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
}