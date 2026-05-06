/**
 * 合成配方系统
 * 使用"维度阈值 + 优先级"匹配料理
 *
 * 设计原则：
 * - 每个配方应有独特条件组合，避免被其他配方完全覆盖
 * - 惩罚配方使用"正常配方不会触碰"的条件组合
 * - 有舍有得配方提供"高收益 + debuff"或"低分 + 强buff"的选择
 * - 稀有度越高的配方优先级越高
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

// 配方定义
// conditions: 满足条件即可命中；多个命中时选 priority 更高者
// 注意：每个配方的条件组合必须"独特"——不能和其他配方完全相同！
export const RECIPES = {

  // ═══════════════════════════════════════
  // 传说配方（需最高分 2000 解锁）
  // ═══════════════════════════════════════

  breakfastEgg: {
    id: 'breakfastEgg',
    name: '早餐蛋',
    points: 76,
    rarity: 'legendary',
    priority: 20,
    conditions: { delicious: 1, weird: 1, liquid: 1 },
    description: '完美搭配唤醒元气满满的一天',
    category: 'dish',
    effect: '大幅恢复饱食度并加分',
    color: [255, 225, 130],
    glow: true,
    buff: { type: 'megaBoost', duration: 15 },
  },

  ultraAbstract: {
    id: 'ultraAbstract',
    name: '极致抽象',
    points: 80,
    rarity: 'legendary',
    priority: 22,
    conditions: { abstract: 3 },
    description: '纯粹的概念——怪兽陷入沉思',
    category: 'dish',
    effect: '全面增益（超强）',
    color: [180, 120, 255],
    glow: true,
    unlockBy: { type: 'achievement', id: 'speed_feeds_10' },
    buff: { type: 'megaBoost', duration: 18 },
  },

  // ═══════════════════════════════════════
  // 稀有配方（需最高分 800 解锁）
  // ═══════════════════════════════════════

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

  earthHarvest: {
    id: 'earthHarvest',
    name: '大地丰收',
    points: 50,
    rarity: 'rare',
    priority: 11,
    conditions: { nature: 2, delicious: 1 },
    description: '自然与美味的完美结合，硕果累累',
    category: 'dish',
    effect: '食物生成速度翻倍',
    color: [100, 200, 120],
    glow: true,
    unlockBy: { type: 'achievement', id: 'craft_5' },
    buff: { type: 'foodSpawnRate', duration: 12 },
  },

  rainbowSoda: {
    id: 'rainbowSoda',
    name: '彩虹汽水',
    points: 52,
    rarity: 'rare',
    priority: 11,
    conditions: { liquid: 3 },
    description: '三种液体调和出彩虹般的光芒',
    category: 'dish',
    effect: '所有得分翻倍',
    color: [255, 200, 100],
    glow: true,
    unlockBy: { type: 'achievement', id: 'feed_50' },
    buff: { type: 'scoreMultiplier', duration: 10 },
  },

  weirdTrio: {
    id: 'weirdTrio',
    name: '诡异三重奏',
    points: 48,
    rarity: 'rare',
    priority: 10,
    conditions: { weird: 3 },
    description: '三倍古怪，怪兽却异常兴奋',
    category: 'dish',
    effect: '诅咒增幅',
    color: [200, 80, 200],
    glow: true,
    unlockBy: { type: 'achievement', id: 'combo_5' },
    buff: { type: 'cursedBoost', duration: 10 },
  },

  elementalVortex: {
    id: 'elementalVortex',
    name: '元素漩涡',
    points: 62,
    rarity: 'rare',
    priority: 15,
    conditions: { nature: 1, liquid: 1, weird: 1, abstract: 1 },
    description: '四种元素在锅中交汇，形成能量漩涡',
    category: 'dish',
    effect: '全面增益',
    color: [200, 100, 255],
    glow: true,
    unlockBy: { type: 'achievement', id: 'craft_20' },
    buff: { type: 'megaBoost', duration: 12 },
  },

  // ═══════════════════════════════════════
  // 普通配方（始终可用）
  // ═══════════════════════════════════════

  // 兜底料理
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

  // ——— 双维度配方（最低门槛的"正经食谱"）———

  mushroomStew: {
    id: 'mushroomStew',
    name: '蘑菇浓汤',
    points: 38,
    rarity: 'common',
    priority: 5,
    conditions: { nature: 1, delicious: 1 },
    description: '自然与美味的初阶搭配',
    category: 'dish',
    effect: '自然类别得分翻倍',
    color: [180, 120, 80],
    buff: { type: 'categoryBonus', duration: 10, params: { category: 'nature', multiplier: 2 } },
  },

  abstractPaste: {
    id: 'abstractPaste',
    name: '抽象糊',
    points: 42,
    rarity: 'common',
    priority: 5,
    conditions: { abstract: 1, delicious: 1 },
    description: '概念与美味的碰撞',
    category: 'dish',
    effect: '抽象类别得分翻倍',
    color: [180, 100, 200],
    glow: true,
    buff: { type: 'categoryBonus', duration: 10, params: { category: 'abstract', multiplier: 2 } },
  },

  clearBroth: {
    id: 'clearBroth',
    name: '清汤',
    points: 32,
    rarity: 'common',
    priority: 6,
    conditions: { liquid: 2 },
    description: '纯正汤底，暖胃续命',
    category: 'dish',
    effect: '恢复饱食度 + 生命护盾',
    color: [130, 170, 230],
    buff: { type: 'healthFreeze', duration: 8 },
  },

  weirdPaste: {
    id: 'weirdPaste',
    name: '怪味糊',
    points: 35,
    rarity: 'common',
    priority: 6,
    conditions: { weird: 1, nature: 1 },
    description: '奇怪但勉强能吃',
    category: 'dish',
    effect: '怪异类别得分翻倍',
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
    description: '纯天然风味',
    category: 'dish',
    effect: '食物生成速度翻倍',
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
    effect: '饱食度下降减半',
    color: [120, 200, 190],
    buff: { type: 'hungerDrainHalf', duration: 10 },
  },

  // ——— 学生向专属 ———

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

  // ——— 成就解锁普通配方 ———

  starlightSoup: {
    id: 'starlightSoup',
    name: '星光汤',
    points: 48,
    rarity: 'common',
    priority: 10,
    conditions: { abstract: 2, liquid: 1 },
    description: '夜空的味道，星光在舌尖绽放',
    category: 'dish',
    effect: '所有得分翻倍',
    color: [100, 150, 255],
    glow: true,
    unlockBy: { type: 'achievement', id: 'first_craft' },
    buff: { type: 'scoreMultiplier', duration: 8 },
  },

  sweetheartSpecial: {
    id: 'sweetheartSpecial',
    name: '甜心特调',
    points: 44,
    rarity: 'common',
    priority: 9,
    conditions: { delicious: 1, abstract: 1 },
    description: '甜蜜与抽象交织，怪兽超爱',
    category: 'dish',
    effect: '抽象类别得分翻倍',
    color: [255, 150, 200],
    glow: true,
    unlockBy: { type: 'achievement', id: 'feed_10' },
    buff: { type: 'categoryBonus', duration: 10, params: { category: 'abstract', multiplier: 2 } },
  },

  // ═══════════════════════════════════════
  // 惩罚配方（小心哦！）
  // 条件组合是"正常配方不会触碰"的死角
  // ═══════════════════════════════════════

  // {nature:1, delicious:1} → 正常配方没有这个组合
  // 放了自然+美味 = 混沌发酵，而不是蘑菇浓汤（需要自然+美味+怪异）
  // 如果你只放自然+美味，却忘了放第三样→被惩罚！
  chaosFerment: {
    id: 'chaosFerment',
    name: '混沌发酵',
    points: -30,
    rarity: 'common',
    priority: 2,
    conditions: { nature: 1, delicious: 1 },
    description: '自然与美味直接碰撞，却发酵失败了……',
    category: 'dish',
    effect: '扣分 + 饱食度加速下降',
    color: [80, 180, 80],
    isPunishment: true,
    buff: { type: 'foodSpoil', duration: 10 },
  },

  // {liquid:1, abstract:1} → 正常配方没有这个组合
  // 除非你把液体+抽象凑齐了3个，不然就是淤泥
  // 彩虹汽水需要液体:3，星光汤需要抽象:2+液体:1，都够不到
  sludgePlatter: {
    id: 'sludgePlatter',
    name: '淤泥拼盘',
    points: -20,
    rarity: 'common',
    priority: 2,
    conditions: { liquid: 1, abstract: 1 },
    description: '粘稠的混合物，怪兽嫌弃地别过头',
    category: 'dish',
    effect: '扣分 + 虚弱诅咒',
    color: [100, 140, 100],
    isPunishment: true,
    buff: { type: 'weakness', duration: 8 },
  },

  // {delicious:1, weird:1, liquid:1} → 早餐蛋的同款条件
  // 稀有度门槛更低（800分解锁），但早餐蛋一解锁就碾压它
  // 所以它是"中期的陷阱"→ 早餐蛋的替身
  unspeakableThing: {
    id: 'unspeakableThing',
    name: '不可名状之物',
    points: -40,
    rarity: 'rare',
    priority: 13,
    conditions: { delicious: 1, weird: 1, liquid: 1 },
    description: '本应是完美的组合，却不知哪里出了错……',
    category: 'dish',
    effect: '扣分 + 食物腐败诅咒',
    color: [60, 120, 60],
    isPunishment: true,
    buff: { type: 'foodSpoil', duration: 15 },
  },

  // ═══════════════════════════════════════
  // 有舍有得配方（Trade-off）
  // ═══════════════════════════════════════

  // "兴奋剂"：大餐拼盘(55分无debuff)的进阶版
  // 多放一个weird→+65分但要承受饱食加速
  stimulant: {
    id: 'stimulant',
    name: '兴奋剂',
    points: 65,
    rarity: 'common',
    priority: 11,
    conditions: { delicious: 2, weird: 1 },
    description: '无可抗拒的诱惑，但代价是什么？',
    category: 'dish',
    effect: '高分 + 饱食度加速下降',
    color: [255, 200, 50],
    glow: true,
    isTradeoff: true,
    buff: { type: 'foodSpoil', duration: 12 },
  },

  // "苦药"：-10分但给生命护盾
  // 如果手残老是掉血，合成这个能保命
  bitterMedicine: {
    id: 'bitterMedicine',
    name: '苦药',
    points: -10,
    rarity: 'common',
    priority: 8,
    conditions: { nature: 1, weird: 1, abstract: 1 },
    description: '难吃，但能续命',
    category: 'dish',
    effect: '扣分 + 生命值暂停下降',
    color: [130, 200, 130],
    isTradeoff: true,
    buff: { type: 'healthFreeze', duration: 12 },
  },

  // "暗黑料理"：高分诅咒套餐
  // 比诅咒烤盘分数更高，但buff更强力副作用也更明显
  darkCuisine: {
    id: 'darkCuisine',
    name: '暗黑料理',
    points: 78,
    rarity: 'rare',
    priority: 16,
    conditions: { delicious: 2, weird: 1, abstract: 1 },
    description: '极致诱惑与极致风险并存',
    category: 'dish',
    effect: '超高分 + 强诅咒',
    color: [180, 50, 50],
    glow: true,
    isTradeoff: true,
    buff: { type: 'foodSpoil', duration: 15 },
  },

  // "四叶草"：扣分换强力增益
  // 4种不同维度—不如元素漩涡高分的奖励，但能给糖
  fourLeafClover: {
    id: 'fourLeafClover',
    name: '四叶草',
    points: -15,
    rarity: 'rare',
    priority: 14,
    conditions: { nature: 1, delicious: 1, weird: 1, abstract: 1 },
    description: '四缺一的遗憾——液体去哪儿了？',
    category: 'dish',
    effect: '得分少但 buff 全面',
    color: [100, 200, 100],
    isTradeoff: true,
    buff: { type: 'scoreMultiplier', duration: 15 },
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
  legendary: 2000,
  rare: 800,
  common: 0,
};

/**
 * 初始化配方系统
 */
export function initRecipeSystem() {
  const saved = localStorage.getItem('unlockedRecipes');
  if (saved) {
    const unlocked = JSON.parse(saved);
    recipeState.unlockedRecipes = new Set(unlocked);
  }
}

/**
 * 检查配方是否达到解锁门槛
 */
export function checkRecipeUnlockThreshold(recipeId) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return false;

  if (recipe.rarity === 'common' && !recipe.unlockBy) return true;

  if (recipe.unlockBy && recipe.unlockBy.type === 'achievement') {
    const key = `achievement-unlocked-${recipe.unlockBy.id}`;
    if (localStorage.getItem(key) === 'true') return true;
  }

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
 */
export function getRecipeUnlockHint(recipeId) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return '';

  if (isRecipeUnlocked(recipeId)) {
    return getRecipeHint(recipeId);
  }

  if (recipe.rarity === 'common' && !recipe.unlockBy) {
    return '需要：任意 3 个食材';
  }

  if (recipe.unlockBy && recipe.unlockBy.type === 'achievement') {
    const achievementNames = {
      first_craft: '初次合成',
      craft_5: '合成达人',
      craft_20: '合成大师',
      feed_10: '喂食新手',
      feed_50: '喂食达人',
      combo_5: '连击新星',
      speed_feeds_10: '极速投喂',
    };
    const achName = achievementNames[recipe.unlockBy.id] || recipe.unlockBy.id;
    return `🔒 需完成成就「${achName}」解锁`;
  }

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
    return `🎉 已达门槛！合成即可解锁`;
  }

  return `🔒 最高分达到 ${threshold} 解锁 | 当前: ${highScore}`;
}

/**
 * 获取所有配方的解锁进度
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
    nature: 0, liquid: 0, weird: 0, delicious: 0, abstract: 0,
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
  const candidates = getAllRecipes().filter(recipe => {
    if (!isMatchByConditions(recipe.conditions, dimensions)) return false;
    if (!checkRecipeUnlockThreshold(recipe.id)) return false;
    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  // 先按优先级排序，同优先级按分数降序
  // 惩罚/有舍有得配方不额外区分——匹配条件+优先级说了算
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
 * 解锁成就配方的可见性
 */
export function unlockAchievementRecipes(achievementId) {
  const key = `achievement-unlocked-${achievementId}`;
  localStorage.setItem(key, 'true');
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
 * 获取彩色分段的配方提示
 */
export function getRecipeHint(recipeId) {
  if (!isRecipeUnlocked(recipeId)) {
    return getRecipeUnlockHint(recipeId);
  }

  const recipe = RECIPES[recipeId];
  if (!recipe) return '';
  const conditions = recipe.conditions || {};
  const entries = Object.entries(conditions);

  // 构建条件描述
  let hint = '';
  if (entries.length === 0) {
    hint = '需要：任意 3 个食材';
  } else {
    const condHints = entries.map(([dim, count]) => `${DIMENSION_LABELS[dim] || dim}≥${count}`);
    hint = `需要：${condHints.join(' + ')}`;
  }

  // 添加效果提示
  const buffNames = {
    hungerFreeze: '🛡️ 饱食度暂停下降',
    hungerDrainHalf: '♻️ 饱食度下降减半',
    healthFreeze: '💚 生命值暂停下降',
    scoreMultiplier: '⭐ 所有得分翻倍',
    foodSpawnRate: '🌾 食物生成翻倍',
    ignoreHate: '🌀 厌恶食物视为普通',
    categoryBonus: '🔮 特定类别加成',
    cursedBoost: '💀 得分×2.5/饱食加速',
    megaBoost: '👑 全面增益',
    foodSpoil: '⚠️ 饱食度加速下降',
    weakness: '⚡ 拖拽能量消耗翻倍',
  };

  if (recipe.buff) {
    const buffDesc = buffNames[recipe.buff.type] || '';
    if (buffDesc) {
      hint += ` | ${recipe.buff.duration}s: ${buffDesc}`;
    }
  }

  // 标签
  const tags = [];
  if (recipe.isPunishment) tags.push('☠️');
  if (recipe.isTradeoff) tags.push('⚖️');
  if (tags.length > 0) {
    hint = tags.join(' ') + ' ' + hint;
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
