/**
 * 小怪物角色模块
 * 负责怪物的创建、状态切换、动画效果
 * 使用 SVG 精灵图渲染怪物
 */

let monsterInstance = null;
let baseY = 0; // 怪物基础 Y 位置

// 当前选中的怪兽类型
let currentMonsterType = 'default';

/**
 * 怪兽类型配置
 */
export const MONSTER_TYPES = {
  // 默认怪兽（小绿怪）
  default: {
    id: 'default',
    name: '小绿怪',
    description: '呆萌可爱的小家伙，有两只大眼睛和头顶的小角',
    sprite: 'monster-default',
    bodyColor: [100, 200, 150],
    eyeStyle: 'double',
    specialAbility: null,
    hungerDrain: 1.0,
    growthRate: 1.0,
  },
  
  // 大眼仔 - 单眼怪兽
  mike: {
    id: 'mike',
    name: '大眼仔',
    description: '灵感来自《怪兽大学》的经典形象，只有一只巨大的眼睛',
    sprite: 'monster-mike',
    bodyColor: [80, 200, 120],
    eyeStyle: 'single',
    specialAbility: 'recipe_hint',
    hungerDrain: 0.8,
    growthRate: 1.0,
  },
  
  // 尖牙怪 - 可爱小恶魔
  fang: {
    id: 'fang',
    name: '毛毛怪',
    description: '紫色的毛茸茸小怪物，有尖尖的角和可爱的眯眯眼',
    sprite: 'monster-fang',
    bodyColor: [120, 60, 140],
    eyeStyle: 'slit',
    specialAbility: 'weird_food_bonus',
    hungerDrain: 1.2,
    growthRate: 1.0,
  },
};

/**
 * 设置当前怪兽类型
 */
export function setMonsterType(typeId) {
  if (MONSTER_TYPES[typeId]) {
    currentMonsterType = typeId;
    localStorage.setItem('selectedMonster', typeId);
    return true;
  }
  return false;
}

/**
 * 获取当前怪兽类型
 */
export function getMonsterType() {
  return currentMonsterType;
}

/**
 * 获取当前怪兽配置
 */
export function getCurrentMonsterConfig() {
  return MONSTER_TYPES[currentMonsterType] || MONSTER_TYPES.default;
}

/**
 * 加载保存的怪兽类型
 */
export function loadSavedMonsterType() {
  const saved = localStorage.getItem('selectedMonster');
  if (saved && MONSTER_TYPES[saved]) {
    currentMonsterType = saved;
  }
}

/**
 * 创建怪物 - 使用 SVG 精灵
 */
export function createMonster(x, y, type = null) {
  baseY = y;
  
  // 如果指定了类型，使用指定类型
  if (type && MONSTER_TYPES[type]) {
    currentMonsterType = type;
  }
  
  const config = MONSTER_TYPES[currentMonsterType] || MONSTER_TYPES.default;

  // 怪物主体容器
  const monster = add([
    pos(x, y),
    anchor('center'),
    z(5),
    scale(1),
    'monster',
  ]);

  // 加载 SVG 精灵
  const spriteObj = monster.add([
    sprite(config.sprite),
    anchor('center'),
    scale(1.2),
    z(1),
  ]);

  // 当前状态
  let currentState = 'idle';
  let targetScale = 1.2;
  
  // 颜色滤镜（用于状态变化）
  let colorTint = { r: 255, g: 255, b: 255 };

  // 平滑缩放动画
  onUpdate(() => {
    const currentScale = monster.scale.x;
    const diff = targetScale - currentScale;
    if (Math.abs(diff) > 0.001) {
      const newScale = currentScale + diff * 0.1;
      monster.scale = vec2(newScale);
    }
  });

  // 待机动画（微微上下浮动）
  let floatTime = 0;
  onUpdate(() => {
    if (currentState === 'idle') {
      floatTime += dt();
      const floatOffset = Math.sin(floatTime * 2) * 5;
      monster.pos.y = baseY + floatOffset;
    }
  });

  // 状态切换方法
  function setIdle() {
    if (currentState === 'idle') return;
    currentState = 'idle';
    colorTint = { r: 255, g: 255, b: 255 };
    spriteObj.color = rgb(colorTint.r, colorTint.g, colorTint.b);
    spriteObj.scale = vec2(1.2);
  }

  function setHappy() {
    currentState = 'happy';
    // 轻微变亮
    colorTint = { r: 255, g: 255, b: 230 };
    spriteObj.color = rgb(colorTint.r, colorTint.g, colorTint.b);
    // 轻微弹跳
    spriteObj.scale = vec2(1.25);
  }

  function setSad() {
    currentState = 'sad';
    // 变暗变蓝
    colorTint = { r: 200, g: 200, b: 255 };
    spriteObj.color = rgb(colorTint.r, colorTint.g, colorTint.b);
    spriteObj.scale = vec2(1.1);
  }

  // 吃东西动画状态
  let eatingAnimPhase = 0;
  let isEatingAnimating = false;
  
  function setEating() {
    if (currentState === 'eating') return;
    currentState = 'eating';
    colorTint = { r: 255, g: 255, b: 220 };
    spriteObj.color = rgb(colorTint.r, colorTint.g, colorTint.b);
    eatingAnimPhase = 0;
    isEatingAnimating = true;
  }
  
  // 吃东西动画更新
  onUpdate(() => {
    if (!isEatingAnimating) return;
    
    eatingAnimPhase += dt() * 15;
    const bounceScale = 1.2 + Math.sin(eatingAnimPhase) * 0.1;
    spriteObj.scale = vec2(bounceScale);
    
    if (eatingAnimPhase > Math.PI * 2) {
      isEatingAnimating = false;
      spriteObj.scale = vec2(1.2);
      setIdle();
    }
  });

  function grow(amount) {
    targetScale = Math.min(2.5, targetScale + amount);
    
    // 成长特效
    for (let i = 0; i < 8; i++) {
      add([
        circle(6),
        pos(monster.pos.x + rand(-60, 60), monster.pos.y + rand(-60, 60)),
        color(255, 255, 100),
        opacity(1),
        lifespan(0.6, () => {}),
        z(10),
        {
          update() {
            this.pos.y -= 60 * dt();
            this.opacity -= 2 * dt();
          }
        },
      ]);
    }
    
    // 星星特效
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const starX = monster.pos.x + Math.cos(angle) * 80;
      const starY = monster.pos.y + Math.sin(angle) * 80;
      add([
        circle(4),
        pos(starX, starY),
        color(255, 220, 100),
        opacity(1),
        lifespan(0.4, () => {}),
        z(10),
        {
          update() {
            this.opacity -= 3 * dt();
            this.pos.x += Math.cos(angle) * 30 * dt();
            this.pos.y += Math.sin(angle) * 30 * dt();
          }
        },
      ]);
    }
  }

  // 存储方法和组件到怪物对象
  monster.setIdle = setIdle;
  monster.setHappy = setHappy;
  monster.setSad = setSad;
  monster.setEating = setEating;
  monster.grow = grow;
  monster.config = config;
  monster.spriteObj = spriteObj;

  monsterInstance = monster;
  return monster;
}

export function getMonster() {
  return monsterInstance;
}

// 更新怪物位置（窗口大小变化时调用）
export function updateMonsterPosition(x, y) {
  if (monsterInstance) {
    baseY = y;
    monsterInstance.pos.x = x;
    monsterInstance.pos.y = y;
  }
}
