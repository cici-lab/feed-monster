/**
 * 配方面板模块 - HTML弹窗版本
 * 按稀有度分组显示，条件描述清晰
 */

import { RARITY_CONFIG, getAllRecipes, isRecipeUnlocked, getRecipeHint, getRecipeProgress, checkRecipeUnlockThreshold, getRecipeUnlockHint, getUnlockProgress, RARITY_THRESHOLDS } from './recipes.js';
import { registerRecipePanelFuncs } from './console.js';

let isOpen = false;

const RARITY_ORDER = { legendary: 0, rare: 1, common: 2 };
const RARITY_LABEL = { legendary: '传说', rare: '稀有', common: '普通' };

function rgbToCss(col) {
  if (!col || col.length < 3) return '#888888';
  return `rgb(${col[0]}, ${col[1]}, ${col[2]})`;
}

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
 * 构建条件的可读文字
 */
function formatConditions(conditions) {
  const entries = Object.entries(conditions || {});
  if (entries.length === 0) return '任意 3 个食材';

  const DIM_ICONS = {
    nature: '🌿',
    liquid: '💧',
    weird: '👻',
    delicious: '🍕',
    abstract: '🌀',
  };

  return entries.map(([dim, count]) => {
    const icon = DIM_ICONS[dim] || '';
    return `${icon}${dim}×${count}`;
  }).join(' + ');
}

/**
 * 获取分数显示的样式
 */
function getScoreHtml(points) {
  if (points > 0) return `<span style="color: #ffc864; font-weight: bold;">+${points}</span>`;
  if (points < 0) return `<span style="color: #ff6666; font-weight: bold;">${points}</span>`;
  return `<span style="color: #aaa;">${points}</span>`;
}

function renderRecipeList() {
  const container = document.getElementById('recipe-list');
  const progressEl = document.getElementById('recipe-progress');
  if (!container) return;

  const recipes = getAllRecipes();
  const progress = getRecipeProgress();
  const unlockProgress = getUnlockProgress();

  if (progressEl) {
    progressEl.textContent = `${progress.unlocked}/${progress.total} 已发现 | 最高分: ${unlockProgress.highScore}`;
  }

  container.innerHTML = '';

  // 按稀有度分组排序
  const grouped = { legendary: [], rare: [], common: [] };
  recipes.forEach(r => {
    if (grouped[r.rarity]) grouped[r.rarity].push(r);
  });

  // 每组内按优先级降序
  Object.values(grouped).forEach(list => list.sort((a, b) => (b.priority || 0) - (a.priority || 0)));

  // 按稀有度顺序渲染
  ['legendary', 'rare', 'common'].forEach(rarity => {
    const list = grouped[rarity];
    if (list.length === 0) return;

    const rCfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
    const rarityColor = rgbToCss(rCfg.color);

    // 稀有度分隔标题
    const section = document.createElement('div');
    section.style.marginBottom = '8px';

    const header = document.createElement('div');
    header.innerHTML = `
      <div style="
        display: flex; align-items: center; gap: 8px;
        padding: 8px 12px; margin-bottom: 8px;
        background: ${rgbToCss(rCfg.bgColor)};
        border-radius: 6px; border-left: 3px solid ${rarityColor};
      ">
        <span style="font-size: 16px;">${rCfg.icon || '📦'}</span>
        <span style="color: #fff; font-size: 15px; font-weight: 500;">${rCfg.name || '普通'}</span>
        <span style="color: ${rarityColor}; font-size: 11px;">
          ${rarity === 'legendary' ? '需最高分 ≥ 2000' : rarity === 'rare' ? '需最高分 ≥ 800' : ''}
        </span>
      </div>
    `;
    section.appendChild(header);

    list.forEach(recipe => {
      const discovered = isRecipeUnlocked(recipe.id);
      const rarityUnlocked = checkRecipeUnlockThreshold(recipe.id);
      const isVisible = discovered || rarityUnlocked;
      const showDetails = discovered;

      const item = document.createElement('div');
      item.style.cssText = `
        background: ${showDetails ? (recipe.isPunishment ? 'rgba(80,180,80,0.08)' : recipe.isTradeoff ? 'rgba(255,200,50,0.08)' : '#2a2a3a') : '#222235'};
        border-radius: 8px;
        border: 1.5px solid ${!isVisible ? '#2a2a3a' : showDetails ? rarityColor : '#3a3a4a'};
        padding: 10px 14px;
        margin-bottom: 6px;
        opacity: ${isVisible ? 1 : 0.5};
      `;

      if (!isVisible) {
        // 完全隐藏
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #666;">🔒 ???</span>
            <span style="color: #555; font-size: 11px;">${getRecipeUnlockHint(recipe.id)}</span>
          </div>
        `;
      } else if (!showDetails) {
        // 可见但未合成过
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: #ccc; font-size: 14px; font-weight: 500;">${recipe.name}</span>
            <span style="font-size: 12px;">${getScoreHtml(recipe.points)}</span>
          </div>
          <div style="color: #888; font-size: 11px;">
            🎯 ${formatConditions(recipe.conditions)}
          </div>
        `;
      } else {
        // 已发现
        const tags = [];
        if (recipe.isPunishment) tags.push('<span style="background:rgba(80,180,80,0.3);color:#8d8;padding:2px 8px;border-radius:4px;font-size:11px;">☠️ 惩罚</span>');
        if (recipe.isTradeoff) tags.push('<span style="background:rgba(255,200,50,0.2);color:#fd8;padding:2px 8px;border-radius:4px;font-size:11px;">⚖️ 有舍有得</span>');
        if (recipe.studentSpecial) tags.push('<span style="background:rgba(50,50,100,0.4);color:#88b;padding:2px 8px;border-radius:4px;font-size:11px;">🎒 学生对味</span>');

        const buffText = getBuffShortText(recipe.buff);
        const pointsColor = recipe.points >= 0 ? '#ffc864' : '#ff6666';

        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <div>
              <span style="color: #fff; font-size: 14px; font-weight: 500;">${recipe.name}</span>
              <div style="margin-top: 3px; display: flex; gap: 4px; flex-wrap: wrap;">
                ${tags.join('')}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="color: ${pointsColor}; font-size: 18px; font-weight: 700;">${recipe.points > 0 ? '+' : ''}${recipe.points}</div>
              <div style="color: #666; font-size: 10px;">分数</div>
            </div>
          </div>
          <div style="background: #1a1a2a; border-radius: 6px; padding: 6px 10px; margin: 6px 0;">
            <div style="color: #aac; font-size: 12px;">
              🎯 条件：${formatConditions(recipe.conditions)}
            </div>
            ${buffText ? `
            <div style="color: #aca; font-size: 11px; margin-top: 3px;">
              ✨ 效果：${buffText}（${recipe.buff.duration}秒）
            </div>` : ''}
          </div>
          <div style="color: #888; font-size: 11px;">${recipe.description || ''}</div>
        `;
      }

      section.appendChild(item);
    });

    container.appendChild(section);
  });
}

function getBuffShortText(buff) {
  if (!buff) return '';
  const map = {
    hungerFreeze: '🛡️ 饱食度锁定',
    hungerDrainHalf: '♻️ 饱食减半',
    healthFreeze: '💚 生命护盾',
    scoreMultiplier: '⭐ 得分翻倍',
    foodSpawnRate: '🌾 食物加速',
    ignoreHate: '🌀 厌恶免疫',
    categoryBonus: '🔮 类别加成',
    cursedBoost: '💀 咒术增幅',
    megaBoost: '👑 全面强化',
    foodSpoil: '⚠️ 饱食加速',
    weakness: '⚡ 虚弱诅咒',
  };
  return map[buff.type] || '';
}

export function openRec() {
  const modal = document.getElementById('recipe-modal');
  if (modal) {
    modal.classList.add('active');
    isOpen = true;
    renderRecipeList();
  }
}

export function closeRec() {
  const modal = document.getElementById('recipe-modal');
  if (modal) {
    modal.classList.remove('active');
    isOpen = false;
  }
}

export function refreshRecipePanel() {
  if (isOpen) renderRecipeList();
}

export function initRecipePanelSystem() {
  createRecipeButton();

  window.closeRecipePanel = closeRec;

  const modal = document.getElementById('recipe-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeRec();
    });
  }

  registerRecipePanelFuncs(openRec, closeRec);

  try {
    window.addEventListener('score:changed', () => { refreshRecipePanel(); });
  } catch (e) {}
}
