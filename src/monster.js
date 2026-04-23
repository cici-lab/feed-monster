/**
 * 小怪物角色模块
 * 支持部件化渲染、动画系统、进化系统
 */

import { getCursorPos, takeDamage, heal, cursorState, triggerPulse } from './cursorHealth.js';
import { gameState, updateMonsterMood, triggerFeedFeedback } from './state.js';

let monsterInstance = null;
let baseY = 0;

// 当前选中的怪兽类型
let currentMonsterType = 'default';

/**
 * 怪兽类型配置 - 部件化设计
 */
export const MONSTER_TYPES = {
  // 眼魔 - 多眼怪物
  eyemonster: {
    id: 'eyemonster',
    name: '眼魔',
    description: '以眼球为核心器官，身体各处长满眼睛的诡异生物',
    category: 'weird',
    parts: {
      body: { sprite: 'monsters/eyemonster/body', anchor: 'center', z: 0 },
      coreEye: { sprite: 'monsters/eyemonster/core-eye', anchor: 'center', z: 2, pos: { x: 0, y: -15 } },
      mouth: { 
        closed: { sprite: 'monsters/eyemonster/mouth-closed', anchor: 'center', z: 1, pos: { x: 0, y: 35 } },
        open: { sprite: 'monsters/eyemonster/mouth-open', anchor: 'center', z: 1, pos: { x: 0, y: 40 } }
      },
      tentacles: [
        { sprite: 'monsters/eyemonster/tentacle', anchor: 'top', z: -1, pos: { x: -30, y: 60 }, rotation: -15 },
        { sprite: 'monsters/eyemonster/tentacle', anchor: 'top', z: -1, pos: { x: 30, y: 60 }, rotation: 15 },
      ],
      feet: [
        { sprite: 'monsters/eyemonster/foot', anchor: 'center', z: -2, pos: { x: -25, y: 75 } },
        { sprite: 'monsters/eyemonster/foot', anchor: 'center', z: -2, pos: { x: 25, y: 75 } },
      ],
      subEyes: [
        { sprite: 'monsters/eyemonster/sub-eye', anchor: 'center', z: 3, pos: { x: -40, y: 20 }, scale: 0.8 },
        { sprite: 'monsters/eyemonster/sub-eye', anchor: 'center', z: 3, pos: { x: 40, y: 15 }, scale: 0.7 },
        { sprite: 'monsters/eyemonster/sub-eye', anchor: 'center', z: 3, pos: { x: -25, y: 55 }, scale: 0.6 },
      ]
    },
    animations: {
      breath: { type: 'scale', target: 'body', amplitude: 0.02, speed: 2 },
      pulse: { type: 'scale', target: 'coreEye', amplitude: 0.05, speed: 3 },
      tentacleWave: { type: 'rotate', target: 'tentacles', amplitude: 10, speed: 1.5 },
    },
    specialAbility: 'all_seeing',
    hungerDrain: 1.0,
    growthRate: 1.0,
    preferences: {
      loved: ['weird', 'abstract'],
      hated: ['liquid'],
      hatedFoods: ['dirtyWater', 'mud', 'poison', 'sock', 'eyeball'],
    }
  },
  
  // 史莱姆魔 - 半透明果冻生物
  slimemon: {
    id: 'slimemon',
    name: '史莱姆魔',
    description: '半透明的果冻生物，体内漂浮着星星和气泡',
    category: 'weird',
    parts: {
      body: { sprite: 'monsters/slimemon/body', anchor: 'center', z: 0 },
      coreStar: { sprite: 'monsters/slimemon/core-star', anchor: 'center', z: 2, pos: { x: 0, y: -10 } },
      mouth: { 
        closed: { sprite: 'monsters/slimemon/mouth-closed', anchor: 'center', z: 1, pos: { x: 0, y: 25 } },
        open: { sprite: 'monsters/slimemon/mouth-open', anchor: 'center', z: 1, pos: { x: 0, y: 28 } }
      },
      eyes: [
        { sprite: 'monsters/slimemon/big-eye', anchor: 'center', z: 3, pos: { x: -18, y: -8 }, scale: 0.9 },
        { sprite: 'monsters/slimemon/small-eye', anchor: 'center', z: 3, pos: { x: 22, y: -2 }, scale: 0.75 },
      ],
      floaties: [
        { sprite: 'monsters/slimemon/floatie', anchor: 'center', z: 1, pos: { x: -30, y: -20 }, scale: 0.6 },
        { sprite: 'monsters/slimemon/bone', anchor: 'center', z: 1, pos: { x: 25, y: 15 }, scale: 0.5 },
        { sprite: 'monsters/slimemon/floatie', anchor: 'center', z: 1, pos: { x: -15, y: 20 }, scale: 0.4 },
      ]
    },
    specialAbility: 'jelly_absorb',
    hungerDrain: 0.9,
    growthRate: 1.0,
    preferences: {
      loved: ['liquid', 'nature'],
      hated: ['weird'],
      hatedFoods: ['battery', 'sock', 'key', 'eyeball', 'gunpowder'],
    }
  },
  
  // 幽灵魔 - 漂浮的小幽灵
  ghostmon: {
    id: 'ghostmon',
    name: '幽灵魔',
    description: '漂浮的小幽灵，戴着破旧的巫师帽',
    category: 'weird',
    parts: {
      body: { sprite: 'monsters/ghostmon/body', anchor: 'center', z: 0, pos: { x: 0, y: 10 } },
      witchHat: { sprite: 'monsters/ghostmon/witch-hat', anchor: 'center', z: 4, pos: { x: 5, y: -115 }, scale: 0.8 },
      eye: { sprite: 'monsters/ghostmon/eye', anchor: 'center', z: 2, pos: { x: 0, y: -5 } },
      mouth: { 
        closed: { sprite: 'monsters/ghostmon/mouth-closed', anchor: 'center', z: 1, pos: { x: 0, y: 25 } },
        open: { sprite: 'monsters/ghostmon/mouth-open', anchor: 'center', z: 1, pos: { x: 0, y: 28 } }
      },
      tail: { sprite: 'monsters/ghostmon/tail', anchor: 'top', z: -1, pos: { x: -15, y: 70 }, rotation: 20 },
      sparkles: [
        { sprite: 'monsters/ghostmon/sparkle', anchor: 'center', z: 5, pos: { x: 35, y: -20 }, scale: 0.5 },
        { sprite: 'monsters/ghostmon/sparkle', anchor: 'center', z: 5, pos: { x: -30, y: 30 }, scale: 0.4 },
      ]
    },
    specialAbility: 'recipe_hint',
    hungerDrain: 0.8,
    growthRate: 1.0,
    preferences: {
      loved: ['abstract', 'delicious'],
      hated: ['nature'],
      hatedFoods: ['branch', 'rock', 'leaf', 'mushroom', 'bone'],
    }
  },
  
  // 毛球魔 - 毛茸茸团子
  furballmon: {
    id: 'furballmon',
    name: '毛球魔',
    description: '一团毛茸茸的生物，眼睛和嘴巴从毛里探出来',
    category: 'weird',
    parts: {
      body: { sprite: 'monsters/furballmon/body', anchor: 'center', z: 0 },
      mouth: { 
        closed: { sprite: 'monsters/furballmon/mouth-closed', anchor: 'center', z: 2, pos: { x: 0, y: 28 }, scale: 0.9 },
        open: { sprite: 'monsters/furballmon/mouth-open', anchor: 'center', z: 2, pos: { x: 0, y: 32 }, scale: 0.85 }
      },
      eyes: [
        { sprite: 'monsters/furballmon/big-eye', anchor: 'center', z: 3, pos: { x: -18, y: -15 }, scale: 0.75 },
        { sprite: 'monsters/furballmon/small-eye', anchor: 'center', z: 3, pos: { x: 20, y: -8 }, scale: 0.55 },
      ],
      earTufts: [
        { sprite: 'monsters/furballmon/ear-tuft', anchor: 'bottom', z: 1, pos: { x: -25, y: -55 }, rotation: -15, scale: 0.6 },
        { sprite: 'monsters/furballmon/ear-tuft', anchor: 'bottom', z: 1, pos: { x: 25, y: -55 }, rotation: 15, scale: 0.6 },
      ],
      furStrands: [
        { sprite: 'monsters/furballmon/fur-strand', anchor: 'center', z: 1, pos: { x: -35, y: 0 }, rotation: -30, scale: 0.8 },
        { sprite: 'monsters/furballmon/fur-strand', anchor: 'center', z: 1, pos: { x: 35, y: 5 }, rotation: 30, scale: 0.8 },
      ]
    },
    specialAbility: 'fluffy_eat',
    hungerDrain: 1.1,
    growthRate: 1.0,
    preferences: {
      loved: ['delicious', 'nature'],
      hated: ['weird', 'liquid'],
      hatedFoods: ['dirtyWater', 'mud', 'poison', 'battery', 'sock', 'eyeball'],
    }
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

export function getMonsterType() {
  return currentMonsterType;
}

export function getCurrentMonsterConfig() {
  return MONSTER_TYPES[currentMonsterType] || MONSTER_TYPES.eyemonster;
}

export function loadSavedMonsterType() {
  const saved = localStorage.getItem('selectedMonster');
  if (saved && MONSTER_TYPES[saved]) {
    currentMonsterType = saved;
  }
}

/**
 * 创建怪物 - 部件化版本
 */
export function createMonster(x, y, type = null) {
  baseY = y;
  
  if (type && MONSTER_TYPES[type]) {
    currentMonsterType = type;
  }
  
  const config = MONSTER_TYPES[currentMonsterType] || MONSTER_TYPES.eyemonster;

  // 怪物主体容器
  const monster = add([
    pos(x, y),
    anchor('center'),
    z(5),
    scale(1),
    'monster',
  ]);

  // 存储所有部件引用
  const parts = {};
  let currentState = 'idle';
  let targetScale = 1;
  let animationTime = 0;
  let blinkTimer = 0;
  let isBlinking = false;
  let mouthOpen = false;

  // 判断是旧版单图还是新版部件
  if (config.legacy) {
    // 旧版：单张精灵图
    const spriteObj = monster.add([
      sprite(config.sprite),
      anchor('center'),
      scale(1.2),
      z(1),
    ]);
    parts.sprite = spriteObj;
    
    // 存储当前动画引用
    let currentAnim = null;
    
    // 取消当前动画的辅助函数
    function cancelCurrentAnim() {
      if (currentAnim) {
        currentAnim.cancel();
        currentAnim = null;
      }
    }
    
    // 旧版动画
    let floatTime = 0;
    onUpdate(() => {
      if (currentState === 'idle') {
        floatTime += dt();
        monster.pos.y = baseY + Math.sin(floatTime * 2) * 5;
      }
      
      // 缩放动画
      const currentScale = monster.scale.x;
      const diff = targetScale - currentScale;
      if (Math.abs(diff) > 0.001) {
        monster.scale = vec2(currentScale + diff * 0.1);
      }
    });
    
    // 状态方法
    monster.setIdle = () => { 
      cancelCurrentAnim();
      currentState = 'idle'; 
      spriteObj.color = rgb(255, 255, 255); 
      spriteObj.scale = vec2(1.2);
      updateMonsterMood(gameState.hunger);
    };
    monster.setHappy = () => { 
      cancelCurrentAnim();
      spriteObj.color = rgb(255, 255, 230); 
      spriteObj.scale = vec2(1.25); 
      updateMonsterMood(gameState.hunger);
    };
    monster.setSad = () => { 
      cancelCurrentAnim();
      spriteObj.color = rgb(200, 200, 255); 
      spriteObj.scale = vec2(1.1); 
      updateMonsterMood(gameState.hunger);
    };
    monster.setEating = () => { 
      cancelCurrentAnim();
      spriteObj.color = rgb(255, 255, 220);
      let phase = 0;
      currentAnim = onUpdate(() => {
        phase += dt() * 15;
        spriteObj.scale = vec2(1.2 + Math.sin(phase) * 0.1);
        if (phase > Math.PI * 2) {
          currentAnim.cancel();
          currentAnim = null;
          spriteObj.scale = vec2(1.2);
          monster.setIdle();
        }
      });
    };
    monster.grow = (amount) => {
      targetScale = Math.min(2.5, targetScale + amount);
      createGrowEffect(monster.pos);
    };
    
  } else {
    // 新版：部件化渲染
    createPartMonster(monster, parts, config);
    
    // 主更新循环
    onUpdate(() => {
      animationTime += dt();
      
      // 呼吸动画
      if (parts.body) {
        const breathScale = 1 + Math.sin(animationTime * 2) * 0.02;
        parts.body.scale = vec2(breathScale);
      }
      
      // 核心眼球脉动（眼魔）
      if (parts.coreEye) {
        const pulseScale = 1 + Math.sin(animationTime * 3) * 0.05;
        parts.coreEye.scale = vec2(pulseScale);
      }
      
      // 核心星星脉动（史莱姆魔）
      if (parts.coreStar) {
        const pulseScale = 1 + Math.sin(animationTime * 4) * 0.08;
        parts.coreStar.scale = vec2(pulseScale);
      }
      
      // 漂浮物旋转（史莱姆魔）
      if (parts.floaties) {
        parts.floaties.forEach((f, i) => {
          const basePos = config.parts.floaties[i].pos;
          const angle = animationTime * 0.5 + i * 2;
          const radius = 3;
          f.pos.x = basePos.x + Math.cos(angle) * radius;
          f.pos.y = basePos.y + Math.sin(angle) * radius;
        });
      }
      
      // 巫师帽轻微摆动（幽灵魔）
      if (parts.witchHat) {
        parts.witchHat.angle = Math.sin(animationTime * 1.2) * 3;
      }
      
      // 尾巴飘动（幽灵魔）
      if (parts.tail) {
        const baseAngle = config.parts.tail.rotation || 20;
        parts.tail.angle = baseAngle + Math.sin(animationTime * 2) * 10;
      }
      
      // 星尘闪烁（幽灵魔）
      if (parts.sparkles) {
        parts.sparkles.forEach((s, i) => {
          s.opacity = 0.5 + Math.sin(animationTime * 3 + i) * 0.3;
        });
      }
      
      // 耳朵毛簇摆动（毛球魔）
      if (parts.earTufts) {
        parts.earTufts.forEach((t, i) => {
          const baseRot = config.parts.earTufts[i].rotation;
          t.angle = baseRot + Math.sin(animationTime * 2 + i) * 8;
        });
      }
      
      // 长毛飘动（毛球魔）
      if (parts.furStrands) {
        parts.furStrands.forEach((f, i) => {
          const baseRot = config.parts.furStrands[i].rotation;
          f.angle = baseRot + Math.sin(animationTime * 1.5 + i * 0.5) * 12;
        });
      }
      
      // 触手摆动
      if (parts.tentacles) {
        parts.tentacles.forEach((t, i) => {
          const baseRot = i === 0 ? -15 : 15;
          t.angle = baseRot + Math.sin(animationTime * 1.5 + i) * 10;
        });
      }
      
      // 副眼跟随鼠标（眼魔）
      if (parts.subEyes) {
        const mouse = mousePos();
        const dx = (mouse.x - monster.pos.x) * 0.02;
        const dy = (mouse.y - monster.pos.y) * 0.02;
        parts.subEyes.forEach((eye, i) => {
          const basePos = config.parts.subEyes[i].pos;
          eye.pos.x = basePos.x + dx * (1 - i * 0.2);
          eye.pos.y = basePos.y + dy * (1 - i * 0.2);
        });
      }
      
      // 眼睛跟随鼠标（新怪兽）
      if (parts.eyes) {
        const mouse = mousePos();
        const dx = (mouse.x - monster.pos.x) * 0.015;
        const dy = (mouse.y - monster.pos.y) * 0.015;
        parts.eyes.forEach((eye, i) => {
          const basePos = config.parts.eyes[i].pos;
          eye.pos.x = basePos.x + dx * (1 - i * 0.3);
          eye.pos.y = basePos.y + dy * (1 - i * 0.3);
        });
      }
      
      // 独眼跟随鼠标（幽灵魔）
      if (parts.eye) {
        const mouse = mousePos();
        const dx = (mouse.x - monster.pos.x) * 0.02;
        const dy = (mouse.y - monster.pos.y) * 0.02;
        parts.eye.pos.x = config.parts.eye.pos.x + dx;
        parts.eye.pos.y = config.parts.eye.pos.y + dy;
      }
      
      // 核心眼跟随鼠标（眼魔）
      if (parts.coreEye) {
        const mouse = mousePos();
        const dx = (mouse.x - monster.pos.x) * 0.03;
        const dy = (mouse.y - monster.pos.y) * 0.03;
        parts.coreEye.pos.x = config.parts.coreEye.pos.x + dx;
        parts.coreEye.pos.y = config.parts.coreEye.pos.y + dy;
      }
      
      // 眨眼逻辑
      blinkTimer += dt();
      if (blinkTimer > 3 + Math.random() * 2) {
        triggerBlink();
        blinkTimer = 0;
      }
      
      // 待机浮动
      if (currentState === 'idle') {
        monster.pos.y = baseY + Math.sin(animationTime * 1.5) * 3;
      }
      
      // 缩放动画
      const currentScale = monster.scale.x;
      const diff = targetScale - currentScale;
      if (Math.abs(diff) > 0.001) {
        monster.scale = vec2(currentScale + diff * 0.1);
      }
    });
    
    // 眨眼函数
    function triggerBlink() {
      if (isBlinking) return;
      isBlinking = true;
      
      // 眼魔眨眼
      if (parts.coreEye) {
        const originalScale = parts.coreEye.scale.x;
        let blinkPhase = 0;
        const blinkAnim = onUpdate(() => {
          blinkPhase += dt() * 20;
          const scale = blinkPhase < Math.PI ? 
            originalScale * (1 - Math.sin(blinkPhase) * 0.9) :
            originalScale;
          parts.coreEye.scale = vec2(Math.max(0.1, scale));
          
          if (blinkPhase > Math.PI * 2) {
            blinkAnim.cancel();
            parts.coreEye.scale = vec2(originalScale);
            isBlinking = false;
          }
        });
      }
      
      // 幽灵魔眨眼
      if (parts.eye) {
        const originalScale = parts.eye.scale.x;
        let blinkPhase = 0;
        const blinkAnim = onUpdate(() => {
          blinkPhase += dt() * 20;
          const scale = blinkPhase < Math.PI ? 
            originalScale * (1 - Math.sin(blinkPhase) * 0.9) :
            originalScale;
          parts.eye.scale = vec2(Math.max(0.1, scale));
          
          if (blinkPhase > Math.PI * 2) {
            blinkAnim.cancel();
            parts.eye.scale = vec2(originalScale);
            isBlinking = false;
          }
        });
      }
      
      // 史莱姆魔和毛球魔眨眼（多眼）
      if (parts.eyes) {
        const originalScales = parts.eyes.map(e => e.scale.x);
        let blinkPhase = 0;
        const blinkAnim = onUpdate(() => {
          blinkPhase += dt() * 20;
          parts.eyes.forEach((eye, i) => {
            const scale = blinkPhase < Math.PI ? 
              originalScales[i] * (1 - Math.sin(blinkPhase) * 0.85) :
              originalScales[i];
            eye.scale = vec2(Math.max(0.1, scale));
          });
          
          if (blinkPhase > Math.PI * 2) {
            blinkAnim.cancel();
            parts.eyes.forEach((eye, i) => {
              eye.scale = vec2(originalScales[i]);
            });
            isBlinking = false;
          }
        });
      }
    }
    
    // 状态方法
    monster.setIdle = () => {
      currentState = 'idle';
      setMouthOpen(false);
      updateMonsterMood(gameState.hunger);
    };
    
    monster.setHappy = () => {
      currentState = 'happy';
      setMouthOpen(true);
      updateMonsterMood(gameState.hunger);
      // 跳跃效果
      let jumpPhase = 0;
      const jumpAnim = onUpdate(() => {
        jumpPhase += dt() * 8;
        monster.pos.y = baseY - Math.abs(Math.sin(jumpPhase)) * 20;
        if (jumpPhase > Math.PI * 2) {
          jumpAnim.cancel();
          monster.pos.y = baseY;
          monster.setIdle();
        }
      });
    };
    
    monster.setSad = () => {
      currentState = 'sad';
      setMouthOpen(false);
      updateMonsterMood(gameState.hunger);
      if (parts.coreEye) {
        parts.coreEye.color = rgb(200, 200, 220);
      }
    };
    
    monster.setEating = () => {
      currentState = 'eating';
      let eatPhase = 0;
      const eatAnim = onUpdate(() => {
        eatPhase += dt() * 12;
        setMouthOpen(Math.sin(eatPhase) > 0);
        if (eatPhase > Math.PI * 3) {
          eatAnim.cancel();
          setMouthOpen(false);
          monster.setIdle();
        }
      });
    };
    
    // 恶心动画 - 连续吃厌恶食物时触发
    monster.setDisgust = () => {
      // 防止重复触发
      if (currentState === 'disgust') return;
      
      currentState = 'disgust';
      setMouthOpen(true);
      
      // 保存原始颜色
      const originalColors = {};
      if (parts.body) originalColors.body = parts.body.color ? { r: parts.body.color.r, g: parts.body.color.g, b: parts.body.color.b } : null;
      if (parts.coreEye) originalColors.coreEye = parts.coreEye.color ? { r: parts.coreEye.color.r, g: parts.coreEye.color.g, b: parts.coreEye.color.b } : null;
      if (parts.eye) originalColors.eye = parts.eye.color ? { r: parts.eye.color.r, g: parts.eye.color.g, b: parts.eye.color.b } : null;
      if (parts.eyes) originalColors.eyes = parts.eyes.map(e => e.color ? { r: e.color.r, g: e.color.g, b: e.color.b } : null);
      
      let disgustPhase = 0;
      let isAnimCancelled = false;
      
      const disgustAnim = onUpdate(() => {
        // 安全检查：如果动画已被取消或状态已改变，立即退出
        if (isAnimCancelled || currentState !== 'disgust') {
          disgustAnim.cancel();
          return;
        }
        
        disgustPhase += dt();
        
        // 身体左右摇晃
        const wobble = Math.sin(disgustPhase * 15) * 10;
        monster.angle = wobble;
        
        // 身体轻微下沉
        const squish = 1 + Math.sin(disgustPhase * 10) * 0.05;
        if (parts.body && parts.body.exists()) {
          parts.body.scale = vec2(squish * 1.05, squish * 0.95);
        }
        
        // 身体变绿（恶心色）
        const greenTint = Math.min(1, disgustPhase * 0.5);
        if (parts.body && parts.body.exists() && !originalColors.body) {
          parts.body.color = rgb(180 + greenTint * 20, 200 + greenTint * 30, 180 - greenTint * 40);
        }
        
        // 眼睛变小/眯眼
        if (parts.coreEye && parts.coreEye.exists()) {
          const eyeSquint = 0.6 + Math.sin(disgustPhase * 8) * 0.2;
          parts.coreEye.scale = vec2(eyeSquint);
        }
        if (parts.eye && parts.eye.exists()) {
          const eyeSquint = 0.6 + Math.sin(disgustPhase * 8) * 0.2;
          parts.eye.scale = vec2(eyeSquint);
        }
        if (parts.eyes) {
          parts.eyes.forEach((eye) => {
            if (eye && eye.exists()) {
              const eyeSquint = 0.6 + Math.sin(disgustPhase * 8) * 0.2;
              eye.scale = vec2(eyeSquint);
            }
          });
        }
        
        // 触手/尾巴剧烈摇摆
        if (parts.tentacles) {
          parts.tentacles.forEach((t, i) => {
            if (t && t.exists()) {
              const baseRot = i === 0 ? -15 : 15;
              t.angle = baseRot + Math.sin(disgustPhase * 12 + i) * 25;
            }
          });
        }
        if (parts.tail && parts.tail.exists()) {
          const baseAngle = config.parts.tail.rotation || 20;
          parts.tail.angle = baseAngle + Math.sin(disgustPhase * 15) * 30;
        }
        
        // 毛发炸开（毛球魔）
        if (parts.earTufts) {
          parts.earTufts.forEach((t, i) => {
            if (t && t.exists() && config.parts.earTufts[i]) {
              const baseRot = config.parts.earTufts[i].rotation;
              t.angle = baseRot + Math.sin(disgustPhase * 10 + i) * 20;
              t.scale = vec2(0.7 + Math.sin(disgustPhase * 8) * 0.15);
            }
          });
        }
        if (parts.furStrands) {
          parts.furStrands.forEach((f, i) => {
            if (f && f.exists() && config.parts.furStrands[i]) {
              const baseRot = config.parts.furStrands[i].rotation;
              f.angle = baseRot + Math.sin(disgustPhase * 12 + i * 0.5) * 25;
            }
          });
        }
        
        // 史莱姆魔身体抖动变形
        if (parts.floaties) {
          parts.floaties.forEach((f, i) => {
            if (f && f.exists() && config.parts.floaties[i]) {
              const basePos = config.parts.floaties[i].pos;
              const angle = disgustPhase * 3 + i * 2;
              const radius = 5 + Math.sin(disgustPhase * 5) * 3;
              f.pos.x = basePos.x + Math.cos(angle) * radius;
              f.pos.y = basePos.y + Math.sin(angle) * radius;
            }
          });
        }
        
        // 呕吐粒子效果（降低频率）
        if (Math.random() < 0.1) {
          createVomitParticle(monster.pos.x, monster.pos.y + 30);
        }
        
        // 动画持续1.5秒后结束
        if (disgustPhase > 1.5) {
          isAnimCancelled = true;
          disgustAnim.cancel();
          monster.angle = 0;
          
          // 恢复身体缩放
          if (parts.body && parts.body.exists()) parts.body.scale = vec2(1);
          
          // 恢复眼睛
          if (parts.coreEye && parts.coreEye.exists()) parts.coreEye.scale = vec2(1);
          if (parts.eye && parts.eye.exists()) parts.eye.scale = vec2(1);
          if (parts.eyes) parts.eyes.forEach((eye, i) => {
            if (eye && eye.exists()) {
              const baseScale = config.parts.eyes[i]?.scale || 1;
              eye.scale = vec2(baseScale);
            }
          });
          
          setMouthOpen(false);
          monster.setIdle();
        }
      });
    };
    
    monster.grow = (amount) => {
      targetScale = Math.min(2.5, targetScale + amount);
      createGrowEffect(monster.pos);
    };
    
    // ========== 怪物与鼠标互动 AI ==========
    
    // 互动状态
    let interactionState = 'idle'; // idle, chase, flee, attack, heal
    let interactionTimer = 0;
    let interactionCooldown = 0;
    const INTERACTION_INTERVAL = 3; // 互动检查间隔
    const ATTACK_RANGE = 120;
    const HEAL_RANGE = 100;
    
    // 发射物数组
    const projectiles = [];
    
    // 更新互动 AI
    function updateInteractionAI() {
      if (currentState !== 'idle') return; // 只在空闲状态下互动
      
      interactionTimer += dt();
      interactionCooldown -= dt();
      
      if (interactionTimer < INTERACTION_INTERVAL) return;
      interactionTimer = 0;
      
      // 安全获取鼠标位置
      let cursorPos;
      try {
        cursorPos = getCursorPos();
        if (!cursorPos || typeof cursorPos.x !== 'number' || typeof cursorPos.y !== 'number') {
          return; // 位置无效，跳过本次更新
        }
      } catch (e) {
        return; // 获取位置出错，跳过本次更新
      }
      
      const dx = cursorPos.x - monster.pos.x;
      const dy = cursorPos.y - monster.pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 根据怪物心情决定行为
      const rand = Math.random();
      
      if (gameState.hunger > 70) {
        // 开心状态：追逐或治愈鼠标
        if (rand < 0.4 && distance > 100) {
          startChase(cursorPos);
        } else if (rand < 0.6 && distance < HEAL_RANGE) {
          startHeal(cursorPos);
        }
      } else if (gameState.hunger < 30) {
        // 伤心状态：躲避或攻击鼠标
        if (rand < 0.5) {
          startFlee(cursorPos);
        } else if (rand < 0.7 && distance < ATTACK_RANGE) {
          startAttack(cursorPos);
        }
      } else {
        // 中等状态：随机行为
        if (rand < 0.2 && distance > 150) {
          startChase(cursorPos);
        } else if (rand < 0.3) {
          startFlee(cursorPos);
        }
      }
    }
    
    // 开始追逐鼠标
    function startChase(targetPos) {
      if (interactionCooldown > 0) return;
      interactionState = 'chase';
      interactionCooldown = 2;
      
      showInteractionEmoji('→', monster.pos.x, monster.pos.y - 50, [100, 200, 150]);
      
      const chaseDuration = 1.5;
      let chaseTime = 0;
      let heartTimer = 0; // 爱心生成计时器
      
      const chaseAnim = onUpdate(() => {
        chaseTime += dt();
        if (chaseTime >= chaseDuration || interactionState !== 'chase') {
          chaseAnim.cancel();
          interactionState = 'idle';
          return;
        }
        
        const currentTarget = getCursorPos();
        const dx = currentTarget.x - monster.pos.x;
        const dy = currentTarget.y - monster.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 接近时显示爱心（限制频率）
        heartTimer += dt();
        if (dist < 150 && heartTimer > 0.3) {
          heartTimer = 0;
          createHeartParticle(monster.pos.x, monster.pos.y - 40);
        }
      });
    }
    
    // 开始躲避鼠标
    function startFlee(cursorPos) {
      if (interactionCooldown > 0) return;
      interactionState = 'flee';
      interactionCooldown = 2;
      
      showInteractionEmoji('!', monster.pos.x, monster.pos.y - 50, [255, 150, 100]);
      
      const fleeDuration = 1;
      let fleeTime = 0;
      
      const fleeAnim = onUpdate(() => {
        fleeTime += dt();
        if (fleeTime >= fleeDuration || interactionState !== 'flee') {
          fleeAnim.cancel();
          interactionState = 'idle';
          return;
        }
        // 怪物保持原地，不移动
      });
    }
    
    // 开始攻击鼠标
    function startAttack(targetPos) {
      if (interactionCooldown > 0) return;
      interactionState = 'attack';
      interactionCooldown = 3;
      
      showInteractionEmoji('⚔', monster.pos.x, monster.pos.y - 50, [255, 100, 100]);
      
      // 发射攻击弹幕
      const dx = targetPos.x - monster.pos.x;
      const dy = targetPos.y - monster.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        const dirX = dx / dist;
        const dirY = dy / dist;
        
        // 发射 3 个弹幕
        for (let i = -1; i <= 1; i++) {
          const angle = Math.atan2(dirY, dirX) + i * 0.3;
          const projectile = add([
            circle(8),
            pos(monster.pos.x, monster.pos.y),
            color(255, 100, 100),
            opacity(1),
            z(20),
            'projectile',
          ]);
          
          projectiles.push({
            obj: projectile,
            vx: Math.cos(angle) * 200,
            vy: Math.sin(angle) * 200,
            damage: 15,
            life: 2,
          });
        }
      }
      
      // 攻击结束后恢复 - 使用wait代替setTimeout
      wait(0.5, () => {
        interactionState = 'idle';
      });
    }
    
    // 开始治愈鼠标（舔舐/发射爱心）
    function startHeal(targetPos) {
      if (interactionCooldown > 0) return;
      interactionState = 'heal';
      interactionCooldown = 4;
      
      showInteractionEmoji('♥', monster.pos.x, monster.pos.y - 50, [255, 150, 200]);
      
      // 发射治愈爱心
      const heart = add([
        text('♥', { size: 24 }),
        pos(monster.pos.x, monster.pos.y - 30),
        color(255, 100, 150),
        opacity(1),
        z(20),
        'heart-projectile',
      ]);
      
      const dx = targetPos.x - monster.pos.x;
      const dy = targetPos.y - monster.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        projectiles.push({
          obj: heart,
          vx: (dx / dist) * 120,
          vy: (dy / dist) * 120,
          heal: 10,
          life: 2,
          isHeart: true,
        });
      } else {
        heart.destroy();
      }
      
      // 恢复结束后 - 使用wait代替setTimeout
      wait(0.8, () => {
        interactionState = 'idle';
      });
    }
    
    // 更新发射物
    function updateProjectiles() {
      const cursorPos = getCursorPos();
      
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        
        // 安全检查
        if (!p || !p.obj) {
          projectiles.splice(i, 1);
          continue;
        }
        
        p.life -= dt();
        
        if (p.life <= 0 || !p.obj.exists()) {
          if (p.obj.exists()) p.obj.destroy();
          projectiles.splice(i, 1);
          continue;
        }
        
        // 移动
        p.obj.pos.x += p.vx * dt();
        p.obj.pos.y += p.vy * dt();
        
        // 检测与鼠标碰撞
        const dx = cursorPos.x - p.obj.pos.x;
        const dy = cursorPos.y - p.obj.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 30) {
          if (p.damage) {
            takeDamage(p.damage, 'monster-attack');
            createHitEffect(cursorPos.x, cursorPos.y, [255, 100, 100]);
          } else if (p.heal) {
            heal(p.heal, 'monster-heal');
            createHitEffect(cursorPos.x, cursorPos.y, [100, 255, 150]);
          }
          
          if (p.obj.exists()) p.obj.destroy();
          projectiles.splice(i, 1);
          continue;
        }
        
        // 淡出
        if (p.life < 0.5) {
          p.obj.opacity = p.life * 2;
        }
      }
    }
    
    // 清理发射物
    function cleanupProjectiles() {
      for (const p of projectiles) {
        if (p.obj && p.obj.exists()) {
          p.obj.destroy();
        }
      }
      projectiles.length = 0;
    }
    
    // 添加互动 AI 更新到主循环
    onUpdate(() => {
      updateInteractionAI();
      updateProjectiles();
    });
    
    // 怪物销毁时清理资源
    monster.onDestroy(() => {
      cleanupProjectiles();
    });
    
    // ========== 结束互动 AI ==========
    
    // 嘴巴开关
    function setMouthOpen(open) {
      mouthOpen = open;
      if (parts.mouthClosed) {
        parts.mouthClosed.opacity = open ? 0 : 1;
      }
      if (parts.mouthOpen) {
        parts.mouthOpen.opacity = open ? 1 : 0;
      }
    }
  }
  
  monster.config = config;
  monster.parts = parts;
  monsterInstance = monster;
  return monster;
}

/**
 * 创建部件化怪物
 */
function createPartMonster(monster, parts, config) {
  const partConfigs = config.parts;
  
  // 身体
  if (partConfigs.body) {
    parts.body = monster.add([
      sprite(partConfigs.body.sprite),
      anchor(partConfigs.body.anchor || 'center'),
      pos(partConfigs.body.pos?.x || 0, partConfigs.body.pos?.y || 0),
      z(partConfigs.body.z || 0),
      scale(partConfigs.body.scale || 1),
    ]);
  }
  
  // 核心眼
  if (partConfigs.coreEye) {
    parts.coreEye = monster.add([
      sprite(partConfigs.coreEye.sprite),
      anchor(partConfigs.coreEye.anchor || 'center'),
      pos(partConfigs.coreEye.pos?.x || 0, partConfigs.coreEye.pos?.y || 0),
      z(partConfigs.coreEye.z || 2),
      scale(partConfigs.coreEye.scale || 1),
    ]);
  }
  
  // 核心星星（史莱姆魔）
  if (partConfigs.coreStar) {
    parts.coreStar = monster.add([
      sprite(partConfigs.coreStar.sprite),
      anchor(partConfigs.coreStar.anchor || 'center'),
      pos(partConfigs.coreStar.pos?.x || 0, partConfigs.coreStar.pos?.y || 0),
      z(partConfigs.coreStar.z || 2),
      scale(partConfigs.coreStar.scale || 1),
    ]);
  }
  
  // 独眼（幽灵魔）
  if (partConfigs.eye) {
    parts.eye = monster.add([
      sprite(partConfigs.eye.sprite),
      anchor(partConfigs.eye.anchor || 'center'),
      pos(partConfigs.eye.pos?.x || 0, partConfigs.eye.pos?.y || 0),
      z(partConfigs.eye.z || 2),
      scale(partConfigs.eye.scale || 1),
    ]);
  }
  
  // 巫师帽（幽灵魔）
  if (partConfigs.witchHat) {
    parts.witchHat = monster.add([
      sprite(partConfigs.witchHat.sprite),
      anchor(partConfigs.witchHat.anchor || 'center'),
      pos(partConfigs.witchHat.pos?.x || 0, partConfigs.witchHat.pos?.y || 0),
      z(partConfigs.witchHat.z || 4),
      scale(partConfigs.witchHat.scale || 1),
      rotate(partConfigs.witchHat.rotation || 0),
    ]);
  }
  
  // 尾巴/飘带
  if (partConfigs.tail) {
    parts.tail = monster.add([
      sprite(partConfigs.tail.sprite),
      anchor(partConfigs.tail.anchor || 'top'),
      pos(partConfigs.tail.pos?.x || 0, partConfigs.tail.pos?.y || 0),
      z(partConfigs.tail.z || -1),
      rotate(partConfigs.tail.rotation || 0),
      scale(partConfigs.tail.scale || 1),
    ]);
  }
  
  // 嘴巴（闭）
  if (partConfigs.mouth?.closed) {
    parts.mouthClosed = monster.add([
      sprite(partConfigs.mouth.closed.sprite),
      anchor(partConfigs.mouth.closed.anchor || 'center'),
      pos(partConfigs.mouth.closed.pos?.x || 0, partConfigs.mouth.closed.pos?.y || 0),
      z(partConfigs.mouth.closed.z || 1),
      scale(partConfigs.mouth.closed.scale || 1),
    ]);
  }
  
  // 嘴巴（开）
  if (partConfigs.mouth?.open) {
    parts.mouthOpen = monster.add([
      sprite(partConfigs.mouth.open.sprite),
      anchor(partConfigs.mouth.open.anchor || 'center'),
      pos(partConfigs.mouth.open.pos?.x || 0, partConfigs.mouth.open.pos?.y || 0),
      z(partConfigs.mouth.open.z || 1),
      scale(partConfigs.mouth.open.scale || 1),
      opacity(0),
    ]);
  }
  
  // 触手
  if (partConfigs.tentacles) {
    parts.tentacles = [];
    partConfigs.tentacles.forEach(t => {
      const tentacle = monster.add([
        sprite(t.sprite),
        anchor(t.anchor || 'top'),
        pos(t.pos?.x || 0, t.pos?.y || 0),
        z(t.z || -1),
        rotate(t.rotation || 0),
        scale(t.scale || 1),
      ]);
      parts.tentacles.push(tentacle);
    });
  }
  
  // 脚
  if (partConfigs.feet) {
    parts.feet = [];
    partConfigs.feet.forEach(f => {
      const foot = monster.add([
        sprite(f.sprite),
        anchor(f.anchor || 'center'),
        pos(f.pos?.x || 0, f.pos?.y || 0),
        z(f.z || -2),
        scale(f.scale || 1),
      ]);
      parts.feet.push(foot);
    });
  }
  
  // 副眼
  if (partConfigs.subEyes) {
    parts.subEyes = [];
    partConfigs.subEyes.forEach(e => {
      const eye = monster.add([
        sprite(e.sprite),
        anchor(e.anchor || 'center'),
        pos(e.pos?.x || 0, e.pos?.y || 0),
        z(e.z || 3),
        scale(e.scale || 1),
      ]);
      parts.subEyes.push(eye);
    });
  }
  
  // 眼睛（新怪兽用）
  if (partConfigs.eyes) {
    parts.eyes = [];
    partConfigs.eyes.forEach(e => {
      const eye = monster.add([
        sprite(e.sprite),
        anchor(e.anchor || 'center'),
        pos(e.pos?.x || 0, e.pos?.y || 0),
        z(e.z || 3),
        scale(e.scale || 1),
      ]);
      parts.eyes.push(eye);
    });
  }
  
  // 漂浮物（史莱姆魔）
  if (partConfigs.floaties) {
    parts.floaties = [];
    partConfigs.floaties.forEach(f => {
      const floatie = monster.add([
        sprite(f.sprite),
        anchor(f.anchor || 'center'),
        pos(f.pos?.x || 0, f.pos?.y || 0),
        z(f.z || 1),
        scale(f.scale || 1),
      ]);
      parts.floaties.push(floatie);
    });
  }
  
  // 星尘/火花（幽灵魔）
  if (partConfigs.sparkles) {
    parts.sparkles = [];
    partConfigs.sparkles.forEach(s => {
      const sparkle = monster.add([
        sprite(s.sprite),
        anchor(s.anchor || 'center'),
        pos(s.pos?.x || 0, s.pos?.y || 0),
        z(s.z || 5),
        scale(s.scale || 1),
      ]);
      parts.sparkles.push(sparkle);
    });
  }
  
  // 耳朵毛簇（毛球魔）
  if (partConfigs.earTufts) {
    parts.earTufts = [];
    partConfigs.earTufts.forEach(t => {
      const tuft = monster.add([
        sprite(t.sprite),
        anchor(t.anchor || 'bottom'),
        pos(t.pos?.x || 0, t.pos?.y || 0),
        z(t.z || 1),
        rotate(t.rotation || 0),
        scale(t.scale || 1),
      ]);
      parts.earTufts.push(tuft);
    });
  }
  
  // 飘动的长毛（毛球魔）
  if (partConfigs.furStrands) {
    parts.furStrands = [];
    partConfigs.furStrands.forEach(f => {
      const strand = monster.add([
        sprite(f.sprite),
        anchor(f.anchor || 'center'),
        pos(f.pos?.x || 0, f.pos?.y || 0),
        z(f.z || 1),
        rotate(f.rotation || 0),
        scale(f.scale || 1),
      ]);
      parts.furStrands.push(strand);
    });
  }
}

/**
 * 成长特效
 */
function createGrowEffect(position) {
  // 粒子效果
  for (let i = 0; i < 8; i++) {
    add([
      circle(6),
      pos(position.x + rand(-60, 60), position.y + rand(-60, 60)),
      color(255, 80, 80),
      opacity(1),
      lifespan(0.6),
      z(10),
      {
        update() {
          this.pos.y -= 60 * dt();
        }
      },
    ]);
  }
  
  // 星星特效
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    add([
      circle(4),
      pos(position.x + Math.cos(angle) * 80, position.y + Math.sin(angle) * 80),
      color(255, 100, 100),
      opacity(1),
      lifespan(0.5),
      z(10),
      {
        update() {
          this.pos.x += Math.cos(angle) * 30 * dt();
          this.pos.y += Math.sin(angle) * 30 * dt();
        }
      },
    ]);
  }
}

/**
 * 呕吐粒子效果 - 恶心动画时使用
 */
function createVomitParticle(x, y) {
  // 绿色气泡
  add([
    circle(rand(3, 7)),
    pos(x + rand(-15, 15), y),
    color(100, 180 + rand(0, 50), 100),
    opacity(0.7),
    lifespan(0.6),
    z(15),
    {
      update() {
        this.pos.y -= 40 * dt();
        this.pos.x += rand(-20, 20) * dt();
        this.opacity -= 0.3 * dt();
      }
    },
  ]);
}

/**
 * 显示互动表情符号
 */
function showInteractionEmoji(emoji, x, y, tint) {
  add([
    text(emoji, { size: 24 }),
    pos(x, y),
    anchor('center'),
    color(tint[0], tint[1], tint[2]),
    opacity(1),
    lifespan(1),
    z(25),
    {
      update() {
        this.pos.y -= 30 * dt();
        this.opacity -= dt();
      }
    },
  ]);
}

/**
 * 创建爱心粒子
 */
function createHeartParticle(x, y) {
  add([
    text('♥', { size: 16 }),
    pos(x + rand(-20, 20), y + rand(-10, 10)),
    anchor('center'),
    color(255, 100 + rand(0, 100), 150),
    opacity(1),
    lifespan(0.8),
    z(20),
    {
      update() {
        this.pos.y -= 50 * dt();
        this.opacity -= dt() * 1.25;
      }
    },
  ]);
}

/**
 * 创建命中特效
 */
function createHitEffect(x, y, tint) {
  // 粒子爆发
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const speed = rand(80, 150);
    
    add([
      circle(rand(3, 6)),
      pos(x, y),
      color(tint[0], tint[1], tint[2]),
      opacity(1),
      lifespan(0.4),
      z(20),
      {
        update() {
          this.pos.x += Math.cos(angle) * speed * dt();
          this.pos.y += Math.sin(angle) * speed * dt();
          this.opacity -= dt() * 2.5;
        }
      },
    ]);
  }
  
  // 命中闪光
  add([
    circle(20),
    pos(x, y),
    color(tint[0], tint[1], tint[2]),
    opacity(0.5),
    anchor('center'),
    z(19),
    {
      life: 0.2,
      update() {
        this.life -= dt();
        this.scale = vec2(1 + (0.2 - this.life) * 3);
        this.opacity = this.life * 2.5;
        if (this.life <= 0) {
          this.destroy();
        }
      }
    },
  ]);
}

export function getMonster() {
  return monsterInstance;
}

export function updateMonsterPosition(x, y) {
  if (monsterInstance) {
    baseY = y;
    monsterInstance.pos.x = x;
    monsterInstance.pos.y = y;
  }
}
