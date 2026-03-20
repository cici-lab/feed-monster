/**
 * 游戏状态模块
 * 独立存储游戏状态，避免循环依赖问题
 */

export const gameState = {
  score: 0,
  hunger: 50, // 饱食度 0-100
  monsterSize: 1,
  combo: 0,
  lastFeedTime: 0,
};
