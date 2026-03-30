import kaplay from 'kaplay';
import { createMonster, updateMonsterPosition } from './monster.js';
import { createFood, FOOD_TYPES, initFoodSystem, clearAllActiveFoods } from './food.js';
import { createUI, initFullscreenControls, createTitleScreen, createGameOverScreen } from './ui.js';
import { initDragSystem } from './drag.js';
import { gameState, saveGame, loadGame, resetGameState, checkGameOver } from './state.js';
import { createForge } from './forge.js';
import { initRecipeSystem } from './recipes.js';
import { initEncyclopediaSystem } from './encyclopedia.js';
import { initRecipePanelSystem } from './recipePanel.js';
import { initConsoleControls, registerCraftTrigger, registerFullscreenToggle } from './console.js';

// 初始化 Kaplay 游戏引擎
kaplay({
  canvas: document.getElementById('game-container'),
  width: 1200,
  height: 800,
  background: [26, 26, 46],
  debug: true,
  global: true, // 启用全局函数
  stretch: true, // 自适应屏幕
  letterbox: false, // 不留黑边
  pixelDensity: window.devicePixelRatio || 1, // 高DPI支持，修复文字模糊
  buttons: {},
  layers: ['bg', 'game', 'ui', 'top'],
});

// 加载资源 - 使用程序化绘制的精灵
loadSprite('monster-body', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

// 标题场景
scene('title', () => {
  // 加载存档
  loadGame();
  
  // 创建标题画面
  createTitleScreen(gameState.highScore);
  
  // 点击开始游戏
  onMousePress(() => {
    go('game');
  });
  
  onKeyPress('space', () => {
    go('game');
  });
});

// 游戏结束场景
scene('gameover', () => {
  createGameOverScreen(gameState.score, gameState.highScore);
  
  // 点击重新开始
  onMousePress(() => {
    resetGameState();
    go('game');
  });
  
  onKeyPress('space', () => {
    resetGameState();
    go('game');
  });
});

// 游戏场景
scene('game', () => {
  // 重置游戏状态
  resetGameState();
  
  // 清除所有活跃食物（修复死亡后食物不再飘出的问题）
  clearAllActiveFoods();
  
  // 背景 - 使用 fixed() 保持固定
  const bg = add([
    rect(width(), height()),
    color(26, 26, 46),
    z(-10),
    fixed(),
    'background',
  ]);

  // 创建怪物 - 始终在屏幕中间
  const monster = createMonster(width() / 2, height() / 2 + 100);

  // 初始化配方系统
  initRecipeSystem();

  // 创建合成炉
  const forge = createForge();

  // 初始化食物系统
  const foodManager = initFoodSystem(monster, gameState);

  // 初始化拖拽系统
  const dragSystem = initDragSystem(monster, gameState);

  // 创建UI
  const ui = createUI(gameState);

  // 初始化图鉴系统
  initEncyclopediaSystem();

  // 初始化配方面板系统
  initRecipePanelSystem();

  // 初始化全屏控制
  initFullscreenControls();

  // 初始化控制台控制（供调试使用）
  initConsoleControls();

  // 窗口大小变化时更新背景和怪物位置
  onResize(() => {
    bg.width = width();
    bg.height = height();
    // 更新怪物位置到屏幕中央
    if (updateMonsterPosition) {
      updateMonsterPosition(width() / 2, height() / 2 + 100);
    }
    // 更新全屏按钮位置
    if (ui && ui.updateFullscreenBtnPos) {
      ui.updateFullscreenBtnPos();
    }
  });

  // 定时生成食物
  loop(2, () => {
    if (foodManager.getFoodCount() < 8) {
      createFood();
    }
  });

  // 饱食度随时间减少
  loop(1, () => {
    gameState.hunger = Math.max(0, gameState.hunger - 0.5);
    ui.updateHunger(gameState.hunger);
    
    // 饱食度过低，怪物变伤心，并减少生命值
    if (gameState.hunger < 20) {
      monster.setSad();
      // 饱食度过低时减少生命值
      gameState.health = Math.max(0, gameState.health - 1);
      ui.updateHealth(gameState.health);
      
      // 检查游戏结束
      if (checkGameOver()) {
        go('gameover');
      }
    } else if (gameState.hunger > 80) {
      monster.setHappy();
    } else {
      monster.setIdle();
    }
  });

  // 更新分数显示
  onUpdate(() => {
    ui.updateScore(gameState.score);
    ui.updateHealth(gameState.health);
  });
});

// 启动游戏 - 从标题画面开始
go('title');
