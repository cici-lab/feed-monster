/**
 * 控制台控制模块
 * 提供通过浏览器控制台直接调用游戏功能的能力
 * 便于测试和调试
 */

import { gameState } from './state.js';
import { createFood, FOOD_TYPES, getActiveFoods } from './food.js';
import { getMonster } from './monster.js';
import { getCollectedFoods, canCraft, getForgeConfig } from './forge.js';
import { RECIPES, checkRecipe, unlockRecipe, getAllRecipes, isRecipeUnlocked, getRecipeProgress } from './recipes.js';

// 存储外部模块的函数引用
let openEncFunc = null;
let closeEncFunc = null;
let openRecFunc = null;
let closeRecFunc = null;
let triggerCraftFunc = null;
let toggleFullscreenFunc = null;

/**
 * 注册图鉴模块的函数
 */
export function registerEncyclopediaFuncs(open, close) {
  openEncFunc = open;
  closeEncFunc = close;
}

/**
 * 注册配方面板的函数
 */
export function registerRecipePanelFuncs(open, close) {
  openRecFunc = open;
  closeRecFunc = close;
}

/**
 * 注册合成触发函数
 */
export function registerCraftTrigger(func) {
  triggerCraftFunc = func;
}

/**
 * 注册全屏切换函数
 */
export function registerFullscreenToggle(func) {
  toggleFullscreenFunc = func;
}

/**
 * 初始化控制台调试工具
 */
export function initConsoleControls() {
  // 创建全局调试对象
  window.GameDebug = {
    // ========== 游戏状态 ==========
    
    /**
     * 获取当前游戏状态
     * @returns {Object} 包含分数、饱食度、连击等信息
     */
    getState() {
      return {
        score: gameState.score,
        hunger: gameState.hunger,
        monsterSize: gameState.monsterSize,
        combo: gameState.combo,
        lastFeedTime: gameState.lastFeedTime,
      };
    },
    
    /**
     * 设置分数
     * @param {number} score - 新的分数值
     */
    setScore(score) {
      gameState.score = score;
      console.log(`[GameDebug] 分数已设置为: ${score}`);
    },
    
    /**
     * 增加分数
     * @param {number} amount - 增加的分数量
     */
    addScore(amount) {
      gameState.score += amount;
      console.log(`[GameDebug] 分数增加 ${amount}，当前分数: ${gameState.score}`);
    },
    
    /**
     * 设置饱食度
     * @param {number} hunger - 饱食度值 (0-100)
     */
    setHunger(hunger) {
      gameState.hunger = Math.max(0, Math.min(100, hunger));
      console.log(`[GameDebug] 饱食度已设置为: ${gameState.hunger}`);
    },
    
    /**
     * 增加饱食度
     * @param {number} amount - 增加的饱食度
     */
    addHunger(amount) {
      gameState.hunger = Math.min(100, gameState.hunger + amount);
      console.log(`[GameDebug] 饱食度增加 ${amount}，当前饱食度: ${gameState.hunger}`);
    },
    
    /**
     * 重置游戏状态
     */
    resetState() {
      gameState.score = 0;
      gameState.hunger = 50;
      gameState.monsterSize = 1;
      gameState.combo = 0;
      gameState.lastFeedTime = 0;
      console.log('[GameDebug] 游戏状态已重置');
    },
    
    // ========== 食物操作 ==========
    
    /**
     * 生成指定类型的食物
     * @param {string} typeKey - 食物类型键，如 'burger', 'heart', 'star' 等
     * @returns {Object} 创建的食物对象
     */
    spawnFood(typeKey) {
      if (!FOOD_TYPES[typeKey]) {
        console.error(`[GameDebug] 未知的食物类型: ${typeKey}`);
        console.log('可用食物类型:', Object.keys(FOOD_TYPES).join(', '));
        return null;
      }
      const food = createFood();
      console.log(`[GameDebug] 已生成食物: ${FOOD_TYPES[typeKey]?.name || typeKey}`);
      return food;
    },
    
    /**
     * 生成随机食物
     * @returns {Object} 创建的食物对象
     */
    spawnRandomFood() {
      const food = createFood();
      console.log('[GameDebug] 已生成随机食物');
      return food;
    },
    
    /**
     * 生成多个随机食物
     * @param {number} count - 数量
     */
    spawnMultipleFoods(count) {
      for (let i = 0; i < count; i++) {
        setTimeout(() => createFood(), i * 100);
      }
      console.log(`[GameDebug] 正在生成 ${count} 个食物...`);
    },
    
    /**
     * 获取当前所有活跃食物
     * @returns {Array} 食物列表
     */
    getActiveFoods() {
      return getActiveFoods();
    },
    
    /**
     * 清除所有食物
     */
    clearAllFoods() {
      const foods = getActiveFoods();
      foods.forEach(f => f.destroy());
      foods.length = 0;
      console.log('[GameDebug] 所有食物已清除');
    },
    
    /**
     * 列出所有食物类型
     * @returns {Array} 食物类型键列表
     */
    listFoodTypes() {
      const types = Object.keys(FOOD_TYPES);
      console.log('=== 所有食物类型 ===');
      types.forEach(key => {
        const f = FOOD_TYPES[key];
        console.log(`  ${key}: ${f.name} (${f.points}分, ${f.category})`);
      });
      return types;
    },
    
    // ========== 怪物操作 ==========
    
    /**
     * 获取怪物信息
     * @returns {Object} 怪物对象
     */
    getMonster() {
      return getMonster();
    },
    
    /**
     * 设置怪物状态
     * @param {string} state - 状态: 'idle', 'happy', 'sad', 'eating'
     */
    setMonsterState(state) {
      const monster = getMonster();
      if (!monster) {
        console.error('[GameDebug] 怪物不存在');
        return;
      }
      
      const methods = {
        idle: monster.setIdle,
        happy: monster.setHappy,
        sad: monster.setSad,
        eating: monster.setEating,
      };
      
      if (methods[state]) {
        methods[state].call(monster);
        console.log(`[GameDebug] 怪物状态已设置为: ${state}`);
      } else {
        console.error(`[GameDebug] 未知状态: ${state}`);
        console.log('可用状态: idle, happy, sad, eating');
      }
    },
    
    /**
     * 让怪物成长
     * @param {number} amount - 成长量
     */
    growMonster(amount) {
      const monster = getMonster();
      if (monster) {
        monster.grow(amount);
        console.log(`[GameDebug] 怪物成长了 ${amount}`);
      }
    },
    
    // ========== 合成炉操作 ==========
    
    /**
     * 获取合成炉中的食物
     * @returns {Array} 已收集的食物
     */
    getForgeFoods() {
      return getCollectedFoods();
    },
    
    /**
     * 检查是否可以合成
     * @returns {boolean}
     */
    canCraft() {
      return canCraft();
    },
    
    /**
     * 触发合成
     */
    craft() {
      if (triggerCraftFunc) {
        triggerCraftFunc();
        console.log('[GameDebug] 已触发合成');
      } else {
        console.error('[GameDebug] 合成功能未就绪');
      }
    },
    
    /**
     * 将指定食物添加到合成炉（通过食物索引）
     * @param {number} index - 活跃食物列表中的索引
     */
    addFoodToForgeByIndex(index) {
      const foods = getActiveFoods();
      if (foods[index]) {
        const { addFoodToForge } = require('./forge.js');
        addFoodToForge(foods[index]);
        console.log(`[GameDebug] 已将索引 ${index} 的食物添加到合成炉`);
      } else {
        console.error(`[GameDebug] 索引 ${index} 无效`);
      }
    },
    
    // ========== 配方操作 ==========
    
    /**
     * 列出所有配方
     * @returns {Array} 配方列表
     */
    listRecipes() {
      const recipes = getAllRecipes();
      console.log('=== 所有配方 ===');
      recipes.forEach(r => {
        const unlocked = isRecipeUnlocked(r.id);
        const status = unlocked ? '✅已解锁' : '🔒未解锁';
        console.log(`  ${r.name} (${r.rarity}): ${r.ingredients.join(' + ')} = ${r.points}分 ${status}`);
      });
      return recipes;
    },
    
    /**
     * 解锁指定配方
     * @param {string} recipeId - 配方ID
     */
    unlockRecipe(recipeId) {
      if (unlockRecipe(recipeId)) {
        console.log(`[GameDebug] 配方 ${recipeId} 已解锁`);
      } else {
        console.log(`[GameDebug] 配方 ${recipeId} 已经解锁或不存在`);
      }
    },
    
    /**
     * 解锁所有配方
     */
    unlockAllRecipes() {
      getAllRecipes().forEach(r => unlockRecipe(r.id));
      console.log('[GameDebug] 所有配方已解锁');
    },
    
    /**
     * 获取配方解锁进度
     * @returns {Object} { total, unlocked }
     */
    getRecipeProgress() {
      return getRecipeProgress();
    },
    
    /**
     * 检查配方是否匹配
     * @param {Array} foodKeys - 食物类型键数组
     * @returns {Object|null} 匹配的配方或null
     */
    checkRecipe(foodKeys) {
      return checkRecipe(foodKeys);
    },
    
    // ========== UI 操作 ==========
    
    /**
     * 打开图鉴
     */
    openEncyclopedia() {
      if (openEncFunc) {
        openEncFunc();
        console.log('[GameDebug] 图鉴已打开');
      } else {
        console.error('[GameDebug] 图鉴功能未就绪');
      }
    },
    
    /**
     * 关闭图鉴
     */
    closeEncyclopedia() {
      if (closeEncFunc) {
        closeEncFunc();
        console.log('[GameDebug] 图鉴已关闭');
      }
    },
    
    /**
     * 打开配方面板
     */
    openRecipePanel() {
      if (openRecFunc) {
        openRecFunc();
        console.log('[GameDebug] 配方面板已打开');
      } else {
        console.error('[GameDebug] 配方功能未就绪');
      }
    },
    
    /**
     * 关闭配方面板
     */
    closeRecipePanel() {
      if (closeRecFunc) {
        closeRecFunc();
        console.log('[GameDebug] 配方面板已关闭');
      }
    },
    
    /**
     * 切换全屏
     */
    toggleFullscreen() {
      if (toggleFullscreenFunc) {
        toggleFullscreenFunc();
        console.log('[GameDebug] 全屏已切换');
      } else {
        console.error('[GameDebug] 全屏功能未就绪');
      }
    },
    
    // ========== 快捷命令 ==========
    
    /**
     * 显示帮助信息
     */
    help() {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║            GameDebug - 小怪兽投喂调试工具                  ║
╠══════════════════════════════════════════════════════════╣
║ 【游戏状态】                                               ║
║   getState()        - 获取当前游戏状态                      ║
║   setScore(n)       - 设置分数                              ║
║   addScore(n)       - 增加分数                              ║
║   setHunger(n)      - 设置饱食度 (0-100)                    ║
║   addHunger(n)      - 增加饱食度                            ║
║   resetState()      - 重置游戏状态                          ║
╠══════════════════════════════════════════════════════════╣
║ 【食物操作】                                               ║
║   spawnFood(type)   - 生成指定类型食物                      ║
║   spawnRandomFood() - 生成随机食物                          ║
║   spawnMultipleFoods(n) - 生成多个食物                      ║
║   getActiveFoods()  - 获取所有活跃食物                      ║
║   clearAllFoods()   - 清除所有食物                          ║
║   listFoodTypes()   - 列出所有食物类型                      ║
╠══════════════════════════════════════════════════════════╣
║ 【怪物操作】                                               ║
║   getMonster()      - 获取怪物对象                          ║
║   setMonsterState(s)- 设置状态(idle/happy/sad/eating)      ║
║   growMonster(n)    - 让怪物成长                            ║
╠══════════════════════════════════════════════════════════╣
║ 【合成炉】                                                 ║
║   getForgeFoods()   - 获取合成炉中的食物                    ║
║   canCraft()        - 检查是否可以合成                      ║
║   craft()           - 触发合成                              ║
╠══════════════════════════════════════════════════════════╣
║ 【配方】                                                   ║
║   listRecipes()     - 列出所有配方                          ║
║   unlockRecipe(id)  - 解锁指定配方                          ║
║   unlockAllRecipes()- 解锁所有配方                          ║
║   getRecipeProgress()- 获取解锁进度                         ║
╠══════════════════════════════════════════════════════════╣
║ 【UI面板】                                                 ║
║   openEncyclopedia() - 打开图鉴                             ║
║   closeEncyclopedia()- 关闭图鉴                             ║
║   openRecipePanel() - 打开配方面板                          ║
║   closeRecipePanel()- 关闭配方面板                          ║
║   toggleFullscreen()- 切换全屏                              ║
╠══════════════════════════════════════════════════════════╣
║ 【快速测试】                                               ║
║   test()            - 运行快速测试                          ║
║   demo()            - 演示功能                              ║
╚══════════════════════════════════════════════════════════╝
      `);
    },
    
    /**
     * 快速测试
     */
    test() {
      console.log('=== 开始快速测试 ===');
      
      // 测试游戏状态
      console.log('1. 测试游戏状态...');
      this.addScore(100);
      this.addHunger(30);
      console.log('当前状态:', this.getState());
      
      // 测试食物生成
      console.log('2. 测试食物生成...');
      this.spawnMultipleFoods(3);
      
      // 测试怪物状态
      console.log('3. 测试怪物状态...');
      this.setMonsterState('happy');
      setTimeout(() => this.setMonsterState('idle'), 2000);
      
      console.log('=== 测试完成 ===');
    },
    
    /**
     * 演示功能
     */
    demo() {
      console.log('=== 功能演示 ===');
      
      // 解锁所有配方
      this.unlockAllRecipes();
      
      // 打开配方面板
      this.openRecipePanel();
      
      // 生成食物
      this.spawnMultipleFoods(5);
      
      console.log('=== 演示完成 ===');
    },
  };
  
  console.log('[GameDebug] 控制台调试工具已加载！输入 GameDebug.help() 查看帮助。');
}
