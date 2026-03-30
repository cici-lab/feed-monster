/**
 * 图鉴系统模块
 */

import { FOOD_TYPES } from './food.js';
import { registerEncyclopediaFuncs } from './console.js';

// 状态
let encVisible = false;
let encCategory = 'all';
let encScroll = 0;
let encMaxScroll = 0;

const CATS = {
  all: { name: '全部', c: [200, 200, 200] },
  nature: { name: '自然', c: [34, 139, 34] },
  liquid: { name: '液体', c: [100, 150, 255] },
  weird: { name: '奇怪', c: [150, 150, 150] },
  delicious: { name: '美味', c: [255, 200, 100] },
  abstract: { name: '抽象', c: [255, 100, 200] },
};

function sc(col) {
  return [
    Math.max(0, Math.min(255, col?.[0] || 0)),
    Math.max(0, Math.min(255, col?.[1] || 0)),
    Math.max(0, Math.min(255, col?.[2] || 0)),
  ];
}

export function createEncyclopediaButton() {
  const b = add([
    rect(100, 36),
    pos(width() - 130, 70),
    anchor('topleft'),
    color(60, 60, 90),
    outline(2, rgb(100, 100, 140)),
    z(30),
    fixed(),
    area(),
  ]);

  b.add([text('📖', { size: 18 }), pos(20, 18), anchor('center')]);
  b.add([text('图鉴', { size: 16 }), pos(60, 18), anchor('center'), color(220, 220, 240)]);

  b.onHover(() => b.color = rgb(80, 80, 120));
  b.onHoverEnd(() => b.color = rgb(60, 60, 90));
  b.onClick(() => {
    console.log('[Encyclopedia] Button clicked, encVisible:', encVisible);
    encVisible ? closeEnc() : openEnc();
  });

  onUpdate(() => b.pos.x = width() - 130);
}

function openEnc() {
  console.log('[Encyclopedia] openEnc called');
  encVisible = true;
  encScroll = 0;
  rebuildEnc();
}

function closeEnc() {
  console.log('[Encyclopedia] closeEnc called');
  encVisible = false;
  encScroll = 0;
  destroyAll('enc-p');
}

function rebuildEnc() {
  if (!encVisible) return;
  
  destroyAll('enc-p');

  const w = 700, h = 550;
  const cx = center().x, cy = center().y;
  const l = cx - w / 2, t = cy - h / 2;

  // 遮罩
  const ov = add([rect(width(), height()), color(0, 0, 0), opacity(0.85), z(100), fixed(), area(), 'enc-p']);
  // 延迟注册点击事件，避免打开时立即关闭
  wait(0.05, () => {
    if (ov.exists()) {
      ov.onClick(() => closeEnc());
    }
  });

  // 窗口
  add([rect(w, h), pos(l, t), color(25, 25, 35), outline(4, rgb(60, 100, 160)), z(101), fixed(), 'enc-p']);

  // 标题栏
  add([rect(w, 55), pos(l, t), color(40, 55, 85), z(102), fixed(), 'enc-p']);
  add([text('📖 食材图鉴', { size: 26 }), pos(l + 30, t + 28), anchor('left'), color(255, 255, 255), z(103), fixed(), 'enc-p']);

  // 关闭按钮
  const cb = add([rect(60, 35), pos(l + w - 75, t + 12), color(200, 60, 60), outline(2, rgb(240, 80, 80)), z(200), fixed(), area(), 'enc-p']);
  cb.add([text('关闭', { size: 16 }), pos(30, 17), anchor('center'), color(255, 255, 255)]);
  cb.onHover(() => cb.color = rgb(240, 80, 80));
  cb.onHoverEnd(() => cb.color = rgb(200, 60, 60));
  cb.onClick(() => closeEnc());

  // 统计
  add([text(`共收录 ${Object.keys(FOOD_TYPES).length} 种食材`, { size: 16 }), pos(l + 30, t + 70), color(200, 200, 220), z(103), fixed(), 'enc-p']);

  // 类别按钮
  Object.keys(CATS).forEach((cat, i) => {
    const cfg = CATS[cat];
    const col = sc(cfg.c);
    const sel = encCategory === cat;
    const btn = add([rect(85, 35), pos(l + 30 + i * 95, t + 95), color(sel ? rgb(55, 55, 80) : rgb(40, 40, 55)), outline(2, rgb(col[0], col[1], col[2])), z(103), fixed(), area(), 'enc-p']);
    btn.add([text(cfg.name, { size: 15 }), pos(42, 17), anchor('center'), color(255, 255, 255)]);
    btn.onHover(() => btn.color = rgb(60, 60, 85));
    btn.onHoverEnd(() => btn.color = sel ? rgb(55, 55, 80) : rgb(40, 40, 55));
    btn.onClick(() => {
      encCategory = cat;
      encScroll = 0;
      rebuildEnc();
    });
  });

  // 列表背景
  add([rect(w - 60, h - 200), pos(l + 30, t + 145), color(15, 15, 25), outline(2, rgb(50, 50, 70)), z(102), fixed(), 'enc-p']);

  // 食物列表
  renderFoodList(l, t, w, h);

  // 底部提示
  add([text('按 W/S 或 ↑/↓ 键滚动', { size: 14 }), pos(cx, t + h - 25), anchor('center'), color(150, 150, 170), z(103), fixed(), 'enc-p']);
}

function renderFoodList(l, t, w, h) {
  const foods = getFoods();
  const itemH = 55, gap = 8;
  const lx = l + 30, ly = t + 145;
  const lw = w - 60, lh = h - 200;

  encMaxScroll = Math.max(0, foods.length * (itemH + gap) - lh + 20);

  foods.forEach((f, i) => {
    const y = ly + 5 + i * (itemH + gap) - encScroll;
    if (y < ly - itemH || y > ly + lh) return;

    const fc = sc(f.color);

    add([rect(lw - 10, itemH), pos(lx + 5, y), color(35, 35, 50), outline(1, rgb(60, 60, 80)), z(104), fixed(), 'enc-p']);
    add([circle(18), pos(lx + 30, y + itemH / 2), color(fc[0], fc[1], fc[2]), z(105), fixed(), 'enc-p']);
    add([text(f.name || '未知', { size: 18 }), pos(lx + 60, y + 10), color(255, 255, 255), z(105), fixed(), 'enc-p']);
    add([text(`${f.points || 0} 分`, { size: 15 }), pos(lx + 60, y + 32), color(255, 210, 100), z(105), fixed(), 'enc-p']);

    const cfg = CATS[f.category] || CATS['all'];
    const cc = sc(cfg.c);
    add([rect(65, 26), pos(lx + lw - 75, y + (itemH - 26) / 2), color(cc[0], cc[1], cc[2]), opacity(0.75), z(105), fixed(), 'enc-p']);
    add([text(cfg.name, { size: 14 }), pos(lx + lw - 42, y + itemH / 2), anchor('center'), color(255, 255, 255), z(106), fixed(), 'enc-p']);
  });
}

function getFoods() {
  const all = Object.entries(FOOD_TYPES);
  if (encCategory === 'all') return all.map(([k, f]) => ({ ...f, key: k }));
  return all.filter(([k, f]) => f.category === encCategory).map(([k, f]) => ({ ...f, key: k }));
}

function doScroll(dir) {
  if (!encVisible) return;
  encScroll = dir === 'up' ? Math.max(0, encScroll - 60) : Math.min(encMaxScroll, encScroll + 60);
  rebuildEnc();
}

export function initEncyclopediaSystem() {
  createEncyclopediaButton();

  // 注册控制台函数
  registerEncyclopediaFuncs(openEnc, closeEnc);

  onKeyPress('up', () => doScroll('up'));
  onKeyPress('down', () => doScroll('down'));
  onKeyPress('w', () => doScroll('up'));
  onKeyPress('s', () => doScroll('down'));
}

// 导出打开/关闭函数供控制台使用
export { openEnc, closeEnc };