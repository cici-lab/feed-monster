/**
 * 游戏状态模块
 * 独立存储游戏状态，避免循环依赖问题
 */

// 存档键名
const SAVE_KEY = 'feed-monster-save';

// 游戏状态
export const gameState = {
  score: 0,
  cumulativeScore: 0, // 累计分数（跨局/跨会话累加，用于区分最高分）
  hunger: 50, // 饱食度 0-100
  health: 100, // 生命值 0-100
  monsterSize: 1,
  combo: 0,
  lastFeedTime: 0,
  isGameOver: false,
  highScore: 0, // 最高分
  totalFeeds: 0, // 总投喂次数
  selectedMonster: 'default', // 选中的怪兽类型
  isPetMode: false, // 是否处于桌宠模式（用于禁用某些游戏逻辑如互动AI）

  // 开心指数系统（替代压力系统）
  happiness: 50,          // 开心值 0-100（初始50为中性）
  dailyJoyCount: 0,        // 今日开心次数（喂食使怪兽开心）
  totalJoyCount: 0,        // 总开心次数
  lastResetDate: '',       // 上次重置日期
};

// 怪兽情绪状态（供光环系统读取）
export const monsterMood = {
  current: 'normal',      // 'happy' | 'normal' | 'sad'
  intensity: 0.5,         // 情绪强度 0-1
  lastChange: 0,          // 上次变化时间戳
};

/**
 * 更新怪兽情绪状态
 * @param {number} hunger - 当前饱食度
 */
export function updateMonsterMood(hunger) {
  const previous = monsterMood.current;
  
  if (hunger > 70) {
    monsterMood.current = 'happy';
    monsterMood.intensity = (hunger - 70) / 30; // 70→0.0, 100→1.0
  } else if (hunger < 20) {
    monsterMood.current = 'sad';
    monsterMood.intensity = (20 - hunger) / 20; // 20→0.0, 0→1.0
  } else {
    monsterMood.current = 'normal';
    monsterMood.intensity = 0.5;
  }
  
  if (previous !== monsterMood.current) {
    monsterMood.lastChange = Date.now();
  }
}

/**
 * 触发喂食反馈效果
 * @param {string} type - 'loved' | 'liked' | 'neutral' | 'hated'
 */
export function triggerFeedFeedback(type) {
  feedFeedback.type = type;
  feedFeedback.triggered = true;
  feedFeedback.timestamp = Date.now();
}

// 喂食反馈状态
export const feedFeedback = {
  type: 'neutral',        // 'loved' | 'liked' | 'neutral' | 'hated'
  triggered: false,
  timestamp: 0,
};

/**
 * 保存游戏进度
 */
export function saveGame() {
  const saveData = {
    score: gameState.score,
    cumulativeScore: gameState.cumulativeScore || 0,
    hunger: gameState.hunger,
    health: gameState.health,
    monsterSize: gameState.monsterSize,
    highScore: gameState.highScore,
    totalFeeds: gameState.totalFeeds,
    selectedMonster: gameState.selectedMonster,
    timestamp: Date.now(),
    // 开心指数系统
    happiness: gameState.happiness,
    dailyJoyCount: gameState.dailyJoyCount,
    totalJoyCount: gameState.totalJoyCount,
    lastResetDate: gameState.lastResetDate,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

/**
 * 加载游戏进度
 */
export function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      gameState.highScore = data.highScore || 0;
      gameState.cumulativeScore = data.cumulativeScore || 0;
      gameState.totalFeeds = data.totalFeeds || 0;
      gameState.selectedMonster = data.selectedMonster || 'default';
      // 开心指数系统
      gameState.happiness = data.happiness ?? 50;
      gameState.dailyJoyCount = data.dailyJoyCount || 0;
      gameState.totalJoyCount = data.totalJoyCount || 0;
      gameState.lastResetDate = data.lastResetDate || '';
      console.log('[Save] 游戏存档已加载');
      return true;
    } catch (e) {
      console.error('[Save] 加载存档失败', e);
      return false;
    }
  }
  return false;
}

/**
 * 重置游戏状态（新游戏）
 */
export function resetGameState() {
  gameState.score = 0;
  gameState.hunger = 50;
  gameState.health = 100;
  gameState.monsterSize = 1;
  gameState.combo = 0;
  gameState.lastFeedTime = 0;
  gameState.isGameOver = false;
}

/**
 * 实时更新最高分（每次得分后调用）
 * 如果当前分数超过历史最高，立即更新 highScore
 */
export function tryUpdateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    return true; // 返回 true 表示刷新了记录
  }
  return false;
}

/**
 * 增加分数（包含累计分）
 * - 更新当前分数
 * - 更新累计分数（跨局/跨会话）
 * - 检查并更新最高分
 * - 持久化并触发 score:changed 事件，供 UI / 配方面板等订阅
 */
export function addScore(amount) {
  if (!amount || typeof amount !== 'number') return false;
  gameState.score += amount;
  gameState.cumulativeScore = (gameState.cumulativeScore || 0) + amount;

  const updatedHigh = tryUpdateHighScore();

  // 持久化存档（保存最新的 highScore / cumulativeScore）
  saveGame();

  // 广播分数变化事件，其他模块可监听实时刷新（例如配方面板）
  try {
    window.dispatchEvent(new CustomEvent('score:changed', { detail: { score: gameState.score, highScore: gameState.highScore, cumulativeScore: gameState.cumulativeScore } }));
  } catch (e) {
    // 在非浏览器环境时可能失败，忽略
  }

  return updatedHigh;
}

/**
 * 检查游戏是否结束
 */
export function checkGameOver() {
  if (gameState.health <= 0) {
    gameState.isGameOver = true;
    // 更新最高分
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
    }
    saveGame();
    return true;
  }
  return false;
}

/**
 * 设置选中的怪兽
 */
export function setSelectedMonster(monsterId) {
  gameState.selectedMonster = monsterId;
}

/**
 * 获取选中的怪兽
 */
export function getSelectedMonster() {
  return gameState.selectedMonster;
}

// ═══════════════════════════════════════════════════════════
// 开心指数系统（替代压力系统）
// 设计理念：正面指标，不自动增长
// ═══════════════════════════════════════════════════════════

/**
 * 检查并重置每日计数（新的一天）
 */
function checkDailyReset() {
  const today = new Date().toDateString();
  if (gameState.lastResetDate !== today) {
    gameState.dailyJoyCount = 0;
    gameState.lastResetDate = today;
    saveGame();
  }
}

/**
 * 获取开心等级
 * @returns 'high' | 'medium' | 'low'
 * high = 开心值 > 70（快乐满溢！）
 * medium = 开心值 30-70（心情一般）
 * low = 开心值 < 30（需要喂食了！）
 */
export function getJoyLevel() {
  if (gameState.happiness > 70) return 'high';
  if (gameState.happiness < 30) return 'low';
  return 'medium';
}

/**
 * 增加开心值（每次成功投喂时调用）
 * 喂食让怪兽开心！
 * @param {number} amount - 增加的开心值（默认15-25随机）
 * @returns {object} - { added, newHappiness, level }
 */
export function addJoy(amount = null) {
  checkDailyReset();

  const addAmount = amount ?? (15 + Math.floor(Math.random() * 11)); // 15-25
  const oldHappiness = gameState.happiness;
  gameState.happiness = Math.min(100, gameState.happiness + addAmount);

  gameState.dailyJoyCount++;
  gameState.totalJoyCount++;

  saveGame();

  // 广播开心值变化事件
  try {
    window.dispatchEvent(new CustomEvent('joy:changed', {
      detail: {
        happiness: gameState.happiness,
        level: getJoyLevel(),
        dailyCount: gameState.dailyJoyCount,
        totalCount: gameState.totalJoyCount,
        added: gameState.happiness - oldHappiness
      }
    }));
  } catch (e) {}

  return {
    added: gameState.happiness - oldHappiness,
    newHappiness: gameState.happiness,
    level: getJoyLevel()
  };
}

/**
 * 开心值随时间缓慢下降（只在下限保护）
 * 玩家不喂食时开心值不会直接下降，而是怪兽看起来越来越不开心
 * 这里仅做下限保护：开心值不低于 10
 */
export function drainJoy(amount = 0.2) {
  checkDailyReset();
  // 开心值不主动降，但设置一个下限保护（确保怪兽不会永久处于最低状态）
  gameState.happiness = Math.max(10, gameState.happiness - amount);
  saveGame();
}

/**
 * 根据饱食度调整开心值
 * 饱食度高 → 轻微增加开心值
 * 饱食度低 → 轻微减少开心值
 * @param {number} hunger - 当前饱食度 0-100
 */
export function adjustJoyByHunger(hunger) {
  if (hunger > 80) {
    // 饱食度高：心情愉悦，开心值+0.1
    gameState.happiness = Math.min(100, gameState.happiness + 0.1);
  } else if (hunger < 30) {
    // 饱食度低：需要被喂，开心值-0.1
    gameState.happiness = Math.max(10, gameState.happiness - 0.1);
  }
  // 饱食度中等时开心值不变
  saveGame();
}

/**
 * 获取开心状态信息
 */
export function getJoyInfo() {
  checkDailyReset();
  return {
    happiness: gameState.happiness,
    level: getJoyLevel(),
    dailyCount: gameState.dailyJoyCount,
    totalCount: gameState.totalJoyCount
  };
}

/**
 * 检查解锁条件（每日开心次数）
 * @param {number} threshold - 解锁阈值
 */
export function checkUnlock(threshold) {
  checkDailyReset();
  return gameState.dailyJoyCount >= threshold;
}
