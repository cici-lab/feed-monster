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
  },

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
  },

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
  },

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
 */
export function checkRecipe(foodTypeKeys) {
  if (!Array.isArray(foodTypeKeys) || foodTypeKeys.length === 0) {
    return null;
  }

  const dimensions = calculateDimensions(foodTypeKeys);
  const candidates = getAllRecipes().filter(recipe => isMatchByConditions(recipe.conditions, dimensions));

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
 * 获取配方提示
 */
export function getRecipeHint(recipeId) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return '';
  const conditions = recipe.conditions || {};
  const entries = Object.entries(conditions);
  if (entries.length === 0) {
    return '需要：任意 3 个食材';
  }

  const hints = entries.map(([dim, count]) => `${DIMENSION_LABELS[dim] || dim}≥${count}`);
  return `需要：${hints.join(' + ')}`;
}

/**
 * 获取解锁进度
 */
export function getRecipeProgress() {
  const total = getAllRecipes().length;
  const unlocked = recipeState.unlockedRecipes.size;
  return { total, unlocked };
}
