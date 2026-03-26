/**
 * 合成炉系统模块 - 中世纪魔法炉子
 * 处理食物收集、合成功能
 */

// 合成炉配置
const FORGE_CONFIG = {
  x: 150, // 左侧位置
  y: 0, // 垂直居中（将在初始化时设置）
  width: 180,
  height: 280,
  furnaceRadius: 90, // 炉口半径
  maxFoods: 3, // 最多收集3个食物
  minFoods: 3, // 需要3个食物才能合成
};

// 合成炉状态
let forgeState = {
  collectedFoods: [], // 已收集的食物列表
  isHovered: false, // 是否被悬停
  forgeElement: null, // 合成炉容器引用
  foodsContainer: null, // 已收集食物容器引用
  hintText: null, // 提示文字引用
  chimneyParticles: [], // 烟囱粒子
  runeLines: [], // 符文线条
};

/**
 * 创建中世纪魔法炉子
 */
export function createForge() {
  const centerX = FORGE_CONFIG.x;
  const centerY = height() / 2;
  FORGE_CONFIG.y = centerY;

  // 合成炉容器
  const forgeContainer = add([
    pos(centerX, centerY),
    z(5),
    fixed(),
    'forge-container',
  ]);

  // 魔法光晕（最底层）
  const magicGlow = forgeContainer.add([
    circle(130),
    color(180, 100, 255),
    opacity(0.15),
    anchor('center'),
    z(0),
    'magic-glow',
    {
      glowTime: 0,
      update() {
        this.glowTime += dt();
        const scale = 1 + Math.sin(this.glowTime * 0.5) * 0.1;
        this.scale = vec2(scale);
        this.opacity = 0.12 + Math.sin(this.glowTime * 0.8) * 0.05;
      }
    },
  ]);

  // ===== 炉脚 =====
  const legRadius = 120;
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
    const legX = Math.cos(angle) * 45;
    const legY = 110; // 炉子底部下方

    const leg = forgeContainer.add([
      circle(15),
      pos(legX, legY),
      color(70, 65, 60),
      anchor('center'),
      z(1),
      'forge-leg',
    ]);

    // 炉脚符文
    const rune = leg.add([
      rect(4, 20),
      pos(0, 0),
      color(150, 100, 200),
      opacity(0.6),
      anchor('center'),
      'rune',
    ]);
    forgeState.runeLines.push(rune);
  }

  // ===== 炉身（石质主体）=====
  const bodyWidth = 140;
  const bodyHeight = 200;
  const bodyTopY = -80;
  const bodyBottomY = 100;

  // 炉身后层（立体效果）
  forgeContainer.add([
    rect(bodyWidth + 8, bodyHeight),
    pos(8, 8),
    color(60, 55, 50),
    anchor('center'),
    z(1),
  ]);

  // 炉身主体
  const furnaceBody = forgeContainer.add([
    rect(bodyWidth, bodyHeight),
    pos(0, 10),
    color(80, 75, 65),
    anchor('center'),
    z(2),
    'furnace-body',
  ]);

  // 炉身纹理（石头效果）
  for (let i = 0; i < 15; i++) {
    const texX = rand(-bodyWidth/2 + 10, bodyWidth/2 - 10);
    const texY = rand(-bodyHeight/2 + 10, bodyHeight/2 - 10);
    const texSize = rand(5, 12);

    forgeContainer.add([
      circle(texSize),
      pos(texX, texY + 10),
      color(90, 85, 75),
      opacity(0.5),
      anchor('center'),
      z(3),
    ]);
  }

  // ===== 魔法符文（炉身装饰）=====
  const runeYPositions = [-50, 0, 50];
  for (let y of runeYPositions) {
    for (let i = 0; i < 4; i++) {
      const runeX = -40 + i * 27;
      const rune = forgeContainer.add([
        rect(3, 15),
        pos(runeX, y + 10),
        color(160, 120, 220),
        opacity(0.4),
        anchor('center'),
        z(3),
        'body-rune',
      ]);
      forgeState.runeLines.push(rune);
    }
  }

  // ===== 炉口 =====
  const furnaceTopY = -40;
  const furnaceRadius = FORGE_CONFIG.furnaceRadius;

  // 炉口外框（金属）
  forgeContainer.add([
    circle(furnaceRadius + 8),
    pos(0, furnaceTopY),
    color(120, 100, 80),
    anchor('center'),
    z(4),
  ]);

  // 炉口内部（黑暗）
  forgeContainer.add([
    circle(furnaceRadius),
    pos(0, furnaceTopY),
    color(20, 15, 10),
    anchor('center'),
    z(4),
  ]);

  // 炉口金属环
  forgeContainer.add([
    circle(furnaceRadius + 3),
    pos(0, furnaceTopY),
    color(140, 120, 100),
    outline(3, rgb(100, 80, 60)),
    anchor('center'),
    z(5),
  ]);

  // ===== 炉顶 =====
  const domeWidth = 100;
  const domeHeight = 50;
  const domeY = -100;

  // 炉顶主体
  forgeContainer.add([
    rect(domeWidth, domeHeight),
    pos(0, domeY),
    color(90, 85, 75),
    anchor('center'),
    z(6),
  ]);

  // 炉顶圆弧
  forgeContainer.add([
    circle(domeWidth / 2),
    pos(0, domeY - 20),
    color(85, 80, 70),
    anchor('center'),
    z(6),
  ]);

  // 顶端魔法水晶
  const topCrystal = forgeContainer.add([
    circle(12),
    pos(0, domeY - 35),
    color(180, 130, 255),
    anchor('center'),
    z(7),
    'top-crystal',
    {
      crystalTime: 0,
      update() {
        this.crystalTime += dt();
        const brightness = 0.7 + Math.sin(this.crystalTime * 3) * 0.3;
        this.color = rgb(
          180 * brightness,
          130 * brightness,
          255 * brightness
        );
      }
    },
  ]);

  // ===== 烟囱 =====
  const chimneyY = -150;
  const chimneyWidth = 30;
  const chimneyHeight = 40;

  // 烟囱主体
  forgeContainer.add([
    rect(chimneyWidth, chimneyHeight),
    pos(0, chimneyY),
    color(75, 70, 65),
    anchor('center'),
    z(6),
  ]);

  // 烟囱口
  forgeContainer.add([
    rect(chimneyWidth + 6, 8),
    pos(0, chimneyY - chimneyHeight/2),
    color(130, 110, 90),
    anchor('center'),
    z(7),
  ]);

  // ===== 魔法火焰 =====
  const flame = forgeContainer.add([
    circle(furnaceRadius - 25),
    pos(0, furnaceTopY + 10),
    color(180, 100, 255),
    opacity(0.7),
    anchor('center'),
    z(5),
    'magic-flame',
    {
      flameTime: 0,
      update() {
        this.flameTime += dt() * 2.5;
        
        // 火焰形状变化
        const scale = 0.8 + Math.sin(this.flameTime) * 0.2;
        this.scale = vec2(scale * (1 + Math.sin(this.flameTime * 1.3) * 0.1), scale);
        
        // 颜色变化（紫色到蓝色）
        const colorMix = (Math.sin(this.flameTime) + 1) / 2;
        const purple = [180, 100, 255];
        const blue = [100, 150, 255];
        this.color = rgb(
          purple[0] * (1 - colorMix) + blue[0] * colorMix,
          purple[1] * (1 - colorMix) + blue[1] * colorMix,
          purple[2] * (1 - colorMix) + blue[2] * colorMix
        );
        
        this.opacity = 0.5 + Math.sin(this.flameTime * 1.5) * 0.25;
      }
    },
  ]);

  // 内层火焰（更亮）
  const innerFlame = forgeContainer.add([
    circle(furnaceRadius - 35),
    pos(0, furnaceTopY + 15),
    color(220, 180, 255),
    opacity(0.5),
    anchor('center'),
    z(6),
    {
      innerFlameTime: 0,
      update() {
        this.innerFlameTime += dt() * 3;
        const scale = 0.7 + Math.sin(this.innerFlameTime * 1.2) * 0.15;
        this.scale = vec2(scale);
        this.opacity = 0.4 + Math.sin(this.innerFlameTime * 2) * 0.2;
      }
    },
  ]);

  // ===== 已收集食物容器 =====
  const foodsContainer = forgeContainer.add([
    pos(0, furnaceTopY),
    z(8),
    anchor('center'),
    'forge-foods',
  ]);

  // ===== 提示文字 =====
  const hintText = forgeContainer.add([
    text('拖入 3 个食物', { size: 12 }),
    pos(0, 140),
    anchor('center'),
    color(200, 190, 180),
    z(10),
  ]);

  // ===== 保存引用 =====
  forgeState.forgeElement = forgeContainer;
  forgeState.foodsContainer = foodsContainer;
  forgeState.hintText = hintText;

  // ===== 悬停效果 =====
  onUpdate(() => {
    const mouse = mousePos();
    const distance = Math.sqrt(
      Math.pow(mouse.x - centerX, 2) +
      Math.pow(mouse.y - centerY, 2)
    );

    const wasHovered = forgeState.isHovered;
    forgeState.isHovered = distance < 120;

    // 悬停时增强效果
    if (forgeState.isHovered && !wasHovered) {
      magicGlow.opacity = 0.25;
      forgeState.runeLines.forEach(rune => {
        rune.opacity = 0.8;
      });
    } else if (!forgeState.isHovered && wasHovered) {
      magicGlow.opacity = 0.15;
      forgeState.runeLines.forEach(rune => {
        rune.opacity = 0.4;
      });
    }
  });

  // ===== 烟囱粒子系统 =====
  onUpdate(() => {
    // 生成新粒子
    if (Math.random() < 0.1) {
      createChimneyParticle(forgeContainer);
    }

    // 更新粒子
    for (let i = forgeState.chimneyParticles.length - 1; i >= 0; i--) {
      const particle = forgeState.chimneyParticles[i];
      particle.life -= dt();

      if (particle.life <= 0) {
        particle.destroy();
        forgeState.chimneyParticles.splice(i, 1);
      } else {
        particle.pos.y -= 30 * dt();
        particle.pos.x += Math.sin(particle.life * 5) * 10 * dt();
        particle.opacity = particle.life * 0.4;
        particle.scale = vec2(1 + (0.5 - particle.life) * 0.5);
      }
    }
  });

  return forgeContainer;
}

/**
 * 创建烟囱粒子
 */
function createChimneyParticle(container) {
  const particle = container.add([
    circle(rand(5, 10)),
    pos(rand(-5, 5), -170),
    color(180, 120, 255),
    opacity(0.4),
    anchor('center'),
    z(4),
    'chimney-particle',
  ]);

  particle.life = rand(0.8, 1.5);
  forgeState.chimneyParticles.push(particle);
}

/**
 * 检查食物是否在合成炉区域内
 */
export function isFoodInForge(food) {
  if (!forgeState.forgeElement) return false;

  const forgePos = forgeState.forgeElement.pos;
  const distance = Math.sqrt(
    Math.pow(food.pos.x - forgePos.x, 2) +
    Math.pow(food.pos.y - (forgePos.y - 40), 2)
  );

  return distance < FORGE_CONFIG.furnaceRadius;
}

/**
 * 添加食物到合成炉
 */
export function addFoodToForge(food) {
  if (forgeState.collectedFoods.length >= FORGE_CONFIG.maxFoods) {
    return false;
  }

  if (forgeState.collectedFoods.includes(food)) {
    return false;
  }

  food.use({
    id: 'inForge',
    update() {
      // 在合成炉中静止
    }
  });

  forgeState.collectedFoods.push(food);
  updateFoodsDisplay();
  updateHintText();

  return true;
}

/**
 * 更新已收集食物的显示位置
 */
function updateFoodsDisplay() {
  const count = forgeState.collectedFoods.length;
  const foods = forgeState.collectedFoods;

  foods.forEach((food, index) => {
    let targetX, targetY;

    if (count === 1) {
      targetX = 0;
      targetY = 0;
    } else if (count === 2) {
      targetX = (index === 0 ? -20 : 20);
      targetY = 0;
    } else {
      const angle = (index / 3) * Math.PI * 2 - Math.PI / 2;
      targetX = Math.cos(angle) * 25;
      targetY = Math.sin(angle) * 25;
    }

    const forgePos = forgeState.forgeElement.pos;
    food.use({
      id: 'forgePosition',
      targetX: forgePos.x + targetX,
      targetY: forgePos.y - 40 + targetY,
      update() {
        this.pos.x += (this.targetX - this.pos.x) * 10 * dt();
        this.pos.y += (this.targetY - this.pos.y) * 10 * dt();
        this.scale = vec2(0.5);
      }
    });
  });
}

/**
 * 更新提示文字
 */
function updateHintText() {
  const count = forgeState.collectedFoods.length;
  const max = FORGE_CONFIG.maxFoods;

  if (count >= max) {
    forgeState.hintText.text = '点击合成!';
    forgeState.hintText.color = rgb(255, 200, 100);
  } else {
    forgeState.hintText.text = `拖入 ${max - count} 个食物`;
    forgeState.hintText.color = rgb(200, 190, 180);
  }
}

/**
 * 检查是否可以合成
 */
export function canCraft() {
  return forgeState.collectedFoods.length >= FORGE_CONFIG.minFoods;
}

/**
 * 执行合成
 */
export function craft() {
  if (!canCraft()) {
    return null;
  }

  const foods = [...forgeState.collectedFoods];

  forgeState.collectedFoods.forEach(food => {
    food.destroy();
  });
  forgeState.collectedFoods = [];

  updateHintText();

  return foods;
}

/**
 * 获取已收集的食物列表
 */
export function getCollectedFoods() {
  return forgeState.collectedFoods;
}

/**
 * 获取合成炉配置
 */
export function getForgeConfig() {
  return FORGE_CONFIG;
}

/**
 * 检查点击是否在合成炉区域
 */
export function isClickOnForge(mouse) {
  const forgePos = forgeState.forgeElement?.pos;
  if (!forgePos) return false;

  const distance = Math.sqrt(
    Math.pow(mouse.x - forgePos.x, 2) +
    Math.pow(mouse.y - (forgePos.y - 40), 2)
  );

  return distance < FORGE_CONFIG.furnaceRadius;
}

/**
 * 获取合成炉元素引用
 */
export function getForgeElement() {
  return forgeState.forgeElement;
}