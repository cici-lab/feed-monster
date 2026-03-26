/**
 * 配方面板模块
 * 显示所有合成配方，包括已解锁和未解锁状态
 */

import { RECIPES, RARITY_CONFIG, getAllRecipes, isRecipeUnlocked, getRecipeHint, getRecipeProgress } from './recipes.js';
import { FOOD_TYPES } from './food.js';

// 配方面板状态
let recipePanelState = {
  isVisible: false,
  panelElement: null,
};

/**
 * 创建配方按钮
 */
export function createRecipeButton() {
  const button = add([
    rect(100, 36),
    pos(width() - 130, 110),
    anchor('topleft'),
    color(60, 60, 90),
    outline(2, rgb(100, 100, 140)),
    z(30),
    fixed(),
    area(),
    'recipe-btn',
  ]);

  button.add([
    text('⚗️', { size: 18 }),
    pos(20, 18),
    anchor('center'),
  ]);

  button.add([
    text('配方', { size: 16 }),
    pos(60, 18),
    anchor('center'),
    color(200, 200, 220),
  ]);

  button.onHover(() => {
    button.color = rgb(80, 80, 120);
  });

  button.onHoverEnd(() => {
    button.color = rgb(60, 60, 90);
  });

  button.onClick(() => {
    toggleRecipePanel();
  });

  onUpdate(() => {
    button.pos.x = width() - 130;
  });

  return button;
}

/**
 * 切换配方面板显示
 */
function toggleRecipePanel() {
  if (recipePanelState.isVisible) {
    closeRecipePanel();
  } else {
    openRecipePanel();
  }
}

/**
 * 打开配方面板
 */
function openRecipePanel() {
  if (recipePanelState.isVisible) return;

  recipePanelState.isVisible = true;

  const overlay = add([
    rect(width(), height()),
    color(0, 0, 0),
    opacity(0.7),
    z(100),
    fixed(),
    area(),
    'recipe-overlay',
  ]);

  const panelWidth = 500;
  const panelHeight = 600;
  const panel = add([
    rect(panelWidth, panelHeight),
    pos(center()),
    anchor('center'),
    color(40, 40, 50),
    outline(3, rgb(100, 100, 120)),
    z(101),
    fixed(),
    'recipe-panel',
  ]);

  recipePanelState.panelElement = panel;

  // 标题栏
  const header = panel.add([
    rect(panelWidth, 50),
    pos(0, -panelHeight / 2),
    anchor('topleft'),
    color(60, 60, 80),
    z(1),
  ]);

  header.add([
    text('⚗️ 合成配方', { size: 20 }),
    pos(20, 25),
    anchor('left'),
    color(255, 255, 255),
  ]);

  // 进度显示
  const progress = getRecipeProgress();
  header.add([
    text(`${progress.unlocked}/${progress.total} 已解锁`, { size: 12 }),
    pos(panelWidth - 20, 25),
    anchor('right'),
    color(255, 200, 100),
  ]);

  // 关闭按钮
  const closeBtn = panel.add([
    rect(80, 35),
    pos(panelWidth - 90, -panelHeight / 2 + 8),
    anchor('topleft'),
    color(180, 60, 60),
    outline(2, rgb(200, 80, 80)),
    z(2),
    area(),
  ]);

  closeBtn.add([
    text('关闭', { size: 14 }),
    pos(40, 18),
    anchor('center'),
    color(255, 255, 255),
  ]);

  closeBtn.onClick(() => {
    closeRecipePanel();
  });

  closeBtn.onHover(() => {
    closeBtn.color = rgb(200, 80, 80);
  });

  closeBtn.onHoverEnd(() => {
    closeBtn.color = rgb(180, 60, 60);
  });

  // 创建配方列表
  createRecipeList(panel, panelWidth, panelHeight);

  overlay.onClick(() => {
    closeRecipePanel();
  });
}

/**
 * 关闭配方面板
 */
function closeRecipePanel() {
  if (!recipePanelState.isVisible) return;

  recipePanelState.isVisible = false;

  destroyAll('recipe-overlay');
  destroyAll('recipe-panel');
  destroyAll('recipe-item');
}

/**
 * 创建配方列表
 */
function createRecipeList(panel, panelWidth, panelHeight) {
  const recipes = getAllRecipes();
  const startY = 70;
  const itemHeight = 85;
  const spacing = 10;

  recipes.forEach((recipe, index) => {
    const itemY = startY + index * (itemHeight + spacing);
    createRecipeItem(panel, recipe, itemY, panelWidth);
  });
}

/**
 * 创建单个配方项
 */
function createRecipeItem(panel, recipe, itemY, panelWidth) {
  const itemWidth = panelWidth - 40;
  const isUnlocked = isRecipeUnlocked(recipe.id);
  const rarityConfig = RARITY_CONFIG[recipe.rarity];

  const item = panel.add([
    rect(itemWidth, 80),
    pos(20, itemY),
    anchor('topleft'),
    color(45, 45, 55),
    outline(2, rgb(rarityConfig.color[0], rarityConfig.color[1], rarityConfig.color[2])),
    z(2),
    area(),
    'recipe-item',
  ]);

  // 稀有度标签
  item.add([
    rect(60, 20),
    pos(itemWidth - 70, 10),
    anchor('topleft'),
    color(rarityConfig.bgColor[0], rarityConfig.bgColor[1], rarityConfig.bgColor[2]),
    outline(1, rgb(rarityConfig.color[0], rarityConfig.color[1], rarityConfig.color[2])),
  ]);

  item.add([
    text(`${rarityConfig.icon} ${rarityConfig.name}`, { size: 10 }),
    pos(itemWidth - 40, 20),
    anchor('center'),
    color(rarityConfig.color[0], rarityConfig.color[1], rarityConfig.color[2]),
  ]);

  // 配方名称
  item.add([
    text(isUnlocked ? recipe.name : '???', { size: 16 }),
    pos(10, 25),
    anchor('left'),
    color(isUnlocked ? 255 : 150),
  ]);

  // 分数
  item.add([
    text(isUnlocked ? `${recipe.points}分` : '???', { size: 12 }),
    pos(10, 45),
    anchor('left'),
    color(isUnlocked ? 255 : 100),
  ]);

  // 配方食材
  if (isUnlocked) {
    const ingredientX = 150;
    recipe.ingredients.forEach((ingKey, index) => {
      const ingFood = FOOD_TYPES[ingKey];
      if (ingFood) {
        const ingX = ingredientX + index * 45;

        item.add([
          circle(15),
          pos(ingX, 40),
          anchor('center'),
          color(ingFood.color[0], ingFood.color[1], ingFood.color[2]),
        ]);

        if (ingFood.glow) {
          item.add([
            circle(17),
            pos(ingX, 40),
            anchor('center'),
            color(ingFood.color[0], ingFood.color[1], ingFood.color[2]),
            opacity(0.3),
          ]);
        }
      }
    });

    // 描述
    item.add([
      text(recipe.description, { size: 10 }),
      pos(10, 65),
      anchor('left'),
      color(180, 180, 180),
    ]);
  } else {
    // 未解锁的配方显示问号
    const questionX = 150;
    for (let i = 0; i < 3; i++) {
      item.add([
        text('?', { size: 16 }),
        pos(questionX + i * 45, 40),
        anchor('center'),
        color(100, 100, 100),
      ]);
    }

    // 提示信息
    item.add([
      text('💡 提示: ' + getRecipeHint(recipe.id), { size: 9 }),
      pos(10, 65),
      anchor('left'),
      color(150, 150, 180),
    ]);
  }

  // 悬停效果
  item.onHover(() => {
    item.color = rgb(55, 55, 65);
    item.outline.width = 3;
  });

  item.onHoverEnd(() => {
    item.color = rgb(45, 45, 55);
    item.outline.width = 2;
  });
}

/**
 * 刷新配方面板
 */
export function refreshRecipePanel() {
  if (!recipePanelState.isVisible) return;

  closeRecipePanel();
  openRecipePanel();
}

/**
 * 初始化配方面板系统
 */
export function initRecipePanelSystem() {
  createRecipeButton();
}