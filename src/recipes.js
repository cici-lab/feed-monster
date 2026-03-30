/**
 * 合成配方系统
 * 定义所有可用的合成配方
 */

import { FOOD_TYPES } from './food.js';

// 配方状态
let recipeState = {
  unlockedRecipes: new Set(), // 已解锁的配方ID
  discoveredCombinations: new Set(), // 已发现的组合
};

// 配方定义
export const RECIPES = {
  // 传说级配方
  magicWand: {
    id: 'magicWand',
    name: '魔法法杖',
    nameEn: 'Magic Wand',
    ingredients: ['branch', 'leaf', 'crystal'],
    points: 120,
    rarity: 'legendary',
    description: '古老而强大的魔法武器',
    category: 'weapon',
    effect: '魔法光环',
    color: [150, 200, 255],
    glow: true,
  },

  cosmicHeart: {
    id: 'cosmicHeart',
    name: '宇宙之心',
    nameEn: 'Cosmic Heart',
    ingredients: ['heart', 'moon', 'sun'],
    points: 150,
    rarity: 'legendary',
    description: '融合日月星辰的神秘之心',
    category: 'cosmic',
    effect: '恢复全部饱食度',
    color: [255, 200, 220],
    glow: true,
  },

  starGem: {
    id: 'starGem',
    name: '星光宝石',
    nameEn: 'Star Gem',
    ingredients: ['star', 'rainbowWater', 'goldWater'],
    points: 130,
    rarity: 'legendary',
    description: '凝结了星光与彩虹的宝石',
    category: 'gem',
    effect: '双倍分数加成',
    color: [255, 255, 200],
    glow: true,
  },

  // 稀有级配方
  resurrectionRing: {
    id: 'resurrectionRing',
    name: '复活戒指',
    nameEn: 'Ring of Resurrection',
    ingredients: ['rock', 'bone', 'eyeball'],
    points: 90,
    rarity: 'rare',
    description: '蕴含神秘力量的戒指',
    category: 'accessory',
    effect: '保护光环',
    color: [200, 180, 220],
    glow: true,
  },

  universalPotion: {
    id: 'universalPotion',
    name: '万能药水',
    nameEn: 'Universal Potion',
    ingredients: ['dirtyWater', 'poison', 'goldWater'],
    points: 85,
    rarity: 'rare',
    description: '能治愈一切的神奇药水',
    category: 'potion',
    effect: '大幅恢复饱食度',
    color: [180, 100, 255],
    glow: true,
  },

  aiCore: {
    id: 'aiCore',
    name: 'AI核心',
    nameEn: 'AI Core',
    ingredients: ['battery', 'phone', 'code'],
    points: 95,
    rarity: 'rare',
    description: '高科技的人工智能核心',
    category: 'tech',
    effect: '科技感表情',
    color: [0, 255, 200],
    glow: true,
  },

  grandFeast: {
    id: 'grandFeast',
    name: '盛宴大餐',
    nameEn: 'Grand Feast',
    ingredients: ['burger', 'barbecue', 'pizza'],
    points: 110,
    rarity: 'rare',
    description: '足以喂饱一个军队的美味',
    category: 'food',
    effect: '大幅增加饱食度和连击',
    color: [255, 200, 150],
    glow: true,
  },

  // 普通级配方
  explosionBomb: {
    id: 'explosionBomb',
    name: '爆炸炸弹',
    nameEn: 'Explosion Bomb',
    ingredients: ['mud', 'gunpowder', 'lava'],
    points: 75,
    rarity: 'common',
    description: '危险的爆炸物',
    category: 'weapon',
    effect: '爆炸特效',
    color: [100, 80, 60],
  },

  sweetDream: {
    id: 'sweetDream',
    name: '甜蜜梦境',
    nameEn: 'Sweet Dream',
    ingredients: ['cake', 'candy', 'juice'],
    points: 80,
    rarity: 'common',
    description: '甜到让人沉睡的美味',
    category: 'food',
    effect: '困倦但开心',
    color: [255, 180, 220],
    glow: true,
  },

  wisdomKey: {
    id: 'wisdomKey',
    name: '智慧之钥',
    nameEn: 'Key of Wisdom',
    ingredients: ['book', 'key', 'musicNote'],
    points: 88,
    rarity: 'common',
    description: '开启智慧之门的钥匙',
    category: 'item',
    effect: '变聪明',
    color: [218, 165, 32],
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
 * 检查配方是否匹配
 */
export function checkRecipe(foodTypeKeys) {
  const sortedKeys = [...foodTypeKeys].sort().join(',');

  for (const [recipeId, recipe] of Object.entries(RECIPES)) {
    const sortedIngredients = [...recipe.ingredients].sort().join(',');
    if (sortedKeys === sortedIngredients) {
      return recipe;
    }
  }

  return null;
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

  const categoryNames = {
    nature: '自然物品',
    liquid: '液体',
    weird: '奇怪物品',
    delicious: '美味食物',
    abstract: '抽象物品',
  };

  const categories = recipe.ingredients.map(ing => {
    const foodType = FOOD_TYPES[ing];
    return foodType ? foodType.category : 'unknown';
  });

  const categoryCount = {};
  categories.forEach(cat => {
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const hints = [];
  for (const [category, count] of Object.entries(categoryCount)) {
    hints.push(`${count}个${categoryNames[category] || category}`);
  }

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
