/**
 * 图鉴系统模块 - HTML弹窗版本
 */

import { FOOD_TYPES } from './food.js';
import { registerEncyclopediaFuncs } from './console.js';

// 分类配置
const CATEGORIES = {
  all: { name: '全部', color: '#b0b0b0' },
  nature: { name: '自然', color: '#228b22' },
  liquid: { name: '液体', color: '#6496ff' },
  weird: { name: '奇怪', color: '#969696' },
  delicious: { name: '美味', color: '#ffc864' },
  abstract: { name: '抽象', color: '#ff64c8' },
};

let currentCategory = 'all';
let isOpen = false;

/**
 * RGB数组转CSS颜色
 */
function rgbToCss(col) {
  if (!col || col.length < 3) return '#888888';
  return `rgb(${col[0]}, ${col[1]}, ${col[2]})`;
}

/**
 * 创建图鉴按钮（Canvas中的按钮）
 */
export function createEncyclopediaButton() {
  const btn = add([
    rect(100, 36),
    pos(width() - 130, 70),
    anchor('topleft'),
    color(60, 60, 90),
    outline(2, rgb(100, 100, 140)),
    z(30),
    fixed(),
    area(),
  ]);

  btn.add([text('📖', { size: 18 }), pos(20, 18), anchor('center')]);
  btn.add([text('图鉴', { size: 16 }), pos(60, 18), anchor('center'), color(220, 220, 240)]);

  btn.onHover(() => btn.color = rgb(80, 80, 120));
  btn.onHoverEnd(() => btn.color = rgb(60, 60, 90));
  btn.onClick(() => isOpen ? closeEnc() : openEnc());

  onUpdate(() => btn.pos.x = width() - 130);
}

/**
 * 渲染分类按钮
 */
function renderCategories() {
  const container = document.getElementById('enc-categories');
  if (!container) return;
  
  container.innerHTML = '';
  
  Object.entries(CATEGORIES).forEach(([key, cfg]) => {
    const btn = document.createElement('button');
    btn.className = `enc-cat-btn${currentCategory === key ? ' active' : ''}`;
    btn.style.borderColor = cfg.color;
    btn.textContent = cfg.name;
    btn.onclick = () => {
      currentCategory = key;
      renderCategories();
      renderFoodList();
    };
    container.appendChild(btn);
  });
}

/**
 * 渲染食物列表
 */
function renderFoodList() {
  const container = document.getElementById('enc-list');
  const stats = document.getElementById('enc-stats');
  if (!container) return;

  // 过滤食物
  const allFoods = Object.entries(FOOD_TYPES);
  const foods = currentCategory === 'all' 
    ? allFoods.map(([k, f]) => ({ ...f, key: k }))
    : allFoods.filter(([_, f]) => f.category === currentCategory).map(([k, f]) => ({ ...f, key: k }));

  // 更新统计
  if (stats) {
    stats.textContent = `共收录 ${allFoods.length} 种食材 | 当前显示 ${foods.length} 种`;
  }

  // 渲染列表
  container.innerHTML = '';
  
  foods.forEach(food => {
    const item = document.createElement('div');
    item.className = 'enc-item';
    
    const catCfg = CATEGORIES[food.category] || CATEGORIES['all'];
    
    item.innerHTML = `
      <div class="enc-item-icon" style="background: ${rgbToCss(food.color)}"></div>
      <div class="enc-item-info">
        <div class="enc-item-name">${food.name || '未知'}</div>
        <div class="enc-item-points">${food.points || 0} 分</div>
      </div>
      <span class="enc-item-tag" style="background: ${catCfg.color}">${catCfg.name}</span>
    `;
    
    container.appendChild(item);
  });
}

/**
 * 打开图鉴
 */
export function openEnc() {
  const modal = document.getElementById('encyclopedia-modal');
  if (modal) {
    modal.classList.add('active');
    isOpen = true;
    renderCategories();
    renderFoodList();
  }
}

/**
 * 关闭图鉴
 */
export function closeEnc() {
  const modal = document.getElementById('encyclopedia-modal');
  if (modal) {
    modal.classList.remove('active');
    isOpen = false;
  }
}

/**
 * 初始化图鉴系统
 */
export function initEncyclopediaSystem() {
  createEncyclopediaButton();

  // 注册全局关闭函数
  window.closeEncyclopedia = closeEnc;

  // 点击遮罩关闭
  const modal = document.getElementById('encyclopedia-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeEnc();
      }
    });
  }

  // 注册控制台函数
  registerEncyclopediaFuncs(openEnc, closeEnc);
}

// 导出状态检查
export function isEncyclopediaVisible() {
  return isOpen;
}