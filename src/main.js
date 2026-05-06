import kaplay from 'kaplay';
import { createMonster, updateMonsterPosition, loadSavedMonsterType, setMonsterType } from './monster.js';
import { createFood, FOOD_TYPES, initFoodSystem, clearAllActiveFoods } from './food.js';
import { createUI, initFullscreenControls, createTitleScreen, createGameOverScreen } from './ui.js';
import { initDragSystem, resetDisgustCount } from './drag.js';
import { gameState, saveGame, loadGame, resetGameState, checkGameOver } from './state.js';
import { createForge } from './forge.js';
import { initRecipeSystem } from './recipes.js';
import { initEncyclopediaSystem } from './encyclopedia.js';
import { initRecipePanelSystem } from './recipePanel.js';
import { initAchievements, initAchievementPanelSystem, checkAchievements } from './achievements.js';
import { initConsoleControls, registerCraftTrigger, registerFullscreenToggle } from './console.js';
import { initMonsterSelectSystem, showMonsterSelect, hideMonsterSelect } from './monsterSelect.js';
import { initCursorHealth, cleanupCursorHealth, resetCursorHealth, cursorState } from './cursorHealth.js';
import { createBuffBar, updateBuffs, updateBuffBarDisplay, getFoodSpawnIntervalMultiplier, getHungerDrainMultiplier, shouldHealthDrain, clearAllBuffs } from './buffs.js';
// petMode 使用动态 import，避免其错误阻断主游戏模块链加载

// 初始化 Kaplay 游戏引擎
// 桌宠模式（URL 含 ?mode=pet）时背景设为透明（alpha=0）以实现透明窗口
// 注意：不能设为 null！Kaplay 内部逻辑：bgColor 为 null 时会画灰白棋盘格纹理
// 设为 [0,0,0,0] 则 bgColor 存在但透明，不画棋盘格，canvas 透明
const isPetModeInit = new URLSearchParams(window.location.search).get('mode') === 'pet';

kaplay({
  canvas: document.getElementById('game-container'),
  width: 1200,
  height: 800,
  background: isPetModeInit ? [0, 0, 0, 0] : [26, 26, 46],
  debug: isPetModeInit ? false : true,  // 桌宠模式关闭 debug
  global: true, // 启用全局函数
  stretch: true, // 自适应屏幕
  letterbox: false, // 不留黑边
  pixelDensity: window.devicePixelRatio || 1, // 高DPI支持，修复文字模糊
  buttons: {},
  layers: ['bg', 'game', 'ui', 'top'],
});

// 加载怪物精灵
loadSprite('monster-default', '/assets/monster-default.svg');
loadSprite('monster-mike', '/assets/monster-mike.svg');
loadSprite('monster-fang', '/assets/monster-fang.svg');

// 加载眼魔部件精灵
loadSprite('monsters/eyemonster/body', '/assets/monsters/eyemonster/body.svg');
loadSprite('monsters/eyemonster/core-eye', '/assets/monsters/eyemonster/core-eye.svg');
loadSprite('monsters/eyemonster/sub-eye', '/assets/monsters/eyemonster/sub-eye.svg');
loadSprite('monsters/eyemonster/mouth-closed', '/assets/monsters/eyemonster/mouth-closed.svg');
loadSprite('monsters/eyemonster/mouth-open', '/assets/monsters/eyemonster/mouth-open.svg');
loadSprite('monsters/eyemonster/tentacle', '/assets/monsters/eyemonster/tentacle.svg');
loadSprite('monsters/eyemonster/foot', '/assets/monsters/eyemonster/foot.svg');
loadSprite('monsters/eyemonster/logo', '/assets/monsters/eyemonster/logo.svg');

// 加载史莱姆魔部件精灵
loadSprite('monsters/slimemon/body', '/assets/monsters/slimemon/body.svg');
loadSprite('monsters/slimemon/core-star', '/assets/monsters/slimemon/core-star.svg');
loadSprite('monsters/slimemon/big-eye', '/assets/monsters/slimemon/big-eye.svg');
loadSprite('monsters/slimemon/small-eye', '/assets/monsters/slimemon/small-eye.svg');
loadSprite('monsters/slimemon/mouth-closed', '/assets/monsters/slimemon/mouth-closed.svg');
loadSprite('monsters/slimemon/mouth-open', '/assets/monsters/slimemon/mouth-open.svg');
loadSprite('monsters/slimemon/floatie', '/assets/monsters/slimemon/floatie.svg');
loadSprite('monsters/slimemon/bone', '/assets/monsters/slimemon/bone.svg');
loadSprite('monsters/slimemon/logo', '/assets/monsters/slimemon/logo.svg');

// 加载幽灵魔部件精灵
loadSprite('monsters/ghostmon/body', '/assets/monsters/ghostmon/body.svg');
loadSprite('monsters/ghostmon/witch-hat', '/assets/monsters/ghostmon/witch-hat.svg');
loadSprite('monsters/ghostmon/eye', '/assets/monsters/ghostmon/eye.svg');
loadSprite('monsters/ghostmon/mouth-closed', '/assets/monsters/ghostmon/mouth-closed.svg');
loadSprite('monsters/ghostmon/mouth-open', '/assets/monsters/ghostmon/mouth-open.svg');
loadSprite('monsters/ghostmon/tail', '/assets/monsters/ghostmon/tail.svg');
loadSprite('monsters/ghostmon/sparkle', '/assets/monsters/ghostmon/sparkle.svg');
loadSprite('monsters/ghostmon/logo', '/assets/monsters/ghostmon/logo.svg');

// 加载毛球魔部件精灵
loadSprite('monsters/furballmon/body', '/assets/monsters/furballmon/body.svg');
loadSprite('monsters/furballmon/big-eye', '/assets/monsters/furballmon/big-eye.svg');
loadSprite('monsters/furballmon/small-eye', '/assets/monsters/furballmon/small-eye.svg');
loadSprite('monsters/furballmon/mouth-closed', '/assets/monsters/furballmon/mouth-closed.svg');
loadSprite('monsters/furballmon/mouth-open', '/assets/monsters/furballmon/mouth-open.svg');
loadSprite('monsters/furballmon/ear-tuft', '/assets/monsters/furballmon/ear-tuft.svg');
loadSprite('monsters/furballmon/fur-strand', '/assets/monsters/furballmon/fur-strand.svg');
loadSprite('monsters/furballmon/logo', '/assets/monsters/furballmon/logo.svg');

// 标题场景
scene('title', () => {
  // 清理鼠标光环系统
  cleanupCursorHealth();
  
  // 加载存档和怪兽选择
  loadGame();
  initAchievements();
  loadSavedMonsterType();
  initMonsterSelectSystem();
  
  // 创建标题画面
  createTitleScreen(gameState.highScore);
  
  // 点击开始游戏 - 显示怪兽选择
  onMousePress(() => {
    showMonsterSelect((selectedMonsterId) => {
      setMonsterType(selectedMonsterId);
      go('game');
    });
  });
  
  onKeyPress('space', () => {
    showMonsterSelect((selectedMonsterId) => {
      setMonsterType(selectedMonsterId);
      go('game');
    });
  });
});

// 游戏结束场景
scene('gameover', () => {
  // 清理鼠标光环系统
  cleanupCursorHealth();
  
  createGameOverScreen(gameState.score, gameState.highScore);
  
  // 点击重新开始 - 显示怪兽选择
  onMousePress(() => {
    showMonsterSelect((selectedMonsterId) => {
      setMonsterType(selectedMonsterId);
      resetGameState();
      go('game');
    });
  });
  
  onKeyPress('space', () => {
    showMonsterSelect((selectedMonsterId) => {
      setMonsterType(selectedMonsterId);
      resetGameState();
      go('game');
    });
  });
});

// 游戏场景
scene('game', () => {
  // 重置游戏状态
  resetGameState();
  
  // 重置厌恶计数器
  resetDisgustCount();
  
  // 重置鼠标血量
  resetCursorHealth();

  // 重置 buff 系统
  clearAllBuffs();
  
  // 初始化鼠标光环系统
  const cursorHealth = initCursorHealth();
  
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

  // 创建 buff 栏
  createBuffBar();

  // 初始化图鉴系统
  initEncyclopediaSystem();

  // 初始化配方面板系统
  initRecipePanelSystem();

  // 初始化成就系统
  initAchievementPanelSystem();

  // 检查成就进度
  checkAchievements();

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

  // 定时生成食物（buff 影响间隔）
  let foodSpawnTimer = 0;
  const baseFoodSpawnInterval = 2; // 基础间隔2秒

  // 饱食度随时间减少（buff 影响下降速率）
  let hungerDrainTimer = 0;

  // 主循环更新 buff、食物生成、饱食度
  onUpdate(() => {
    // 更新 buff 系统
    updateBuffs(dt());
    updateBuffBarDisplay();

    // 食物生成（受 buff 影响）
    foodSpawnTimer += dt();
    const spawnInterval = baseFoodSpawnInterval * getFoodSpawnIntervalMultiplier();
    if (foodSpawnTimer >= spawnInterval) {
      foodSpawnTimer = 0;
      if (foodManager.getFoodCount() < 8) {
        createFood();
      }
    }

    // 饱食度随时间减少（受 buff 影响）
    hungerDrainTimer += dt();
    if (hungerDrainTimer >= 1) {
      hungerDrainTimer = 0;
      const drainMultiplier = getHungerDrainMultiplier();
      gameState.hunger = Math.max(0, gameState.hunger - 0.5 * drainMultiplier);
      ui.updateHunger(gameState.hunger);
      
      // 饱食度过低，怪物变伤心，并减少生命值
      if (gameState.hunger < 20) {
        monster.setSad();
        // 生命值下降（受 buff 影响是否免疫）
        if (shouldHealthDrain()) {
          gameState.health = Math.max(0, gameState.health - 1);
          ui.updateHealth(gameState.health);
        }
        
        // 检查游戏结束
        if (checkGameOver()) {
          go('gameover');
        }
      } else if (gameState.hunger > 80) {
        monster.setHappy();
      } else {
        monster.setIdle();
      }
    }

    // 更新分数显示
    ui.updateScore(gameState.score);
    ui.updateHighScore(gameState.highScore);
    if (ui.updateCumulativeScore) ui.updateCumulativeScore(gameState.cumulativeScore || 0);
    ui.updateHealth(gameState.health);
  });
});

// ── 桌宠模式：动态 import，确保 petMode 任何错误不影响主游戏 ──
import('./petMode.js')
  .then(({ initPetMode, registerPetScene }) => {
    // 先注册桌宠专用场景（必须在 go('title') 前）
    registerPetScene();
    // 再初始化 IPC 监听等
    initPetMode();
  })
  .catch((err) => {
    console.warn('[petMode] 桌宠模式初始化失败（不影响主游戏）:', err);
  });

// 启动游戏 - 从标题画面开始
go('title');
