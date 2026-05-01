/**
 * 食物系统模块
 * 定义各种食物类型、生成逻辑、飘动动画
 */

import { getMonster } from './monster.js';
import { gameState } from './state.js';

// 食物类型定义
export const FOOD_TYPES = {
  // 自然物品
  branch: {
    name: '树枝',
    emoji: '🪵',
    color: [139, 90, 43],
    points: 10,
    category: 'nature',
    shape: 'rect',
    size: [30, 8],
    rotation: true,
  },
  rock: {
    name: '石头',
    emoji: '🪨',
    color: [128, 128, 128],
    points: 8,
    category: 'nature',
    shape: 'polygon',
    sides: 6,
    size: 25,
  },
  leaf: {
    name: '树叶',
    emoji: '🍃',
    color: [34, 139, 34],
    points: 12,
    category: 'nature',
    shape: 'ellipse',
    size: [20, 35],
    rotation: true,
  },
  flower: {
    name: '花朵',
    emoji: '🌸',
    color: [255, 105, 180],
    points: 15,
    category: 'nature',
    shape: 'flower',
    size: 20,
  },
  mushroom: {
    name: '蘑菇',
    emoji: '🍄',
    color: [200, 100, 100],
    points: 18,
    category: 'nature',
    shape: 'mushroom',
    size: 25,
  },

  // 液体/污秽
  dirtyWater: {
    name: '脏水',
    emoji: '💧',
    color: [80, 60, 40],
    points: 12,
    category: 'liquid',
    shape: 'blob',
    size: 28,
    reaction: 'disgust',
  },
  mud: {
    name: '泥浆',
    emoji: '🟤',
    color: [101, 67, 33],
    points: 15,
    category: 'liquid',
    shape: 'blob',
    size: 30,
    reaction: 'disgust',
  },
  rainbowWater: {
    name: '彩虹水',
    emoji: '🌈',
    color: [255, 100, 200],
    points: 25,
    category: 'liquid',
    shape: 'blob',
    size: 25,
    reaction: 'happy',
    rainbow: true,
  },
  lava: {
    name: '岩浆',
    emoji: '🔥',
    color: [255, 69, 0],
    points: 30,
    category: 'liquid',
    shape: 'blob',
    size: 28,
    reaction: 'surprised',
    glow: true,
  },

  // 奇怪物品
  battery: {
    name: '电池',
    emoji: '🔋',
    color: [50, 50, 50],
    points: 20,
    category: 'weird',
    shape: 'rect',
    size: [12, 30],
    reaction: 'shocked',
  },
  sock: {
    name: '袜子',
    emoji: '🧦',
    color: [200, 200, 220],
    points: 15,
    category: 'weird',
    shape: 'sock',
    size: 25,
    reaction: 'disgust',
  },
  key: {
    name: '钥匙',
    emoji: '🔑',
    color: [218, 165, 32],
    points: 22,
    category: 'weird',
    shape: 'key',
    size: 25,
  },
  book: {
    name: '书本',
    emoji: '📚',
    color: [70, 130, 180],
    points: 25,
    category: 'weird',
    shape: 'rect',
    size: [25, 35],
    rotation: true,
  },
  phone: {
    name: '手机',
    emoji: '📱',
    color: [40, 40, 40],
    points: 28,
    category: 'weird',
    shape: 'rect',
    size: [15, 30],
    screen: true,
  },

  // 美味食物
  burger: {
    name: '汉堡',
    emoji: '🍔',
    color: [210, 160, 100],
    points: 35,
    category: 'delicious',
    shape: 'burger',
    size: 35,
    reaction: 'happy',
  },
  cake: {
    name: '蛋糕',
    emoji: '🎂',
    color: [255, 182, 193],
    points: 40,
    category: 'delicious',
    shape: 'cake',
    size: 30,
    reaction: 'happy',
    inedible: true, // 不可食用
  },
  candy: {
    name: '糖果',
    emoji: '🍬',
    color: [255, 100, 100],
    points: 30,
    category: 'delicious',
    shape: 'candy',
    size: 20,
    rainbow: true,
    inedible: true, // 不可食用
  },
  pizza: {
    name: '披萨',
    emoji: '🍕',
    color: [255, 200, 100],
    points: 38,
    category: 'delicious',
    shape: 'triangle',
    size: 35,
    reaction: 'happy',
  },

  // 抽象物品
  heart: {
    name: '爱心',
    emoji: '❤️',
    color: [255, 50, 100],
    points: 45,
    category: 'abstract',
    shape: 'heart',
    size: 28,
    glow: true,
    reaction: 'love',
    inedible: true, // 不可食用
  },
  star: {
    name: '星星',
    emoji: '⭐',
    color: [255, 215, 0],
    points: 50,
    category: 'abstract',
    shape: 'star',
    size: 25,
    glow: true,
    inedible: true, // 不可食用
  },
  musicNote: {
    name: '音符',
    emoji: '🎵',
    color: [138, 43, 226],
    points: 40,
    category: 'abstract',
    shape: 'music',
    size: 30,
  },
  code: {
    name: '代码片段',
    emoji: '💻',
    color: [0, 255, 136],
    points: 55,
    category: 'abstract',
    shape: 'code',
    size: 30,
    glow: true,
    reaction: 'nerd',
  },

  // 新增食材 - 自然类
  crystal: {
    name: '水晶',
    emoji: '💎',
    color: [200, 220, 255],
    points: 35,
    category: 'nature',
    shape: 'hexagon',
    size: 28,
    glow: true,
    rotation: true,
  },
  bone: {
    name: '骨头',
    emoji: '🦴',
    color: [240, 240, 240],
    points: 22,
    category: 'nature',
    shape: 'bone',
    size: 30,
  },

  // 新增食材 - 液体系
  poison: {
    name: '毒液',
    emoji: '☠️',
    color: [128, 0, 128],
    points: 28,
    category: 'liquid',
    shape: 'blob',
    size: 26,
    glow: true,
    reaction: 'disgust',
  },
  goldWater: {
    name: '金水',
    emoji: '✨',
    color: [255, 215, 0],
    points: 40,
    category: 'liquid',
    shape: 'blob',
    size: 25,
    glow: true,
  },

  // 新增食材 - 奇怪类
  eyeball: {
    name: '眼球',
    emoji: '👁️',
    color: [255, 255, 255],
    points: 30,
    category: 'weird',
    shape: 'eye',
    size: 28,
    glow: true,
    reaction: 'disgust',
  },
  gunpowder: {
    name: '火药',
    emoji: '💥',
    color: [50, 50, 50],
    points: 25,
    category: 'weird',
    shape: 'bag',
    size: 25,
  },

  // 新增食材 - 美味类
  barbecue: {
    name: '烧烤',
    emoji: '🍖',
    color: [139, 69, 19],
    points: 42,
    category: 'delicious',
    shape: 'meat',
    size: 32,
    reaction: 'happy',
  },
  juice: {
    name: '果汁',
    emoji: '🧃',
    color: [255, 165, 0],
    points: 38,
    category: 'delicious',
    shape: 'cup',
    size: 28,
    reaction: 'happy',
  },

  // 新增食材 - 抽象类
  moon: {
    name: '月亮',
    emoji: '🌙',
    color: [200, 200, 220],
    points: 48,
    category: 'abstract',
    shape: 'crescent',
    size: 30,
    glow: true,
  },
  sun: {
    name: '太阳',
    emoji: '☀️',
    color: [255, 200, 50],
    points: 52,
    category: 'abstract',
    shape: 'sunShape',
    size: 35,
    glow: true,
  },

  // ========== 学生向食物（解压卖点）==========

  deadline: {
    name: 'DDL纸条',
    emoji: '📝',
    color: [255, 240, 200],
    points: 30,
    category: 'weird',
    shape: 'deadline',
    size: 32,
    reaction: 'disgusted',
    studentFood: true,
  },

  energyDrink: {
    name: '能量饮料',
    emoji: '🥤',
    color: [255, 80, 0],
    points: 35,
    category: 'liquid',
    shape: 'energyDrink',
    size: 30,
    reaction: 'excited',
    glow: true,
    studentFood: true,
  },

  notification: {
    name: '烦人弹窗',
    emoji: '🔔',
    color: [255, 50, 50],
    points: 28,
    category: 'weird',
    shape: 'notification',
    size: 34,
    reaction: 'annoyed',
    studentFood: true,
  },

  examPaper: {
    name: '考卷',
    emoji: '📄',
    color: [255, 255, 255],
    points: 40,
    category: 'weird',
    shape: 'examPaper',
    size: 36,
    reaction: 'disgusted',
    studentFood: true,
  },
};

// 所有食物类型键列表
const foodTypeKeys = Object.keys(FOOD_TYPES);

// 活跃的食物列表
let activeFoods = [];
let monsterRef = null;

export function initFoodSystem(monster, state) {
  monsterRef = monster;
  
  return {
    getFoodCount: () => activeFoods.length,
    removeFood: (food) => {
      const index = activeFoods.indexOf(food);
      if (index > -1) {
        activeFoods.splice(index, 1);
      }
    },
  };
}

// 清除所有活跃食物（用于游戏重启）
export function clearAllActiveFoods() {
  activeFoods.forEach(f => {
    if (f.exists && f.exists()) {
      f.destroy();
    }
  });
  activeFoods = [];
}

// 创建食物
export function createFood() {
  // 随机选择食物类型
  const typeKey = foodTypeKeys[Math.floor(Math.random() * foodTypeKeys.length)];
  const foodType = FOOD_TYPES[typeKey];
  
  // 随机生成位置（从屏幕边缘飘入）
  const side = Math.floor(Math.random() * 4); // 0:左 1:右 2:上 3:下
  let startX, startY, targetX, targetY;
  
  const margin = 50;
  
  switch (side) {
    case 0: // 从左边飘入
      startX = -margin;
      startY = rand(100, height() - 100);
      targetX = rand(200, width() - 200);
      targetY = rand(100, height() - 200);
      break;
    case 1: // 从右边飘入
      startX = width() + margin;
      startY = rand(100, height() - 100);
      targetX = rand(200, width() - 200);
      targetY = rand(100, height() - 200);
      break;
    case 2: // 从上方飘入
      startX = rand(100, width() - 100);
      startY = -margin;
      targetX = rand(200, width() - 200);
      targetY = rand(200, height() - 200);
      break;
    case 3: // 从下方飘入
      startX = rand(100, width() - 100);
      startY = height() + margin;
      targetX = rand(200, width() - 200);
      targetY = rand(100, height() - 300);
      break;
  }

  // 创建食物实体
  const foodSize = foodType.size || 20;
  const actualSize = Array.isArray(foodSize) ? Math.max(foodSize[0], foodSize[1]) : foodSize;

  // 飘动动画参数
  const floatSpeed = rand(30, 60);
  const floatAngle = Math.atan2(targetY - startY, targetX - startX);
  const wobbleAmount = rand(20, 40);
  const wobbleSpeed = rand(2, 4);
  const perpAngle = floatAngle + Math.PI / 2;

  const food = add([
    pos(startX, startY),
    anchor('center'),
    z(6),
    opacity(1),
    rotate(0),
    'food',
    foodType.category, // 添加分类标签
    { foodType: foodType, typeKey: typeKey, inForge: false },
    {
      wobbleTime: 0,
      update() {
        // 如果在合成炉中，停止移动
        if (this.inForge) return;
        
        this.wobbleTime += dt();
        
        // 主要移动方向
        const moveX = Math.cos(floatAngle) * floatSpeed * dt();
        const moveY = Math.sin(floatAngle) * floatSpeed * dt();
        
        // 添加摆动
        const wobble = Math.sin(this.wobbleTime * wobbleSpeed) * wobbleAmount;
        
        this.pos.x += moveX + Math.cos(perpAngle) * wobble * dt();
        this.pos.y += moveY + Math.sin(perpAngle) * wobble * dt();
        
        // 旋转（如果该食物类型需要旋转）
        if (foodType.rotation || foodType.shape === 'star') {
          this.angle += 30 * dt();
        }

        // 彩虹色变化
        if (foodType.rainbow) {
          const hue = (this.wobbleTime * 100) % 360;
          const rgbColor = hsl2rgb(hue, 100, 60);
          this.color = rgb(rgbColor.r, rgbColor.g, rgbColor.b);
        }
        
        // 超出屏幕范围则移除
        if (this.pos.x < -100 || this.pos.x > width() + 100 ||
            this.pos.y < -100 || this.pos.y > height() + 100) {
          this.destroy();
          const index = activeFoods.indexOf(this);
          if (index > -1) activeFoods.splice(index, 1);
        }
      }
    },
  ]);

  // 绘制食物形状
  drawFoodShape(food, foodType);

  activeFoods.push(food);
  return food;
}

// 绘制食物形状
function drawFoodShape(food, foodType) {
  const c = foodType.color;
  
  switch (foodType.shape) {
    case 'rect':
      food.add([
        rect(foodType.size[0], foodType.size[1]),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      break;
      
    case 'ellipse':
      // 用圆代替椭圆
      food.add([
        circle((foodType.size[0] + foodType.size[1]) / 2 / 2),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      break;
      
    case 'polygon':
      food.add([
        circle(foodType.size),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      break;

    case 'triangle':
      // 简化的三角形披萨 - 用圆形代替
      food.add([
        circle(foodType.size),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      // 添加披萨上的小点
      food.add([circle(3), pos(5, -5), color(255, 50, 50), anchor('center')]);
      food.add([circle(3), pos(-3, 5), color(255, 50, 50), anchor('center')]);
      break;

    case 'star':
      // 星星形状 - 用圆形代替
      food.add([
        circle(foodType.size),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      // 添加星星效果的小点
      food.add([circle(3), pos(0, -foodType.size * 0.5), color(255, 255, 200), anchor('center')]);
      break;

    case 'heart':
      // 心形（用圆形近似）
      food.add([
        circle(foodType.size * 0.5),
        pos(-foodType.size * 0.3, -foodType.size * 0.1),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      food.add([
        circle(foodType.size * 0.5),
        pos(foodType.size * 0.3, -foodType.size * 0.1),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      food.add([
        circle(foodType.size * 0.5),
        pos(0, foodType.size * 0.3),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      break;
      
    case 'blob':
      // 不规则圆形
      food.add([
        circle(foodType.size),
        color(c[0], c[1], c[2]),
        anchor('center'),
        opacity(0.8),
      ]);
      // 添加一些半透明层
      food.add([
        circle(foodType.size * 0.7),
        color(c[0] + 30, c[1] + 30, c[2] + 30),
        anchor('center'),
        opacity(0.5),
      ]);
      break;
      
    case 'flower':
      // 花朵：中心圆 + 周围的花瓣
      food.add([circle(8), color(255, 255, 100), anchor('center')]);
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        food.add([
          circle(10),
          pos(Math.cos(angle) * 12, Math.sin(angle) * 12),
          color(c[0], c[1], c[2]),
          anchor('center'),
        ]);
      }
      break;
      
    case 'mushroom':
      // 蘑菇：帽 + 柄
      food.add([
        circle(foodType.size * 0.6),
        pos(0, -5),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      food.add([
        rect(8, 15),
        pos(0, 8),
        color(255, 255, 240),
        anchor('center'),
      ]);
      // 蘑菇上的点
      food.add([circle(4), pos(-8, -8), color(255, 255, 255), anchor('center')]);
      food.add([circle(3), pos(5, -5), color(255, 255, 255), anchor('center')]);
      break;
      
    case 'candy':
      // 糖果：圆 + 两边包装
      food.add([
        circle(foodType.size * 0.5),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      food.add([
        circle(5),
        pos(-foodType.size - 3, 0),
        color(c[0] - 30, c[1] - 30, c[2] - 30),
        anchor('center'),
      ]);
      food.add([
        circle(5),
        pos(foodType.size + 3, 0),
        color(c[0] - 30, c[1] - 30, c[2] - 30),
        anchor('center'),
      ]);
      break;
      
    case 'burger':
      // 汉堡：多层
      food.add([
        circle(foodType.size * 0.4),
        pos(0, -12),
        color(180, 120, 60),
        anchor('center'),
      ]); // 上层面包
      food.add([
        rect(foodType.size * 1.8, 8),
        pos(0, -2),
        color(100, 180, 100),
        anchor('center'),
      ]); // 生菜
      food.add([
        rect(foodType.size * 1.6, 10),
        pos(0, 6),
        color(139, 69, 19),
        anchor('center'),
      ]); // 肉饼
      food.add([
        circle(foodType.size * 0.4),
        pos(0, 14),
        color(180, 120, 60),
        anchor('center'),
      ]); // 下层面包
      break;
      
    case 'cake':
      // 蛋糕：多层 + 蜡烛
      food.add([
        rect(foodType.size, foodType.size * 0.8),
        pos(0, 5),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      food.add([
        rect(foodType.size + 6, 8),
        pos(0, -8),
        color(255, 255, 255),
        anchor('center'),
      ]); // 奶油
      food.add([
        rect(4, 12),
        pos(0, -18),
        color(255, 100, 100),
        anchor('center'),
      ]); // 蜡烛
      food.add([
        circle(3),
        pos(0, -26),
        color(255, 200, 50),
        anchor('center'),
      ]); // 火焰
      break;
      
    case 'code':
      // 代码片段：带文字效果的矩形
      food.add([
        rect(foodType.size, foodType.size * 0.8),
        color(30, 30, 40),
        anchor('center'),
      ]);
      // 代码行
      food.add([rect(foodType.size * 0.7, 3), pos(0, -6), color(0, 255, 136), anchor('center')]);
      food.add([rect(foodType.size * 0.5, 3), pos(-3, 0), color(100, 200, 255), anchor('center')]);
      food.add([rect(foodType.size * 0.6, 3), pos(2, 6), color(255, 200, 100), anchor('center')]);
      break;

    case 'hexagon':
      // 六边形水晶
      food.add([
        circle(foodType.size * 0.8),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      // 添加切面效果
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        food.add([
          circle(foodType.size * 0.3),
          pos(Math.cos(angle) * foodType.size * 0.4, Math.sin(angle) * foodType.size * 0.4),
          color(c[0] - 30, c[1] - 30, c[2] - 30),
          anchor('center'),
        ]);
      }
      break;

    case 'bone':
      // 骨头
      food.add([
        rect(foodType.size * 0.3, foodType.size * 0.8),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      food.add([
        circle(foodType.size * 0.25),
        pos(0, -foodType.size * 0.35),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      food.add([
        circle(foodType.size * 0.25),
        pos(0, foodType.size * 0.35),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      break;

    case 'eye':
      // 眼球
      food.add([
        circle(foodType.size * 0.9),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      food.add([
        circle(foodType.size * 0.4),
        color(255, 255, 255),
        anchor('center'),
      ]);
      food.add([
        circle(foodType.size * 0.25),
        color(255, 0, 0),
        anchor('center'),
      ]);
      food.add([
        circle(foodType.size * 0.1),
        color(0, 0, 0),
        anchor('center'),
      ]);
      break;

    case 'bag':
      // 火药袋
      food.add([
        rect(foodType.size * 0.8, foodType.size * 0.9),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      food.add([
        circle(foodType.size * 0.2),
        pos(0, -foodType.size * 0.45),
        color(c[0] + 20, c[1] + 20, c[2] + 20),
        anchor('center'),
      ]);
      break;

    case 'meat':
      // 烧烤肉块
      food.add([
        circle(foodType.size * 0.7),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      // 烤痕
      food.add([rect(foodType.size * 0.5, 3), pos(-5, 0), color(100, 50, 20), anchor('center')]);
      food.add([rect(foodType.size * 0.4, 3), pos(3, 5), color(100, 50, 20), anchor('center')]);
      food.add([rect(foodType.size * 0.3, 3), pos(-2, -5), color(100, 50, 20), anchor('center')]);
      break;

    case 'cup':
      // 果汁杯
      food.add([
        rect(foodType.size * 0.6, foodType.size * 0.8),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      food.add([
        rect(foodType.size * 0.7, 4),
        pos(0, foodType.size * 0.35),
        color(c[0] - 30, c[1] - 30, c[2] - 30),
        anchor('center'),
      ]);
      break;

    case 'crescent':
      // 月牙
      food.add([
        circle(foodType.size * 0.6),
        pos(-8, 0),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      food.add([
        circle(foodType.size * 0.5),
        pos(-12, 0),
        color(30, 30, 50),
        anchor('center'),
      ]);
      break;

    case 'sunShape':
      // 太阳
      food.add([
        circle(foodType.size * 0.5),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
      // 光芒
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        food.add([
          rect(6, foodType.size * 0.3),
          pos(Math.cos(angle) * foodType.size * 0.6, Math.sin(angle) * foodType.size * 0.6),
          color(c[0], c[1], c[2]),
          anchor('center'),
          rotate(angle * 180 / Math.PI + 90),
        ]);
      }
      break;

    case 'deadline': {
      // DDL纸条：皱巴巴的便利贴，上面写着"DEADLINE"
      const s = foodType.size;
      // 纸张主体（微微倾斜的矩形）
      food.add([rect(s, s * 0.8), color(255, 235, 150), anchor('center')]);
      // 折角（右上角暗色三角）
      food.add([rect(s * 0.3, s * 0.3), pos(s * 0.35, -s * 0.25), color(220, 190, 100), anchor('center')]);
      // 红色"DEADLINE"标题条
      food.add([rect(s * 0.85, s * 0.18), pos(0, -s * 0.25), color(220, 60, 60), anchor('center')]);
      // 白色"DEADLINE"文字区域（用白色小矩形模拟）
      food.add([rect(s * 0.65, s * 0.1), pos(0, -s * 0.25), color(255, 255, 255, 0.8), anchor('center')]);
      // 三条内容线（模拟文字）
      food.add([rect(s * 0.7, 3), pos(0, -s * 0.05), color(150, 120, 80), anchor('center')]);
      food.add([rect(s * 0.6, 3), pos(-s * 0.05, s * 0.1), color(150, 120, 80), anchor('center')]);
      // 红色感叹号
      food.add([rect(4, s * 0.22), pos(s * 0.28, s * 0.18), color(220, 60, 60), anchor('center')]);
      food.add([circle(3), pos(s * 0.28, s * 0.33), color(220, 60, 60), anchor('center')]);
      break;
    }

    case 'energyDrink': {
      // 能量饮料罐：红牛/功能饮料罐形象
      const s = foodType.size;
      // 罐身
      food.add([rect(s * 0.55, s * 0.95), color(40, 40, 40), anchor('center')]);
      // 顶盖
      food.add([rect(s * 0.5, s * 0.1), pos(0, -s * 0.48), color(180, 180, 180), anchor('center')]);
      // 底盖
      food.add([rect(s * 0.5, s * 0.1), pos(0, s * 0.48), color(180, 180, 180), anchor('center')]);
      // 橙红渐变条纹（从上到下两条）
      food.add([rect(s * 0.55, s * 0.3), pos(0, -s * 0.15), color(c[0], c[1], c[2]), anchor('center')]);
      food.add([rect(s * 0.55, s * 0.2), pos(0, s * 0.2), color(255, 150, 0), anchor('center')]);
      // 闪电 LOGO（黄色菱形）
      food.add([circle(s * 0.12), pos(0, s * 0.02), color(255, 230, 0), anchor('center')]);
      food.add([rect(4, s * 0.25), pos(0, s * 0.02), color(255, 230, 0), anchor('center'), rotate(30)]);
      // 顶部拉环
      food.add([rect(s * 0.18, 4), pos(0, -s * 0.44), color(220, 220, 220), anchor('center')]);
      break;
    }

    case 'notification': {
      // 烦人弹窗：系统对话框样式
      const s = foodType.size;
      // 窗口主体（白色圆角矩形用两个矩形叠加模拟）
      food.add([rect(s, s * 0.75), color(245, 245, 250), anchor('center')]);
      // 红色标题栏
      food.add([rect(s, s * 0.2), pos(0, -s * 0.28), color(c[0], c[1], c[2]), anchor('center')]);
      // 标题栏上的 ✕ 关闭按钮（白色小圆）
      food.add([circle(s * 0.1), pos(s * 0.38, -s * 0.28), color(255, 255, 255), anchor('center')]);
      // 正文两条线（灰色）
      food.add([rect(s * 0.75, 3), pos(0, -s * 0.05), color(180, 180, 180), anchor('center')]);
      food.add([rect(s * 0.55, 3), pos(-s * 0.1, s * 0.08), color(180, 180, 180), anchor('center')]);
      // 感叹号三角警告图标
      food.add([circle(s * 0.13), pos(-s * 0.3, s * 0.05), color(255, 180, 0), anchor('center')]);
      food.add([rect(3, s * 0.12), pos(-s * 0.3, s * 0.03), color(40, 40, 40), anchor('center')]);
      food.add([circle(2), pos(-s * 0.3, s * 0.11), color(40, 40, 40), anchor('center')]);
      // 底部"确定"按钮
      food.add([rect(s * 0.35, s * 0.15), pos(s * 0.25, s * 0.25), color(c[0], c[1], c[2]), anchor('center')]);
      food.add([rect(s * 0.35, s * 0.15), pos(-s * 0.2, s * 0.25), color(200, 200, 200), anchor('center')]);
      break;
    }

    case 'examPaper': {
      // 考卷：白纸 + 红色大叉/低分标记
      const s = foodType.size;
      // 纸张主体（白色）
      food.add([rect(s, s * 0.85), color(255, 255, 252), anchor('center')]);
      // 顶部标题区域（浅灰）
      food.add([rect(s * 0.85, s * 0.12), pos(0, -s * 0.33), color(220, 220, 220), anchor('center')]);
      // 内容线条（模拟试题）
      food.add([rect(s * 0.78, 2), pos(0, -s * 0.15), color(200, 200, 200), anchor('center')]);
      food.add([rect(s * 0.78, 2), pos(0, -s * 0.02), color(200, 200, 200), anchor('center')]);
      food.add([rect(s * 0.78, 2), pos(0, s * 0.1), color(200, 200, 200), anchor('center')]);
      food.add([rect(s * 0.6, 2), pos(-s * 0.09, s * 0.22), color(200, 200, 200), anchor('center')]);
      // 大红叉（核心！发泄感来源）
      food.add([rect(s * 0.6, 5), pos(0, s * 0.08), color(220, 40, 40), anchor('center'), rotate(45)]);
      food.add([rect(s * 0.6, 5), pos(0, s * 0.08), color(220, 40, 40), anchor('center'), rotate(-45)]);
      // 红色圈住的低分数字（左上角小圆圈）
      food.add([circle(s * 0.2), pos(-s * 0.32, s * 0.3), color(0, 0, 0, 0), anchor('center')]);
      food.add([rect(3, s * 0.2), pos(-s * 0.32, s * 0.3), color(220, 40, 40), anchor('center')]); // 数字"5"简化
      food.add([rect(s * 0.15, 3), pos(-s * 0.32, s * 0.23), color(220, 40, 40), anchor('center')]);
      // 红圈（分数圈）
      food.add([circle(s * 0.18), pos(-s * 0.32, s * 0.3), color(220, 40, 40, 0.3), anchor('center')]);
      break;
    }

    default:
      // 默认圆形
      food.add([
        circle(foodType.size || 20),
        color(c[0], c[1], c[2]),
        anchor('center'),
      ]);
  }
  
  // 如果有屏幕（手机类）
  if (foodType.screen) {
    food.add([
      rect(foodType.size[0] - 4, foodType.size[1] - 6),
      color(50, 150, 255),
      anchor('center'),
    ]);
  }
  
  // 如果是袜子
  if (foodType.shape === 'sock') {
    food.add([
      circle(12),
      pos(0, 0),
      color(c[0], c[1], c[2]),
      anchor('center'),
    ]);
    food.add([
      circle(8),
      pos(8, 10),
      color(c[0] - 20, c[1] - 20, c[2] - 20),
      anchor('center'),
    ]);
  }
  
  // 如果是钥匙
  if (foodType.shape === 'key') {
    food.add([
      circle(8),
      pos(0, -8),
      color(c[0], c[1], c[2]),
      anchor('center'),
    ]);
    food.add([
      circle(4),
      pos(0, -8),
      color(50, 50, 50),
      anchor('center'),
    ]);
    food.add([
      rect(4, 25),
      pos(0, 8),
      color(c[0], c[1], c[2]),
      anchor('center'),
    ]);
    food.add([
      rect(8, 4),
      pos(2, 16),
      color(c[0], c[1], c[2]),
      anchor('center'),
    ]);
  }
  
  // 如果是音符
  if (foodType.shape === 'music') {
    food.add([
      circle(10),
      pos(-5, 8),
      color(c[0], c[1], c[2]),
      anchor('center'),
    ]);
    food.add([
      rect(3, 25),
      pos(3, -5),
      color(c[0], c[1], c[2]),
      anchor('center'),
    ]);
    food.add([
      circle(6),
      pos(8, -15),
      color(c[0], c[1], c[2]),
      anchor('center'),
    ]);
  }
}

// 获取活跃食物列表
export function getActiveFoods() {
  // 清理已销毁的食物，避免出现“看不见但可交互/可提示”的幽灵对象
  activeFoods = activeFoods.filter(food => food && food.exists && food.exists());
  return activeFoods;
}
