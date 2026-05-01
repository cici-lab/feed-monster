/**
 * 合成配方系统
 * 使用“维度阈值 + 优先级”匹配料理
 */

import { FOOD_TYPES } from './food.js';

// 配方状态
let recipeState = {
  unlockedRecipes: new Set(), // 已解锁的配方ID
  discoveredCombinations: new Set(), // 已发现的组合
};

const DIMENSION_LABELS = {
  nature: '自然度',
  liquid: '液体度',
  weird: '怪异度',
  delicious: '美味度',
  abstract: '抽象度',
};

// 配方定义（料理系统）
// conditions: 满足条件即可命中；多个命中时选 priority 更高的
export const RECIPES = {
  // 兜底料理：保证随手合成也有结果
  mixedStew: {
    id: 'mixedStew',
    name: '杂烩',
    points: 24,
    rarity: 'common',
    priority: 1,
    conditions: {},
    description: '什么都能炖进去，至少能吃',
    category: 'dish',
    effect: '小幅恢复饱食度',
    color: [170, 150, 120],
    buff: { type: 'hungerFreeze', duration: 6 },
  },

  // ========== 新增普通配方 ==========

  mushroomStew: {
    id: 'mushroomStew',
    name: '蘑菇浓汤',
    points: 38,
    rarity: 'common',
    priority: 3,
    conditions: { nature: 2 },
    description: '自然系食材慢炖，香气扑鼻',
    category: 'dish',
    effect: '恢复饱食度并少量加分',
    color: [180, 120, 80],
    buff: { type: 'categoryBonus', duration: 10, params: { category: 'nature', multiplier: 2 } },
  },

  abstractPaste: {
    id: 'abstractPaste',
    name: '抽象糊',
    points: 42,
    rarity: 'common',
    priority: 4,
    conditions: { abstract: 2 },
    description: '概念与概念碰撞，混沌中诞生的美味',
    category: 'dish',
    effect: '恢复饱食度并中等加分',
    color: [180, 100, 200],
    glow: true,
    buff: { type: 'categoryBonus', duration: 10, params: { category: 'abstract', multiplier: 2 } },
  },

  // ========== 学生向专属配方 ==========

  stressBundle: {
    id: 'stressBundle',
    name: '压力套餐',
    points: 60,
    rarity: 'common',
    priority: 7,
    conditions: { weird: 2 },
    description: '把所有烦恼都炖成一锅，喂给它！',
    category: 'dish',
    effect: '怪兽大口吞下烦恼，饱食度大幅恢复',
    color: [255, 80, 80],
    glow: true,
    buff: { type: 'scoreMultiplier', duration: 10 },
    studentSpecial: true,
  },

  allNighter: {
    id: 'allNighter',
    name: '通宵套装',
    points: 72,
    rarity: 'common',
    priority: 11,
    conditions: { weird: 1, liquid: 1 },
    description: 'DDL + 能量饮料，熟悉的组合',
    category: 'dish',
    effect: '加分翻倍 + 食物生成加速',
    color: [50, 50, 80],
    glow: true,
    buff: { type: 'cursedBoost', duration: 15 },
    studentSpecial: true,
  },

  // ========== 原有普通配方 ==========

  clearBroth: {
    id: 'clearBroth',
    name: '清汤',
    points: 32,
    rarity: 'common',
    priority: 5,
    conditions: { liquid: 1 },
    description: '一口热汤，暖胃续命',
    category: 'dish',
    effect: '恢复饱食度',
    color: [130, 170, 230],
    buff: { type: 'healthFreeze', duration: 8 },
  },

  weirdPaste: {
    id: 'weirdPaste',
    name: '怪味糊',
    points: 35,
    rarity: 'common',
    priority: 6,
    conditions: { weird: 1 },
    description: '味道离谱，但怪兽很受用',
    category: 'dish',
    effect: '中等恢复饱食度',
    color: [150, 140, 170],
    buff: { type: 'categoryBonus', duration: 10, params: { category: 'weird', multiplier: 2 } },
  },

  wildSalad: {
    id: 'wildSalad',
    name: '野生沙拉',
    points: 40,
    rarity: 'common',
    priority: 8,
    conditions: { nature: 2 },
    description: '新鲜自然风味',
    category: 'dish',
    effect: '恢复饱食度并少量加分',
    color: [100, 190, 120],
    buff: { type: 'foodSpawnRate', duration: 12 },
  },

  elementSoup: {
    id: 'elementSoup',
    name: '元素浓汤',
    points: 46,
    rarity: 'common',
    priority: 9,
    conditions: { nature: 1, liquid: 1 },
    description: '自然与液体的稳定融合',
    category: 'dish',
    effect: '较高恢复饱食度',
    color: [120, 200, 190],
    buff: { type: 'hungerDrainHalf', duration: 10 },
  },

  // ========== 稀有配方（需最高分 800 解锁）==========

  heartyPlatter: {
    id: 'heartyPlatter',
    name: '大餐拼盘',
    points: 55,
    rarity: 'rare',
    priority: 10,
    conditions: { delicious: 2 },
    description: '高热量高满足感',
    category: 'dish',
    effect: '高额饱食恢复',
    color: [240, 180, 120],
    glow: true,
    buff: { type: 'scoreMultiplier', duration: 12 },
  },

  voidPudding: {
    id: 'voidPudding',
    name: '虚空布丁',
    points: 58,
    rarity: 'rare',
    priority: 12,
    conditions: { abstract: 2 },
    description: '口感像在吞食夜空',
    category: 'dish',
    effect: '恢复饱食度并额外加分',
    color: [170, 120, 255],
    glow: true,
    buff: { type: 'ignoreHate', duration: 12 },
  },

  cursedRoast: {
    id: 'cursedRoast',
    name: '诅咒烤盘',
    points: 66,
    rarity: 'rare',
    priority: 18,
    conditions: { delicious: 1, weird: 1, abstract: 1 },
    description: '香味诱人，后劲诡异',
    category: 'dish',
    effect: '高分奖励',
    color: [220, 120, 170],
    glow: true,
    buff: { type: 'cursedBoost', duration: 12 },
  },

  // ========== 传说配方（需最高分 2000 解锁）==========

  breakfastEgg: {
    id: 'breakfastEgg',
    name: '早餐蛋',
    points: 76,
    rarity: 'legendary',
    priority: 20,
    conditions: { delicious: 1, weird: 1, liquid: 1 },
    description: '在多个候选中以高优先级胜出',
    category: 'dish',
    effect: '大幅恢复饱食度并加分',
    color: [255, 225, 130],
    glow: true,
    buff: { type: 'megaBoost', duration: 15 },
  },
};

// 稀有等级配置
export const RARITY_CONFIG = {
  legendary: {
    name: '传说',
    color: [255, 215, 0],
    icon: '⭐',
    bgColor: [50, 40, 0],
  },
  rare: {
    name: '稀有',
    color: [150, 100, 255],
    icon: '💎',
    bgColor: [30, 20, 50],
  },
  common: {
    name: '普通',
    color: [150, 150, 150],
    icon: '📦',
    bgColor: [30, 30, 30],
  },
};

// 配方解锁门槛配置（按稀有度）
export const RARITY_THRESHOLDS = {
  legendary: 2000, // 传说配方需要最高分达到 2000
  rare: 800,       // 稀有配方需要最高分达到 800
  common: 0,       // 普通配方无需解锁
};

/**
 * 初始化配方系统
 */
export function initRecipeSystem() {
  // 从 localStorage 加载已解锁配方
  const saved = localStorage.getItem('unlockedRecipes');
  if (saved) {
    const unlocked = JSON.parse(saved);
    recipeState.unlockedRecipes = new Set(unlocked);
  }
}

/**
 * 检查配方是否达到解锁门槛（基于最高分）
 * @param {string} recipeId - 配方ID
 * @param {number} highScore - 当前最高分
 * @returns {boolean} 是否满足解锁条件
 */
export function checkRecipeUnlockThreshold(recipeId) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return false;

  // 普通配方始终可用
  if (recipe.rarity === 'common') return true;

  // 从 localStorage 读取当前最高分（兼容 state.js 的 saveGame）
  const saveData = localStorage.getItem('feed-monster-save');
  let highScore = 0;
  if (saveData) {
    try {
      const data = JSON.parse(saveData);
      highScore = data.highScore || 0;
    } catch (e) {
      highScore = 0;
    }
  }

  const threshold = RARITY_THRESHOLDS[recipe.rarity] || 0;
  return highScore >= threshold;
}

/**
 * 获取配方的解锁进度提示
 * @param {string} recipeId - 配方ID
 * @returns {string} 解锁条件描述
 */
export function getRecipeUnlockHint(recipeId) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return '';

  // 已解锁
  if (isRecipeUnlocked(recipeId)) {
    return getRecipeHint(recipeId);
  }

  // 未解锁且是高级配方
  if (recipe.rarity === 'common') {
    return '需要：任意 3 个食材';
  }

  // 从 localStorage 读取最高分
  const saveData = localStorage.getItem('feed-monster-save');
  let highScore = 0;
  if (saveData) {
    try {
      const data = JSON.parse(saveData);
      highScore = data.highScore || 0;
    } catch (e) {
      highScore = 0;
    }
  }

  const threshold = RARITY_THRESHOLDS[recipe.rarity] || 0;

  if (highScore >= threshold) {
    // 达到门槛但尚未发现该配方（待合成解锁）
    return `🎉 已达门槛！合成即可解锁`;
  }

  return `🔒 最高分达到 ${threshold} 解锁 | 当前: ${highScore}`;
}

/**
 * 获取所有配方的解锁进度
 * @returns {Object} 各稀有度的解锁状态
 */
export function getUnlockProgress() {
  const saveData = localStorage.getItem('feed-monster-save');
  let highScore = 0;
  if (saveData) {
    try {
      const data = JSON.parse(saveData);
      highScore = data.highScore || 0;
    } catch (e) {
      highScore = 0;
    }
  }

  return {
    highScore,
    rareThreshold: RARITY_THRESHOLDS.rare,
    legendaryThreshold: RARITY_THRESHOLDS.legendary,
    rareProgress: Math.min(100, Math.floor((highScore / RARITY_THRESHOLDS.rare) * 100)),
    legendaryProgress: Math.min(100, Math.floor((highScore / RARITY_THRESHOLDS.legendary) * 100)),
  };
}

/**
 * 根据食材计算维度
 */
function calculateDimensions(foodTypeKeys) {
  const totals = {
    nature: 0,
    liquid: 0,
    weird: 0,
    delicious: 0,
    abstract: 0,
  };

  for (const key of foodTypeKeys) {
    const food = FOOD_TYPES[key];
    if (!food || !food.category) continue;
    if (totals[food.category] !== undefined) {
      totals[food.category] += 1;
    }
  }

  return totals;
}

function isMatchByConditions(conditions, dimensions) {
  return Object.entries(conditions || {}).every(([dim, min]) => {
    return (dimensions[dim] || 0) >= min;
  });
}

/**
 * 检查配方是否匹配（维度阈值 + 优先级）
 * 只返回已满足解锁门槛的配方
 */
export function checkRecipe(foodTypeKeys) {
  if (!Array.isArray(foodTypeKeys) || foodTypeKeys.length === 0) {
    return null;
  }

  const dimensions = calculateDimensions(foodTypeKeys);
  const candidates = getAllRecipes().filter(recipe => {
    // 必须满足维度条件
    if (!isMatchByConditions(recipe.conditions, dimensions)) return false;
    // 必须达到解锁门槛
    if (!checkRecipeUnlockThreshold(recipe.id)) return false;
    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    const p = (b.priority || 0) - (a.priority || 0);
    if (p !== 0) return p;
    return (b.points || 0) - (a.points || 0);
  });

  return candidates[0];
}

/**
 * 解锁配方
 */
export function unlockRecipe(recipeId) {
  if (!recipeState.unlockedRecipes.has(recipeId)) {
    recipeState.unlockedRecipes.add(recipeId);
    localStorage.setItem('unlockedRecipes', JSON.stringify([...recipeState.unlockedRecipes]));
    return true;
  }
  return false;
}

/**
 * 检查配方是否已解锁
 */
export function isRecipeUnlocked(recipeId) {
  return recipeState.unlockedRecipes.has(recipeId);
}

/**
 * 获取所有配方
 */
export function getAllRecipes() {
  return Object.values(RECIPES);
}

/**
 * 获取配方提示（已解锁配方显示合成条件，未解锁配方显示解锁条件）
 */
export function getRecipeHint(recipeId) {
  // 未解锁时返回解锁条件
  if (!isRecipeUnlocked(recipeId)) {
    return getRecipeUnlockHint(recipeId);
  }

  const recipe = RECIPES[recipeId];
  if (!recipe) return '';
  const conditions = recipe.conditions || {};
  const entries = Object.entries(conditions);
  
  let hint = '';
  if (entries.length === 0) {
    hint = '需要：任意 3 个食材';
  } else {
    const condHints = entries.map(([dim, count]) => `${DIMENSION_LABELS[dim] || dim}≥${count}`);
    hint = `需要：${condHints.join(' + ')}`;
  }

  // 添加 buff 提示
  if (recipe.buff) {
    const buffNames = {
      hungerFreeze: '饱食度暂停下降',
      hungerDrainHalf: '饱食度下降减半',
      healthFreeze: '生命值暂停下降',
      scoreMultiplier: '所有得分翻倍',
      foodSpawnRate: '食物生成翻倍',
      ignoreHate: '厌恶食物视为普通',
      categoryBonus: '特定类别加成',
      cursedBoost: '得分×2.5/饱食加速',
      megaBoost: '全面增益',
    };
    const buffDesc = buffNames[recipe.buff.type] || '';
    if (buffDesc) {
      hint += ` | ${recipe.buff.duration}s: ${buffDesc}`;
    }
  }

  return hint;
}

/**
 * 获取解锁进度
 */
export function getRecipeProgress() {
  const total = getAllRecipes().length;
  const unlocked = recipeState.unlockedRecipes.size;
  return { total, unlocked };
}
