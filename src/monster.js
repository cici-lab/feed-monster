/**
 * 小怪物角色模块
 * 负责怪物的创建、状态切换、动画效果
 */

let monsterInstance = null;
let baseY = 0; // 怪物基础 Y 位置

export function createMonster(x, y) {
  baseY = y; // 保存基础位置
  
  // 怪物主体容器
  const monster = add([
    pos(x, y),
    anchor('center'),
    z(5),
    scale(1),
    'monster',
  ]);

  // 当前状态
  let currentState = 'idle';
  let targetScale = 1;
  let eyeAngle = 0;

  // 怪物身体 - 使用程序化绘制
  const monsterBody = monster.add([
    circle(80),
    color(100, 200, 150), // 绿色身体
    anchor('center'),
    z(1),
  ]);

  // 怪物眼睛（左）
  const leftEyeWhite = monster.add([
    circle(20),
    pos(-25, -20),
    color(255, 255, 255),
    anchor('center'),
    z(2),
  ]);
  
  const leftPupil = monster.add([
    circle(10),
    pos(-25, -20),
    color(30, 30, 30),
    anchor('center'),
    z(3),
  ]);

  // 怪物眼睛（右）
  const rightEyeWhite = monster.add([
    circle(20),
    pos(25, -20),
    color(255, 255, 255),
    anchor('center'),
    z(2),
  ]);
  
  const rightPupil = monster.add([
    circle(10),
    pos(25, -20),
    color(30, 30, 30),
    anchor('center'),
    z(3),
  ]);

  // 嘴巴
  const mouth = monster.add([
    rect(40, 20),
    pos(0, 30),
    color(200, 100, 100),
    anchor('center'),
    z(2),
  ]);

  // 眼睛跟随鼠标
  onUpdate(() => {
    const mousePosition = mousePos();
    const monsterPos = monster.pos;

    // 计算鼠标相对于怪物的角度
    const dx = mousePosition.x - monsterPos.x;
    const dy = mousePosition.y - monsterPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 瞳孔偏移（最多偏移8像素）
    const maxOffset = 8;
    const offsetX = (dx / distance) * Math.min(maxOffset, distance / 50);
    const offsetY = (dy / distance) * Math.min(maxOffset, distance / 50);
    
    leftPupil.pos.x = -25 + offsetX;
    leftPupil.pos.y = -20 + offsetY;
    rightPupil.pos.x = 25 + offsetX;
    rightPupil.pos.y = -20 + offsetY;
  });

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
      monster.pos.y = baseY + floatOffset; // 使用 baseY 而不是固定的 y
    }
  });

  // 状态切换方法
  function setIdle() {
    if (currentState === 'idle') return;
    currentState = 'idle';
    monsterBody.color = rgb(100, 200, 150);
    mouth.width = 40;
    mouth.height = 20;
  }

  function setHappy() {
    currentState = 'happy';
    monsterBody.color = rgb(120, 230, 170);
  }

  function setSad() {
    currentState = 'sad';
    monsterBody.color = rgb(80, 150, 120);
    mouth.width = 30;
    mouth.height = 10;
  }

  // 吃东西动画状态
  let eatingAnimPhase = 0;
  let isEatingAnimating = false;
  
  function setEating() {
    if (currentState === 'eating') return;
    currentState = 'eating';
    monsterBody.color = rgb(150, 255, 200);
    eatingAnimPhase = 0;
    isEatingAnimating = true;
  }
  
  // 吃东西动画更新（整合到主 onUpdate 中）
  onUpdate(() => {
    if (!isEatingAnimating) return;
    
    eatingAnimPhase += dt() * 15;
    const mouthHeight = 20 + Math.sin(eatingAnimPhase) * 15;
    mouth.width = 40 + Math.sin(eatingAnimPhase) * 10;
    mouth.height = Math.abs(mouthHeight);
    
    if (eatingAnimPhase > Math.PI * 2) {
      isEatingAnimating = false;
      mouth.width = 40;
      mouth.height = 20;
      setIdle();
    }
  });

  function grow(amount) {
    targetScale = Math.min(3, targetScale + amount);
    
    // 成长特效 - 只用 lifespan 自动销毁，不用 onUpdate
    for (let i = 0; i < 5; i++) {
      add([
        circle(5),
        pos(monster.pos.x + rand(-50, 50), monster.pos.y + rand(-50, 50)),
        color(255, 255, 100),
        opacity(1),
        lifespan(0.5, () => {}), // 自动销毁，无需手动操作
        z(10),
        {
          update() {
            this.pos.y -= 50 * dt();
            this.opacity -= 2 * dt();
          }
        },
      ]);
    }
  }

  // 存储方法到怪物对象
  monster.setIdle = setIdle;
  monster.setHappy = setHappy;
  monster.setSad = setSad;
  monster.setEating = setEating;
  monster.grow = grow;

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
