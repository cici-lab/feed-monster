/**
 * 拖拽交互系统
 * 处理食物拖拽、轨迹显示、力度判断
 */

import { getMonster } from './monster.js';
import { getActiveFoods, FOOD_TYPES } from './food.js';
import { gameState } from './state.js';
import { getUIRefs } from './ui.js';

let isDragging = false;
let draggedFood = null;
let dragStartPos = null;
let dragPositions = []; // 存储拖拽轨迹点
let dragStartTime = 0;
let lastMousePos = null;
let throwVelocity = { x: 0, y: 0 };

// 轨迹点
let trailPoints = [];

// 检查是否点击了全屏按钮区域
function isClickOnFullscreenBtn(mouse) {
  const btnX = width() - 120;
  const btnY = 20;
  return mouse.x >= btnX && mouse.x <= btnX + 100 && mouse.y >= btnY && mouse.y <= btnY + 36;
}

// 处理全屏按钮点击
function handleFullscreenClick() {
  const uiRefs = getUIRefs();
  if (!uiRefs) return;
  
  if (isFullscreen()) {
    setFullscreen(false);
    uiRefs.fullscreenText.text = '全屏';
  } else {
    setFullscreen(true);
    uiRefs.fullscreenText.text = '退出全屏';
  }
}

export function initDragSystem(monster, state) {
  // 鼠标按下检测
  onMousePress('left', () => {
    const mouse = mousePos();

    // 先检查是否点击了全屏按钮
    if (isClickOnFullscreenBtn(mouse)) {
      handleFullscreenClick();
      return; // 不处理食物拖拽
    }

    // 检查是否点击到了食物（使用距离检测）
    const foods = getActiveFoods();
    for (const food of foods) {
      const foodSize = food.foodType?.size || 20;
      const actualSize = Array.isArray(foodSize) ? Math.max(foodSize[0], foodSize[1]) : foodSize;
      const dx = mouse.x - food.pos.x;
      const dy = mouse.y - food.pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < actualSize + 10) { // 加10像素的点击容差
        startDrag(food, mouse);
        break;
      }
    }
  });

  // 鼠标释放
  onMouseRelease('left', () => {
    if (isDragging && draggedFood) {
      endDrag();
    }
  });

  // 鼠标移动时更新拖拽和全屏按钮悬停效果
  onUpdate(() => {
    if (isDragging && draggedFood) {
      updateDrag();
    }
    
    // 更新轨迹淡出
    updateTrail();
    
    // 全屏按钮悬停效果
    const uiRefs = getUIRefs();
    if (uiRefs && uiRefs.fullscreenBtnBg) {
      const m = mousePos();
      if (isClickOnFullscreenBtn(m)) {
        uiRefs.fullscreenBtnBg.color = rgb(80, 80, 120);
      } else {
        uiRefs.fullscreenBtnBg.color = rgb(60, 60, 90);
      }
    }
  });

  return {
    getThrowVelocity: () => throwVelocity,
    isDragging: () => isDragging,
  };
}

function startDrag(food, mousePos) {
  isDragging = true;
  draggedFood = food;
  dragStartPos = { x: food.pos.x, y: food.pos.y };
  dragStartTime = time();
  dragPositions = [{ x: mousePos.x, y: mousePos.y, time: time() }];
  lastMousePos = { x: mousePos.x, y: mousePos.y };
  throwVelocity = { x: 0, y: 0 };
  
  // 高亮被拖拽的食物
  food.opacity = 0.8;
  food.scale = vec2(1.2);
}

function updateDrag() {
  const mouse = mousePos();
  
  // 更新食物位置
  draggedFood.pos.x = mouse.x;
  draggedFood.pos.y = mouse.y;
  
  // 计算速度
  const currentTime = time();
  if (lastMousePos) {
    const dt = 1/60; // 假设60fps
    throwVelocity.x = (mouse.x - lastMousePos.x) / dt;
    throwVelocity.y = (mouse.y - lastMousePos.y) / dt;
  }
  
  // 记录轨迹点
  dragPositions.push({ x: mouse.x, y: mouse.y, time: currentTime });
  
  // 只保留最近的轨迹点
  if (dragPositions.length > 20) {
    dragPositions.shift();
  }
  
  // 创建轨迹视觉效果
  addTrailPoint(mouse.x, mouse.y);
  
  lastMousePos = { x: mouse.x, y: mouse.y };
  
  // 检查是否与怪物碰撞
  const monster = getMonster();
  if (monster && checkCollision(draggedFood, monster)) {
    feedMonster(draggedFood);
  }
}

function endDrag() {
  if (!draggedFood) return;
  
  // 计算最终投掷速度
  const speed = Math.sqrt(throwVelocity.x ** 2 + throwVelocity.y ** 2);
  
  // 重置食物状态
  if (draggedFood.exists()) {
    draggedFood.opacity = 1;
    draggedFood.scale = vec2(1);
  }
  
  // 如果投掷速度很快，食物会继续飞行
  if (speed > 200) {
    applyThrowPhysics(draggedFood);
  }
  
  isDragging = false;
  draggedFood = null;
  dragPositions = [];
}

function applyThrowPhysics(food) {
  const friction = 0.95;
  let velocity = { x: throwVelocity.x, y: throwVelocity.y };
  
  food.use({
    id: 'throwPhysics',
    update() {
      if (Math.abs(velocity.x) > 5 || Math.abs(velocity.y) > 5) {
        food.pos.x += velocity.x * dt();
        food.pos.y += velocity.y * dt();
        
        velocity.x *= friction;
        velocity.y *= friction;
        
        // 检查碰撞
        const monster = getMonster();
        if (monster && checkCollision(food, monster)) {
          feedMonster(food);
        }
      }
    }
  });
}

function checkCollision(food, monster) {
  const dx = food.pos.x - monster.pos.x;
  const dy = food.pos.y - monster.pos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 碰撞距离 = 怪物半径 + 食物大小
  const foodSize = food.foodType.size || 20;
  const actualSize = Array.isArray(foodSize) ? Math.max(foodSize[0], foodSize[1]) : foodSize;
  const collisionDistance = 80 + actualSize;
  
  return distance < collisionDistance;
}

function feedMonster(food) {
  const monster = getMonster();
  const foodType = food.foodType;
  
  // 检查是否为不可食用食物
  if (foodType.inedible) {
    rejectFood(food, monster);
    return;
  }
  
  // 计算投掷力度加成
  const speed = Math.sqrt(throwVelocity.x ** 2 + throwVelocity.y ** 2);
  const speedBonus = Math.min(2, 1 + speed / 500); // 最高2倍加成
  
  // 计算连击加成
  const now = time();
  if (now - gameState.lastFeedTime < 2) {
    gameState.combo++;
  } else {
    gameState.combo = 1;
  }
  gameState.lastFeedTime = now;
  
  // 最终得分
  const points = Math.floor(foodType.points * speedBonus * (1 + gameState.combo * 0.1));
  gameState.score += points;
  
  // 增加饱食度
  gameState.hunger = Math.min(100, gameState.hunger + foodType.points / 2);
  
  // 怪物成长
  monster.grow(foodType.points / 100);
  
  // 怪物反应
  monster.setEating();
  
  // 根据食物类型显示不同反应
  if (foodType.reaction) {
    showReaction(monster, foodType.reaction);
  }
  
  // 显示得分特效
  showScorePopup(food.pos.x, food.pos.y, points, speedBonus);
  
  // 吃掉特效
  createEatEffect(food.pos.x, food.pos.y, foodType.color);
  
  // 移除食物
  food.destroy();
  
  // 从活跃列表中移除
  const foods = getActiveFoods();
  const index = foods.indexOf(food);
  if (index > -1) {
    foods.splice(index, 1);
  }
  
  isDragging = false;
  draggedFood = null;
}

// 拒绝食物函数
function rejectFood(food, monster) {
  // 重置拖拽状态
  isDragging = false;
  draggedFood = null;
  
  // 重置食物状态
  food.opacity = 1;
  food.scale = vec2(1);
  
  // 显示拒绝表情
  showReaction(monster, 'reject');
  
  // 显示拒绝特效
  showRejectEffect(food.pos.x, food.pos.y);
  
  // 弹开食物
  const bounceAngle = Math.atan2(food.pos.y - monster.pos.y, food.pos.x - monster.pos.x);
  const bounceSpeed = 200;
  const friction = 0.95;
  let velocity = { x: Math.cos(bounceAngle) * bounceSpeed, y: Math.sin(bounceAngle) * bounceSpeed };
  
  food.use({
    id: 'bounceAway',
    update() {
      if (Math.abs(velocity.x) > 5 || Math.abs(velocity.y) > 5) {
        food.pos.x += velocity.x * dt();
        food.pos.y += velocity.y * dt();
        
        velocity.x *= friction;
        velocity.y *= friction;
      }
    }
  });
}

// 显示拒绝特效
function showRejectEffect(x, y) {
  // X 标记
  add([
    text('✗', { size: 32 }),
    pos(x, y),
    anchor('center'),
    color(255, 80, 80),
    opacity(1),
    lifespan(0.8),
    z(20),
    {
      update() {
        this.pos.y -= 40 * dt();
        this.opacity -= 1.25 * dt();
      }
    },
  ]);
  
  // 拒绝粒子效果
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const speed = rand(80, 150);
    
    add([
      circle(4),
      pos(x, y),
      color(255, 100, 100),
      opacity(1),
      lifespan(0.4),
      z(15),
      {
        update() {
          this.pos.x += Math.cos(angle) * speed * dt();
          this.pos.y += Math.sin(angle) * speed * dt();
          this.opacity -= 2.5 * dt();
        }
      },
    ]);
  }
}

function showReaction(monster, reaction) {
  // 在怪物上方显示反应表情
  const reactions = {
    happy: '(◕‿◕)',
    disgust: '(>﹏<)',
    surprised: '(°o°)',
    shocked: '(⚡_⚡)',
    love: '(♥‿♥)',
    nerd: '(⌐■_■)',
    reject: '(╬▔皿▔)',
  };
  
  const emoji = reactions[reaction] || '(◠‿◠)';
  
  add([
    text(emoji, { size: 24 }),
    pos(monster.pos.x, monster.pos.y - 100),
    anchor('center'),
    color(255, 255, 255),
    opacity(1),
    lifespan(1),
    z(20),
    {
      update() {
        this.pos.y -= 30 * dt();
        this.opacity -= dt();
      }
    },
  ]);
}

function showScorePopup(x, y, points, multiplier) {
  add([
    text(`+${points}`, { size: 28, font: 'monospace' }),
    pos(x, y),
    anchor('center'),
    color(255, 255, 100),
    opacity(1),
    lifespan(1.5),
    z(20),
    {
      update() {
        this.pos.y -= 50 * dt();
        this.opacity -= 0.7 * dt();
      }
    },
  ]);
  
  // 如果有倍率加成，显示额外信息
  if (multiplier > 1.2) {
    add([
      text(`x${multiplier.toFixed(1)} SPEED!`, { size: 16 }),
      pos(x, y + 30),
      anchor('center'),
      color(255, 150, 50),
      opacity(1),
      lifespan(1),
      z(20),
      {
        update() {
          this.pos.y -= 20 * dt();
          this.opacity -= dt();
        }
      },
    ]);
  }
  
  // 连击显示
  if (gameState.combo > 1) {
    add([
      text(`${gameState.combo} COMBO!`, { size: 20 }),
      pos(x, y + (multiplier > 1.2 ? 50 : 30)),
      anchor('center'),
      color(100, 200, 255),
      opacity(1),
      lifespan(1),
      z(20),
      {
        update() {
          this.pos.y -= 25 * dt();
          this.opacity -= dt();
        }
      },
    ]);
  }
}

function createEatEffect(x, y, foodColor) {
  // 粒子爆炸效果
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const speed = rand(100, 200);
    
    add([
      circle(rand(3, 8)),
      pos(x, y),
      color(foodColor[0], foodColor[1], foodColor[2]),
      opacity(1),
      lifespan(0.6),
      z(15),
      {
        update() {
          this.pos.x += Math.cos(angle) * speed * dt();
          this.pos.y += Math.sin(angle) * speed * dt();
          this.opacity -= 1.7 * dt();
        }
      },
    ]);
  }
  
  // 星星特效
  for (let i = 0; i < 4; i++) {
    add([
      text('✦', { size: rand(16, 24) }),
      pos(x + rand(-30, 30), y + rand(-30, 30)),
      anchor('center'),
      color(255, 255, 100),
      opacity(1),
      lifespan(0.5),
      z(15),
      {
        update() {
          this.pos.y -= 60 * dt();
          this.opacity -= 2 * dt();
        }
      },
    ]);
  }
}

// 添加轨迹点
function addTrailPoint(x, y) {
  const point = add([
    circle(6),
    pos(x, y),
    color(255, 255, 255),
    opacity(0.6),
    z(10),
    {
      life: 0.3,
      maxLife: 0.3,
    },
  ]);
  
  trailPoints.push(point);
}

// 更新轨迹淡出
function updateTrail() {
  for (let i = trailPoints.length - 1; i >= 0; i--) {
    const point = trailPoints[i];
    point.life -= dt();
    
    if (point.life <= 0) {
      point.destroy();
      trailPoints.splice(i, 1);
    } else {
      const alpha = point.life / point.maxLife;
      point.opacity = alpha * 0.6;
      point.scale = vec2(alpha);
    }
  }
}

// 绘制拖拽轨迹线（可选的线条效果）
export function drawTrailLine() {
  if (dragPositions.length < 2) return;
  
  // 使用 Kaplay 的绘图 API 绘制曲线
  // 这里是伪代码，实际需要根据 Kaplay API 调整
  for (let i = 1; i < dragPositions.length; i++) {
    const prev = dragPositions[i - 1];
    const curr = dragPositions[i];
    const alpha = i / dragPositions.length;
    
    // drawLine({
    //   p1: vec2(prev.x, prev.y),
    //   p2: vec2(curr.x, curr.y),
    //   width: 2 + alpha * 4,
    //   color: rgba(255, 255, 255, alpha * 0.5),
    // });
  }
}
