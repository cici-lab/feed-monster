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
