/**
 * petMode.js - 桌宠模式主控制器
 *
 * 核心设计：
 *   桌宠窗口是一个透明小窗口，里面只渲染小怪兽精灵（不画背景）
 *   视觉上就像一只小怪兽站在桌面上
 *
 * 玩法：
 *   1. 右键小怪兽 → 「截图投喂」或 Ctrl+Shift+F → 出现全屏选区遮罩
 *   2. 拖拽框选任意屏幕内容 → 截图块弹出在怪兽旁边
 *   3. 拖拽截图块扔向怪兽 → 碎裂吃掉 + 怪兽反应 + 加分
 *   4. 双击怪兽 → 返回完整游戏界面
 *   5. 左键拖拽怪兽 → 在桌面上移动位置
 */

import { createMonster, updateMonsterPosition, getMonster, loadSavedMonsterType } from './monster.js';
import { gameState, saveGame, loadGame, addScore } from './state.js';

// ──────────────────────────────────────────────────
// 状态
// ──────────────────────────────────────────────────
let isPetMode = false;
let screenshotFoods = []; // 当前画面上的截图食物块
let petModeListenersRegistered = false;
let petMonster = null;   // 桌宠场景中的怪兽实例

// 拖拽状态
let dragging = {
  active: false,
  food: null,
  offsetX: 0,
  offsetY: 0,
  lastX: 0,
  lastY: 0,
  velX: 0,
  velY: 0,
};

// 怪兽拖拽移动（桌宠在桌面上拖来拖去）
let petDrag = {
  active: false,
  startWinX: 0,
  startWinY: 0,
  startMouseX: 0,
  startMouseY: 0,
  lastWinX: 0,   // 缓存最新窗口位置，避免每次 move 都 IPC 查询
  lastWinY: 0,
  pendingX: 0,    // 待发送的目标位置（RAF 节流用）
  pendingY: 0,
  rafId: null,    // requestAnimationFrame ID
};

// ──────────────────────────────────────────────────
// 初始化桌宠模式
// ──────────────────────────────────────────────────
export function initPetMode() {
  if (!window.electronAPI) return;

  // 注册主进程消息监听（只注册一次）
  if (!petModeListenersRegistered) {
    petModeListenersRegistered = true;

    // 收到截图结果 → 在画面上生成截图食物块
    window.electronAPI.onScreenshotReady(({ dataURL, rect }) => {
      if (isPetMode) {
        spawnScreenshotFood(dataURL, rect);
      }
    });

    // 快捷键 / 托盘触发截图
    window.electronAPI.onTriggerScreenshot(() => {
      if (isPetMode) {
        triggerScreenshot();
      }
    });
  }

  // 读取 URL 参数，判断是否启动时就进入桌宠模式
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'pet') {
    enterPetMode();
  }

  // 监听主进程切换指令
  window.electronAPI.onEnterPetMode(() => enterPetMode());
  window.electronAPI.onEnterGameMode(() => exitPetMode());
}

// ──────────────────────────────────────────────────
// 进入 / 退出桌宠模式
// ──────────────────────────────────────────────────
export function enterPetMode() {
  isPetMode = true;

  // 给 body 和 html 添加 pet-mode class（触发 CSS 透明背景）
  document.body.classList.add('pet-mode');
  document.documentElement.classList.add('pet-mode');

  // 只有桌宠窗口（URL 含 ?mode=pet）才切换到桌宠场景
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'pet') {
    // 加载游戏存档（保持分数同步）
    loadGame();
    loadSavedMonsterType();

    // 切换到专用的桌宠场景（只画怪兽，透明背景）
    if (typeof go === 'function') {
      go('pet');
    }
  }

  startHungerTick();
}

export function exitPetMode() {
  isPetMode = false;
  // 移除 pet-mode class
  document.body.classList.remove('pet-mode');
  document.documentElement.classList.remove('pet-mode');
  // 清除所有截图食物块
  screenshotFoods.forEach(f => {
    if (f.domEl) f.domEl.remove();
  });
  screenshotFoods = [];
}

// ──────────────────────────────────────────────────
// 注册 Kaplay 桌宠场景（只在 petMode 模块加载时注册）
// ──────────────────────────────────────────────────
export function registerPetScene() {
  if (typeof scene !== 'function') return;

  scene('pet', () => {
    // ── 透明背景 ──
    // Kaplay 背景色已在 main.js 初始化时设为 [0,0,0,0]（透明，不画棋盘格）
    // 加上 CSS 透明（setupPetCanvas），只有怪兽精灵可见

    // 加载存档
    loadGame();
    loadSavedMonsterType();

    // ── 创建怪兽 ──
    // 逻辑分辨率 1200x800，怪兽在中央
    petMonster = createMonster(width() / 2, height() / 2 + 80);

    // ── 摄像机：横向放大补偿 stretch 压缩 ──
    // 窗口 320x400，逻辑 1200x800
    // stretch 后水平缩放 320/1200=0.267，垂直缩放 400/800=0.5
    // 水平被压缩了 0.5/0.267 ≈ 1.875 倍
    // 所以 camScale.x 要比 camScale.y 大约 1.875 倍来补偿
    // camScale.y=2.2 让怪兽纵向大小合适，camScale.x≈2.2*1.65≈3.6 让横向不压缩
    camScale(vec2(3.6, 2.2));
    camPos(width() / 2, height() / 2 + 80);

    // 饱食度自然下降
    loop(1, () => {
      if (!isPetMode) return;
      gameState.hunger = Math.max(0, gameState.hunger - 0.5);

      if (petMonster) {
        if (gameState.hunger < 20) {
          petMonster.setSad && petMonster.setSad();
        } else if (gameState.hunger > 80) {
          petMonster.setHappy && petMonster.setHappy();
        } else {
          petMonster.setIdle && petMonster.setIdle();
        }
      }
    });

    // ── 桌宠交互 ──
    setupPetInteraction();

    // ── 透明化画布 ──
    setupPetCanvas();
  });
}

// ──────────────────────────────────────────────────
// 桌宠模式的画布设置（透明背景，让桌面透出来）
// ──────────────────────────────────────────────────
function setupPetCanvas() {
  // CSS 层面全部透明
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.style.background = 'transparent';
  }
  document.body.style.background = 'transparent';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  document.documentElement.style.background = 'transparent';

  // Kaplay 层面：确保背景透明（bgColor 不为 null 就不会画棋盘格）
  // 用 Kaplay 的 setBackground API 设为全透明
  try {
    if (typeof setBackground === 'function') {
      setBackground(0, 0, 0, 0);
    }
  } catch (e) {
    console.warn('[petMode] setBackground 失败:', e);
  }
}

// ──────────────────────────────────────────────────
// 触发截图
// ──────────────────────────────────────────────────
export function triggerScreenshot() {
  if (!window.electronAPI) return;
  window.electronAPI.startScreenshot();
}

// ──────────────────────────────────────────────────
// 生成截图食物块
// ──────────────────────────────────────────────────

/**
 * 把截图数据变成一个可拖拽的"食物块" DOM 元素
 * 叠加在 Kaplay canvas 之上，用 CSS 做圆角 + 阴影
 */
function spawnScreenshotFood(dataURL, rect) {
  const MAX_SIZE = 140;
  const MIN_SIZE = 50;

  const aspect = rect.width / rect.height;
  let displayW, displayH;

  if (rect.width > rect.height) {
    displayW = Math.min(MAX_SIZE, Math.max(MIN_SIZE, rect.width * 0.25));
    displayH = displayW / aspect;
  } else {
    displayH = Math.min(MAX_SIZE, Math.max(MIN_SIZE, rect.height * 0.25));
    displayW = displayH * aspect;
  }

  // 初始位置：在桌宠窗口中央偏上方出现
  const canvasEl = document.querySelector('canvas');
  const cx = canvasEl ? canvasEl.offsetWidth / 2 : 110;
  const cy = canvasEl ? canvasEl.offsetHeight / 2 : 110;
  const spawnX = cx + (Math.random() - 0.5) * 60 - displayW / 2;
  const spawnY = cy - 80 + (Math.random() - 0.5) * 30 - displayH / 2;

  // 创建 DOM 容器
  const container = document.createElement('div');
  container.className = 'screenshot-food';
  container.style.cssText = `
    position: fixed;
    left: ${spawnX}px;
    top: ${spawnY}px;
    width: ${displayW}px;
    height: ${displayH}px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.3);
    cursor: grab;
    z-index: 9999;
    transform-origin: center center;
    transition: transform 0.08s ease, box-shadow 0.15s ease;
    -webkit-app-region: no-drag;
    will-change: transform, left, top;
  `;

  const img = document.createElement('img');
  img.src = dataURL;
  img.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
  `;
  container.appendChild(img);
  document.body.appendChild(container);

  // 入场动画
  container.animate([
    { transform: 'scale(0) rotate(-20deg)', opacity: 0 },
    { transform: 'scale(1.15) rotate(5deg)', opacity: 1, offset: 0.6 },
    { transform: 'scale(1) rotate(0deg)', opacity: 1 },
  ], {
    duration: 350,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    fill: 'forwards',
  });

  // 食物对象
  const foodObj = {
    domEl: container,
    dataURL,
    x: spawnX,
    y: spawnY,
    w: displayW,
    h: displayH,
    velX: 0,
    velY: 0,
    isBeingDragged: false,
    eaten: false,
  };

  screenshotFoods.push(foodObj);
  registerFoodDrag(foodObj);
  return foodObj;
}

// ──────────────────────────────────────────────────
// 拖拽系统
// ──────────────────────────────────────────────────
function registerFoodDrag(foodObj) {
  const el = foodObj.domEl;

  el.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || foodObj.eaten) return;
    e.preventDefault();
    e.stopPropagation();

    dragging.active = true;
    dragging.food = foodObj;
    dragging.offsetX = e.clientX - foodObj.x;
    dragging.offsetY = e.clientY - foodObj.y;
    dragging.lastX = e.clientX;
    dragging.lastY = e.clientY;
    dragging.velX = 0;
    dragging.velY = 0;

    foodObj.isBeingDragged = true;
    el.style.cursor = 'grabbing';
    el.style.transform = 'scale(1.08) rotate(2deg)';
    el.style.boxShadow = '0 8px 30px rgba(0,229,255,0.5), 0 0 0 2px rgba(0,229,255,0.6)';
    el.style.zIndex = '10000';
  });
}

function setupPetInteraction() {
  // 全局鼠标移动 - 处理截图食物拖拽 + 怪兽窗口拖拽
  document.addEventListener('mousemove', onPetMouseMove);
  document.addEventListener('mouseup', onPetMouseUp);

  // 双击桌宠返回游戏模式
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.addEventListener('dblclick', () => {
      if (isPetMode && window.electronAPI) {
        window.electronAPI.switchToGame();
      }
    });

    // 左键拖拽怪兽 → 移动整个桌宠窗口
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      // 如果正在拖拽食物块就不触发窗口移动
      if (dragging.active) return;

      petDrag.active = true;
      petDrag.startMouseX = e.screenX;
      petDrag.startMouseY = e.screenY;

      // 获取当前窗口位置（仅在按下时获取一次，之后靠增量计算）
      if (window.electronAPI && window.electronAPI.getPetWindowPos) {
        window.electronAPI.getPetWindowPos().then(pos => {
          petDrag.startWinX = pos.x;
          petDrag.startWinY = pos.y;
          petDrag.lastWinX = pos.x;
          petDrag.lastWinY = pos.y;
        });
      }
    });
  }

  // 右键菜单
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showPetContextMenu(e.clientX, e.clientY);
  });
}

function onPetMouseMove(e) {
  // 处理窗口拖拽（怪兽拖拽移动）
  // 用 requestAnimationFrame 节流：多次 mousemove 只发一次 IPC
  if (petDrag.active && window.electronAPI && window.electronAPI.movePetWindow) {
    const dx = e.screenX - petDrag.startMouseX;
    const dy = e.screenY - petDrag.startMouseY;
    petDrag.pendingX = petDrag.startWinX + dx;
    petDrag.pendingY = petDrag.startWinY + dy;

    // 只在没排队时才安排下一帧发送（合并多次 mousemove）
    if (!petDrag.rafId) {
      petDrag.rafId = requestAnimationFrame(() => {
        petDrag.rafId = null;
        if (petDrag.active) {
          petDrag.lastWinX = petDrag.pendingX;
          petDrag.lastWinY = petDrag.pendingY;
          window.electronAPI.movePetWindow({ x: petDrag.pendingX, y: petDrag.pendingY });
        }
      });
    }
    return; // 拖拽窗口时不处理食物拖拽
  }

  // 处理截图食物拖拽
  if (!dragging.active || !dragging.food) return;

  const newX = e.clientX - dragging.offsetX;
  const newY = e.clientY - dragging.offsetY;

  dragging.velX = e.clientX - dragging.lastX;
  dragging.velY = e.clientY - dragging.lastY;
  dragging.lastX = e.clientX;
  dragging.lastY = e.clientY;

  dragging.food.x = newX;
  dragging.food.y = newY;
  dragging.food.domEl.style.left = newX + 'px';
  dragging.food.domEl.style.top = newY + 'px';

  // 检测是否靠近小怪兽 → 高亮提示
  const mPos = getMonsterCenterPos();
  const dist = getDistToMonster(dragging.food, mPos);

  if (dist < 80) {
    dragging.food.domEl.style.boxShadow = '0 8px 30px rgba(255, 200, 50, 0.8), 0 0 0 3px rgba(255,200,50,0.9)';
    dragging.food.domEl.style.transform = 'scale(1.12) rotate(0deg)';
  } else {
    dragging.food.domEl.style.boxShadow = '0 8px 30px rgba(0,229,255,0.5), 0 0 0 2px rgba(0,229,255,0.6)';
    dragging.food.domEl.style.transform = 'scale(1.08) rotate(2deg)';
  }

  // 碰撞检测 → 喂食
  if (dist < 55) {
    feedMonsterWithScreenshot(dragging.food);
    return;
  }
}

function onPetMouseUp(e) {
  // 结束窗口拖拽
  if (petDrag.active) {
    // 如果有排队的 RAF，立即执行确保最终位置到位
    if (petDrag.rafId) {
      cancelAnimationFrame(petDrag.rafId);
      petDrag.rafId = null;
      // 确保最终位置已发送
      if (window.electronAPI && window.electronAPI.movePetWindow) {
        window.electronAPI.movePetWindow({ x: petDrag.pendingX, y: petDrag.pendingY });
      }
    }
    petDrag.active = false;
    return;
  }

  if (!dragging.active || !dragging.food) return;

  const food = dragging.food;
  dragging.active = false;
  dragging.food = null;

  if (food.eaten) return;

  food.isBeingDragged = false;
  food.domEl.style.cursor = 'grab';
  food.domEl.style.transform = 'scale(1) rotate(0deg)';
  food.domEl.style.boxShadow = '0 4px 20px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.3)';
  food.domEl.style.zIndex = '9999';

  // 甩出效果
  const speed = Math.sqrt(dragging.velX ** 2 + dragging.velY ** 2);
  if (speed > 8) {
    food.velX = dragging.velX * 3;
    food.velY = dragging.velY * 3;
    startFoodPhysics(food);
  }
}

// ──────────────────────────────────────────────────
// 物理投掷
// ──────────────────────────────────────────────────
function startFoodPhysics(food) {
  if (food.eaten || food._physicsRunning) return;
  food._physicsRunning = true;

  const friction = 0.88;
  const gravity = 0.4;

  function tick() {
    if (!food._physicsRunning || food.eaten) return;

    food.velX *= friction;
    food.velY = food.velY * friction + gravity;

    food.x += food.velX;
    food.y += food.velY;
    food.domEl.style.left = food.x + 'px';
    food.domEl.style.top = food.y + 'px';

    const rot = food.velX * 0.5;
    food.domEl.style.transform = `scale(1) rotate(${rot}deg)`;

    // 检测碰撞
    const mPos = getMonsterCenterPos();
    const dist = getDistToMonster(food, mPos);
    if (dist < 55) {
      feedMonsterWithScreenshot(food);
      return;
    }

    if (Math.abs(food.velX) < 0.5 && Math.abs(food.velY) < 0.5) {
      food._physicsRunning = false;
      return;
    }

    // 超出边界 → 弹回
    const canvasEl = document.querySelector('canvas');
    const maxW = canvasEl ? canvasEl.offsetWidth : 220;
    const maxH = canvasEl ? canvasEl.offsetHeight : 220;
    if (food.x < 0) { food.x = 0; food.velX = Math.abs(food.velX) * 0.6; }
    if (food.x + food.w > maxW) { food.x = maxW - food.w; food.velX = -Math.abs(food.velX) * 0.6; }
    if (food.y + food.h > maxH) { food.y = maxH - food.h; food.velY = -Math.abs(food.velY) * 0.5; food.velX *= 0.7; }

    food.domEl.style.left = food.x + 'px';
    food.domEl.style.top = food.y + 'px';

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ──────────────────────────────────────────────────
// 喂食：截图块进嘴 → 咀嚼碎裂动画
// ──────────────────────────────────────────────────
function feedMonsterWithScreenshot(food) {
  if (food.eaten) return;
  food.eaten = true;
  food._physicsRunning = false;
  food.isBeingDragged = false;

  const idx = screenshotFoods.indexOf(food);
  if (idx > -1) screenshotFoods.splice(idx, 1);

  if (dragging.food === food) {
    dragging.active = false;
    dragging.food = null;
  }

  const mPos = getMonsterCenterPos();

  // 1. 截图块飞向怪兽嘴巴
  flyToMouth(food, mPos, () => {
    // 2. 怪兽张嘴 + 咀嚼动画
    if (petMonster && petMonster.setEating) petMonster.setEating();

    // 3. 截图块碎裂消失
    shatterFood(food, mPos);

    // 4. 根据截图面积计算分数
    const area = food.w * food.h;
    const basePoints = Math.min(200, Math.max(20, Math.floor(area / 80)));
    const points = basePoints + Math.floor(Math.random() * 20);

    // 5. 更新游戏状态（包含累计分）
    addScore(points);
    gameState.hunger = Math.min(100, gameState.hunger + points / 10);

    // 6. 显示得分
    showScorePopup(mPos.x, mPos.y - 50, points);

    // 7. 怪兽反应
    analyzeAndReact(food.dataURL, points);
  });
}

// ──────────────────────────────────────────────────
// 截图块飞向怪兽嘴巴动画
// ──────────────────────────────────────────────────
function flyToMouth(food, targetPos, onComplete) {
  const el = food.domEl;
  const startX = food.x;
  const startY = food.y;
  const endX = targetPos.x - food.w / 2;
  const endY = targetPos.y - food.h / 2 + 10;

  const duration = 280;
  const startTime = performance.now();

  // 怪兽张嘴
  if (petMonster && petMonster.parts && petMonster.parts.mouthOpen) {
    petMonster.parts.mouthOpen.opacity = 1;
    if (petMonster.parts.mouthClosed) petMonster.parts.mouthClosed.opacity = 0;
  }

  el.style.transition = 'none';
  el.style.pointerEvents = 'none';

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);

    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const arc = Math.sin(t * Math.PI) * (-30);

    const x = startX + (endX - startX) * ease;
    const y = startY + (endY - startY) * ease + arc;
    const scale = 1 - t * 0.5;
    const rot = t * 360 * (startX > targetPos.x ? -1 : 1);

    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.transform = `scale(${scale}) rotate(${rot}deg)`;
    el.style.opacity = t > 0.7 ? String(1 - (t - 0.7) / 0.3) : '1';

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      el.remove();
      onComplete && onComplete();
    }
  }

  requestAnimationFrame(animate);
}

// ──────────────────────────────────────────────────
// 截图碎裂特效
// ──────────────────────────────────────────────────
function shatterFood(food, centerPos) {
  const SHARDS = 10;

  for (let i = 0; i < SHARDS; i++) {
    const shard = document.createElement('div');
    const size = 10 + Math.random() * 14;
    const angle = (i / SHARDS) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const speed = 50 + Math.random() * 80;

    shard.style.cssText = `
      position: fixed;
      width: ${size}px;
      height: ${size}px;
      border-radius: 3px;
      overflow: hidden;
      left: ${centerPos.x - size / 2}px;
      top: ${centerPos.y - size / 2}px;
      z-index: 10001;
      pointer-events: none;
      background-image: url(${food.dataURL});
      background-size: ${food.w}px ${food.h}px;
      background-position: ${-(Math.random() * (food.w - size)).toFixed(0)}px ${-(Math.random() * (food.h - size)).toFixed(0)}px;
    `;
    document.body.appendChild(shard);

    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    const startTime = performance.now();
    const lifetime = 500 + Math.random() * 300;

    function animateShard(now) {
      const elapsed = now - startTime;
      const t = elapsed / lifetime;

      if (t >= 1) { shard.remove(); return; }

      vx *= 0.93;
      vy = vy * 0.93 + 1.5;
      const scale = 1 - t * 0.6;
      const opacity = 1 - t * 1.2;

      const x = centerPos.x - size / 2 + (vx * elapsed / speed) * 0.8;
      const y = centerPos.y - size / 2 + (vy * elapsed / speed) * 0.8;

      shard.style.left = x + 'px';
      shard.style.top = y + 'px';
      shard.style.transform = `scale(${Math.max(0, scale)}) rotate(${vx * 0.5}deg)`;
      shard.style.opacity = String(Math.max(0, opacity));

      requestAnimationFrame(animateShard);
    }

    requestAnimationFrame(animateShard);
  }
}

// ──────────────────────────────────────────────────
// 简单图像分析 → 小怪兽反应
// ──────────────────────────────────────────────────
function analyzeAndReact(dataURL, points) {
  const img = new Image();
  img.onload = () => {
    const cvs = document.createElement('canvas');
    cvs.width = 32;
    cvs.height = 32;
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0, 32, 32);
    const data = ctx.getImageData(0, 0, 32, 32).data;

    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
    r = r / n; g = g / n; b = b / n;

    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);

    if (brightness > 180 && saturation > 50) {
      petMonster && petMonster.setHappy && petMonster.setHappy();
      showReactionBubble('(♥‿♥) 好好吃！');
    } else if (g > r * 1.2 && g > b * 1.2) {
      petMonster && petMonster.setHappy && petMonster.setHappy();
      showReactionBubble('(◕‿◕) 清脆！');
    } else if (r > 180 && r > g * 1.3) {
      petMonster && petMonster.setHappy && petMonster.setHappy();
      showReactionBubble('(°▽°) 热腾腾的！');
    } else if (brightness < 60) {
      petMonster && petMonster.setIdle && petMonster.setIdle();
      showReactionBubble('(°o°) 这是啥...');
    } else {
      petMonster && petMonster.setEating && petMonster.setEating();
      showReactionBubble('(•ᴗ•) 嗯嗯~');
    }
  };
  img.src = dataURL;
}

// ──────────────────────────────────────────────────
// 右键上下文菜单
// ──────────────────────────────────────────────────
function showPetContextMenu(x, y) {
  const old = document.getElementById('pet-context-menu');
  if (old) old.remove();

  const menu = document.createElement('div');
  menu.id = 'pet-context-menu';
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: rgba(20, 20, 35, 0.95);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    padding: 6px 0;
    z-index: 20000;
    min-width: 160px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    font-family: sans-serif;
    font-size: 14px;
    color: #fff;
    -webkit-app-region: no-drag;
  `;

  const items = [
    { label: '📷 截图投喂', action: () => triggerScreenshot() },
    { label: '🎮 返回游戏', action: () => window.electronAPI?.switchToGame() },
    { separator: true },
    { label: '❌ 退出', action: () => window.close() },
  ];

  items.forEach(item => {
    if (item.separator) {
      const sep = document.createElement('div');
      sep.style.cssText = 'height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0;';
      menu.appendChild(sep);
      return;
    }

    const btn = document.createElement('div');
    btn.textContent = item.label;
    btn.style.cssText = `
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 6px;
      margin: 2px 4px;
      transition: background 0.1s;
    `;
    btn.addEventListener('mouseover', () => btn.style.background = 'rgba(255,255,255,0.1)');
    btn.addEventListener('mouseout', () => btn.style.background = 'transparent');
    btn.addEventListener('click', () => {
      menu.remove();
      item.action();
    });
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);

  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('mousedown', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', closeMenu), 50);
}

// ──────────────────────────────────────────────────
// UI 辅助
// ──────────────────────────────────────────────────

/**
 * 获取怪兽在窗口中的中心位置（用于截图块碰撞检测）
 * 在桌宠模式下，怪兽在窗口中央
 */
function getMonsterCenterPos() {
  const canvasEl = document.querySelector('canvas');
  if (!canvasEl) return { x: 160, y: 200 };

  // 桌宠窗口 320x400，怪兽在中央偏下
  return {
    x: canvasEl.offsetWidth / 2,
    y: canvasEl.offsetHeight / 2 + 20,
  };
}

function getDistToMonster(food, mPos) {
  const foodCX = food.x + food.w / 2;
  const foodCY = food.y + food.h / 2;
  const dx = foodCX - mPos.x;
  const dy = foodCY - mPos.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** 在小怪兽旁边显示对话气泡 */
function showReactionBubble(text) {
  const mPos = getMonsterCenterPos();

  const bubble = document.createElement('div');
  bubble.textContent = text;
  bubble.style.cssText = `
    position: fixed;
    left: ${mPos.x + 30}px;
    top: ${mPos.y - 70}px;
    background: rgba(255, 255, 255, 0.95);
    color: #333;
    padding: 6px 12px;
    border-radius: 20px 20px 20px 4px;
    font-size: 13px;
    font-family: sans-serif;
    white-space: nowrap;
    z-index: 10005;
    pointer-events: none;
    box-shadow: 0 2px 12px rgba(0,0,0,0.25);
    animation: bubbleIn 0.2s ease forwards;
  `;
  document.body.appendChild(bubble);

  if (!document.getElementById('pet-anim-style')) {
    const style = document.createElement('style');
    style.id = 'pet-anim-style';
    style.textContent = `
      @keyframes bubbleIn {
        from { transform: scale(0.5) translateY(10px); opacity: 0; }
        to   { transform: scale(1) translateY(0);    opacity: 1; }
      }
      @keyframes bubbleOut {
        from { transform: scale(1) translateY(0);  opacity: 1; }
        to   { transform: scale(0.8) translateY(-10px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    bubble.style.animation = 'bubbleOut 0.3s ease forwards';
    setTimeout(() => bubble.remove(), 300);
  }, 1800);
}

/** 飞出得分数字 */
function showScorePopup(x, y, points) {
  const el = document.createElement('div');
  el.textContent = `+${points}`;
  el.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    font-size: 20px;
    font-weight: bold;
    font-family: monospace;
    color: #ffe066;
    text-shadow: 0 2px 8px rgba(0,0,0,0.6);
    pointer-events: none;
    z-index: 10006;
    transform: translate(-50%, 0);
  `;
  document.body.appendChild(el);

  const startY = y;
  const startTime = performance.now();

  function animateScore(now) {
    const t = (now - startTime) / 1200;
    if (t >= 1) { el.remove(); return; }
    el.style.top = (startY - t * 50) + 'px';
    el.style.opacity = String(t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3);
    requestAnimationFrame(animateScore);
  }
  requestAnimationFrame(animateScore);
}

// ──────────────────────────────────────────────────
// 饱食度自然下降
// ──────────────────────────────────────────────────
let hungerTickInterval = null;

function startHungerTick() {
  if (hungerTickInterval) clearInterval(hungerTickInterval);

  hungerTickInterval = setInterval(() => {
    if (!isPetMode) {
      clearInterval(hungerTickInterval);
      return;
    }
    gameState.hunger = Math.max(0, gameState.hunger - 0.5);

    if (petMonster) {
      if (gameState.hunger < 20) {
        petMonster.setSad && petMonster.setSad();
      } else if (gameState.hunger > 80) {
        petMonster.setHappy && petMonster.setHappy();
      } else {
        petMonster.setIdle && petMonster.setIdle();
      }
    }
  }, 1000);
}
