/**
 * 配方面板模块
 */

import { RECIPES, RARITY_CONFIG, getAllRecipes, isRecipeUnlocked, getRecipeHint, getRecipeProgress } from './recipes.js';
import { FOOD_TYPES } from './food.js';

let recVisible = false;

function sc(col) {
  return [
    Math.max(0, Math.min(255, col?.[0] || 0)),
    Math.max(0, Math.min(255, col?.[1] || 0)),
    Math.max(0, Math.min(255, col?.[2] || 0)),
  ];
}

export function createRecipeButton() {
  const b = add([
    rect(100, 36),
    pos(width() - 130, 110),
    anchor('topleft'),
    color(60, 60, 90),
    outline(2, rgb(100, 100, 140)),
    z(30),
    fixed(),
    area(),
  ]);

  b.add([text('⚗️', { size: 18 }), pos(20, 18), anchor('center')]);
  b.add([text('配方', { size: 16 }), pos(60, 18), anchor('center'), color(200, 200, 220)]);

  b.onHover(() => b.color = rgb(80, 80, 120));
  b.onHoverEnd(() => b.color = rgb(60, 60, 90));
  b.onClick(() => recVisible ? closeRec() : openRec());

  onUpdate(() => b.pos.x = width() - 130);
}

function openRec() {
  recVisible = true;
  rebuildRec();
}

function closeRec() {
  recVisible = false;
  destroyAll('rec-p');
}

function rebuildRec() {
  if (!recVisible) return;
  
  destroyAll('rec-p');

  const w = 500, h = 600;
  const cx = center().x, cy = center().y;
  const l = cx - w / 2, t = cy - h / 2;

  // 遮罩
  const ov = add([rect(width(), height()), color(0, 0, 0), opacity(0.7), z(100), fixed(), area(), 'rec-p']);
  ov.onClick(() => closeRec());

  // 窗口
  add([rect(w, h), pos(l, t), color(35, 35, 45), outline(3, rgb(80, 100, 140)), z(101), fixed(), 'rec-p']);

  // 标题栏
  add([rect(w, 50), pos(l, t), color(50, 60, 80), z(102), fixed(), 'rec-p']);
  add([text('⚗️ 合成配方', { size: 20 }), pos(l + 20, t + 25), anchor('left'), color(255, 255, 255), z(103), fixed(), 'rec-p']);

  // 进度
  const prog = getRecipeProgress();
  add([text(`${prog.unlocked}/${prog.total} 已解锁`, { size: 12 }), pos(l + w - 20, t + 25), anchor('right'), color(255, 200, 100), z(103), fixed(), 'rec-p']);

  // 关闭按钮
  const cb = add([rect(60, 32), pos(l + w - 70, t + 10), color(180, 60, 60), outline(2, rgb(220, 80, 80)), z(200), fixed(), area(), 'rec-p']);
  cb.add([text('关闭', { size: 14 }), pos(30, 16), anchor('center'), color(255, 255, 255)]);
  cb.onHover(() => cb.color = rgb(220, 80, 80));
  cb.onHoverEnd(() => cb.color = rgb(180, 60, 60));
  cb.onClick(() => closeRec());

  // 配方列表
  const recipes = getAllRecipes();
  recipes.forEach((recipe, i) => {
    const iy = t + 60 + i * 90;
    renderRecipe(recipe, l, iy, w);
  });
}

function renderRecipe(recipe, l, iy, w) {
  const itemW = w - 40;
  const unlocked = isRecipeUnlocked(recipe.id);
  const rCfg = RARITY_CONFIG[recipe.rarity] || RARITY_CONFIG['common'];
  const rc = sc(rCfg.color);
  const bc = sc(rCfg.bgColor);

  // 背景
  const item = add([rect(itemW, 80), pos(l + 20, iy), color(45, 45, 55), outline(2, rgb(rc[0], rc[1], rc[2])), z(103), fixed(), area(), 'rec-p']);

  // 稀有度标签
  add([rect(60, 20), pos(l + itemW - 10, iy + 10), anchor('topright'), color(bc[0], bc[1], bc[2]), outline(1, rgb(rc[0], rc[1], rc[2])), z(104), fixed(), 'rec-p']);
  add([text(`${rCfg.icon || ''} ${rCfg.name || '普通'}`, { size: 10 }), pos(l + itemW - 40, iy + 20), anchor('center'), color(rc[0], rc[1], rc[2]), z(105), fixed(), 'rec-p']);

  // 名称
  add([text(unlocked ? recipe.name : '???', { size: 16 }), pos(l + 30, iy + 25), anchor('left'), color(unlocked ? 255 : 150), z(104), fixed(), 'rec-p']);

  // 分数
  add([text(unlocked ? `${recipe.points}分` : '???', { size: 12 }), pos(l + 30, iy + 45), anchor('left'), color(unlocked ? 255 : 100), z(104), fixed(), 'rec-p']);

  // 食材或问号
  if (unlocked && recipe.ingredients) {
    recipe.ingredients.forEach((ing, j) => {
      const f = FOOD_TYPES[ing];
      if (f) {
        const fc = sc(f.color);
        add([circle(15), pos(l + 180 + j * 45, iy + 40), color(fc[0], fc[1], fc[2]), z(104), fixed(), 'rec-p']);
      }
    });
    add([text(recipe.description || '', { size: 10 }), pos(l + 30, iy + 65), anchor('left'), color(180, 180, 180), z(104), fixed(), 'rec-p']);
  } else {
    for (let j = 0; j < 3; j++) {
      add([text('?', { size: 16 }), pos(l + 180 + j * 45, iy + 40), anchor('center'), color(100, 100, 100), z(104), fixed(), 'rec-p']);
    }
    add([text('💡 提示: ' + getRecipeHint(recipe.id), { size: 9 }), pos(l + 30, iy + 65), anchor('left'), color(150, 150, 180), z(104), fixed(), 'rec-p']);
  }

  item.onHover(() => item.color = rgb(55, 55, 65));
  item.onHoverEnd(() => item.color = rgb(45, 45, 55));
}

export function refreshRecipePanel() {
  if (!recVisible) return;
  rebuildRec();
}

export function initRecipePanelSystem() {
  createRecipeButton();
}
