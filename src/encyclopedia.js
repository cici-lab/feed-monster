/**
 * 图鉴系统模块
 * 显示所有食物的详细信息
 */

import { FOOD_TYPES } from './food.js';

// 图鉴状态
let encyclopediaState = {
  isVisible: false,
  currentCategory: 'all',
  panelElement: null,
  listContainer: null,
};

// 类别配置
const CATEGORIES = {
  all: { name: '全部', color: [200, 200, 200] },
  nature: { name: '自然', color: [34, 139, 34] },
  liquid: { name: '液体', color: [100, 150, 255] },
  weird: { name: '奇怪', color: [150, 150, 150] },
  delicious: { name: '美味', color: [255, 200, 100] },
  abstract: { name: '抽象', color: [255, 100, 200] },
};

/**
 * 创建图鉴按钮
 */
export function createEncyclopediaButton() {
  const button = add([
    rect(100, 36),
    pos(width() - 130, 70),
    anchor('topleft'),
    color(60, 60, 90),
    outline(2, rgb(100, 100, 140)),
    z(30),
    fixed(),
    area(),
    'encyclopedia-btn',
  ]);

  button.add([
    text('📖', { size: 18 }),
    pos(20, 18),
    anchor('center'),
  ]);

  button.add([
    text('图鉴', { size: 16 }),
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
    toggleEncyclopedia();
  });

  onUpdate(() => {
    button.pos.x = width() - 130;
  });

  return button;
}

/**
 * 切换图鉴显示
 */
function toggleEncyclopedia() {
  if (encyclopediaState.isVisible) {
    closeEncyclopedia();
  } else {
    openEncyclopedia();
  }
}

/**
 * 打开图鉴
 */
function openEncyclopedia() {
  if (encyclopediaState.isVisible) return;

  encyclopediaState.isVisible = true;

  const overlay = add([
    rect(width(), height()),
    color(0, 0, 0),
    opacity(0.7),
    z(100),
    fixed(),
    area(),
    'encyclopedia-overlay',
  ]);

  const panelWidth = 600;
  const panelHeight = 500;
  const panel = add([
    rect(panelWidth, panelHeight),
    pos(center()),
    anchor('center'),
    color(40, 40, 50),
    outline(3, rgb(100, 100, 120)),
    z(101),
    fixed(),
    'encyclopedia-panel',
  ]);

  encyclopediaState.panelElement = panel;

  // 标题栏
  const header = panel.add([
    rect(panelWidth, 50),
    pos(0, -panelHeight / 2),
    anchor('topleft'),
    color(60, 60, 80),
    z(1),
  ]);

  header.add([
    text('📖 食物图鉴', { size: 20 }),
    pos(20, 25),
    anchor('left'),
    color(255, 255, 255),
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
    closeEncyclopedia();
  });

  closeBtn.onHover(() => {
    closeBtn.color = rgb(200, 80, 80);
  });

  closeBtn.onHoverEnd(() => {
    closeBtn.color = rgb(180, 60, 60);
  });

  // 类别选择器
  createCategorySelector(panel, panelWidth);

  // 食物列表容器
  const listContainer = panel.add([
    rect(panelWidth - 40, panelHeight - 120),
    pos(20, 60),
    color(30, 30, 40),
    z(1),
    'encyclopedia-list',
  ]);

  encyclopediaState.listContainer = listContainer;

  createFoodList(listContainer, panelWidth - 40);

  overlay.onClick(() => {
    closeEncyclopedia();
  });
}

/**
 * 关闭图鉴
 */
function closeEncyclopedia() {
  if (!encyclopediaState.isVisible) return;

  encyclopediaState.isVisible = false;
  encyclopediaState.listContainer = null;

  destroyAll('encyclopedia-overlay');
  destroyAll('encyclopedia-panel');
  destroyAll('encyclopedia-item');
  destroyAll('encyclopedia-category');
}

/**
 * 创建类别选择器
 */
function createCategorySelector(panel, panelWidth) {
  const categories = Object.keys(CATEGORIES);
  const buttonWidth = 80;
  const startX = 20;
  const startY = 60;

  categories.forEach((category, index) => {
    const config = CATEGORIES[category];
    const btnX = startX + index * (buttonWidth + 8);

    const btn = panel.add([
      rect(buttonWidth, 30),
      pos(btnX, startY),
      anchor('topleft'),
      color(50, 50, 70),
      outline(2, rgb(config.color[0], config.color[1], config.color[2])),
      z(2),
      area(),
      'encyclopedia-category',
    ]);

    btn.add([
      text(config.name, { size: 12 }),
      pos(buttonWidth / 2, 15),
      anchor('center'),
      color(255, 255, 255),
    ]);

    btn.onClick(() => {
      encyclopediaState.currentCategory = category;
      refreshFoodList();
    });

    btn.onHover(() => {
      btn.color = rgb(70, 70, 90);
    });

    btn.onHoverEnd(() => {
      btn.color = rgb(50, 50, 70);
    });
  });
}

/**
 * 创建食物列表
 */
function createFoodList(container, containerWidth) {
  const foods = getFilteredFoods();

  foods.forEach((food, index) => {
    createFoodItem(container, food, index, containerWidth);
  });
}

/**
 * 刷新食物列表
 */
function refreshFoodList() {
  if (!encyclopediaState.listContainer) return;

  destroyAll('encyclopedia-item');

  createFoodList(encyclopediaState.listContainer, encyclopediaState.listContainer.width);
}

/**
 * 创建单个食物项
 */
function createFoodItem(container, food, index, containerWidth) {
  const itemWidth = containerWidth - 20;
  const itemHeight = 60;
  const itemY = 10 + index * (itemHeight + 8);

  const item = container.add([
    rect(itemWidth, itemHeight),
    pos(10, itemY),
    anchor('topleft'),
    color(45, 45, 55),
    outline(1, rgb(70, 70, 80)),
    z(2),
    area(),
    'encyclopedia-item',
  ]);

  item.add([
    circle(20),
    pos(30, itemHeight / 2),
    anchor('center'),
    color(food.color[0], food.color[1], food.color[2]),
  ]);

  item.add([
    text(food.name, { size: 14 }),
    pos(60, itemHeight / 2 - 8),
    anchor('left'),
    color(255, 255, 255),
  ]);

  item.add([
    text(`${food.points}分`, { size: 12 }),
    pos(60, itemHeight / 2 + 10),
    anchor('left'),
    color(255, 200, 100),
  ]);

  const categoryConfig = CATEGORIES[food.category];
  item.add([
    rect(50, 20),
    pos(itemWidth - 60, itemHeight / 2),
    anchor('center'),
    color(categoryConfig.color[0], categoryConfig.color[1], categoryConfig.color[2]),
    opacity(0.3),
  ]);

  item.add([
    text(categoryConfig.name, { size: 10 }),
    pos(itemWidth - 60, itemHeight / 2),
    anchor('center'),
    color(255, 255, 255),
  ]);

  item.onHover(() => {
    item.color = rgb(55, 55, 65);
  });

  item.onHoverEnd(() => {
    item.color = rgb(45, 45, 55);
  });
}

/**
 * 获取过滤后的食物列表
 */
function getFilteredFoods() {
  const allFoods = Object.entries(FOOD_TYPES);

  if (encyclopediaState.currentCategory === 'all') {
    return allFoods.map(([key, food]) => ({ ...food, key }));
  }

  return allFoods
    .filter(([key, food]) => food.category === encyclopediaState.currentCategory)
    .map(([key, food]) => ({ ...food, key }));
}

/**
 * 初始化图鉴系统
 */
export function initEncyclopediaSystem() {
  createEncyclopediaButton();
}