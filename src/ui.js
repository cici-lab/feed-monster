/**
 * UI 模块
 * 处理分数显示、饱食度条、生命值条、游戏界面元素
 */

import { showMonsterSelect } from './monsterSelect.js';
import { setMonsterType } from './monster.js';
import { cursorState } from './cursorHealth.js';

let scoreDisplay = null;
let hungerBar = null;
let hungerFill = null;
let healthBar = null;
let healthFill = null;
let comboDisplay = null;

// UI 引用（供其他模块使用）
let uiRefs = null;

// 返回选择按钮回调
let onSelectMonsterCallback = null;

// 设置返回选择按钮的回调
export function setOnSelectMonsterCallback(callback) {
  onSelectMonsterCallback = callback;
}

export function createUI(state) {
  // 顶部 UI 容器
  const uiContainer = add([
    pos(20, 20),
    z(30),
    fixed(), // 固定位置，不受相机影响
  ]);

  // 分数显示
  const scoreLabel = uiContainer.add([
    text('分数', { size: 16 }),
    pos(0, 0),
    color(200, 200, 200),
  ]);
  
  scoreDisplay = uiContainer.add([
    text('0', { size: 32, font: 'monospace' }),
    pos(0, 20),
    color(255, 255, 100),
  ]);

  // 饱食度容器
  const hungerContainer = uiContainer.add([
    pos(0, 70),
  ]);
  
  hungerContainer.add([
    text('饱食度', { size: 16 }),
    pos(0, 0),
    color(200, 200, 200),
  ]);
  
  // 饱食度背景条
  hungerBar = hungerContainer.add([
    rect(200, 24),
    pos(0, 25),
    color(50, 50, 70),
    outline(2, rgb(100, 100, 120)),
  ]);

  // 饱食度填充
  hungerFill = hungerContainer.add([
    rect(state.hunger * 2, 20),
    pos(2, 27),
    color(100, 200, 100),
  ]);

  // 饱食度百分比文字
  const hungerText = hungerContainer.add([
    text(`${Math.floor(state.hunger)}%`, { size: 14 }),
    pos(210, 28),
    color(200, 200, 200),
  ]);

  // 生命值容器
  const healthContainer = uiContainer.add([
    pos(0, 130),
  ]);
  
  healthContainer.add([
    text('生命值', { size: 16 }),
    pos(0, 0),
    color(200, 200, 200),
  ]);
  
  // 生命值背景条
  healthBar = healthContainer.add([
    rect(200, 24),
    pos(0, 25),
    color(50, 50, 70),
    outline(2, rgb(120, 100, 100)),
  ]);

  // 生命值填充
  healthFill = healthContainer.add([
    rect(state.health * 2, 20),
    pos(2, 27),
    color(230, 80, 80),
  ]);

  // 生命值百分比文字
  const healthText = healthContainer.add([
    text(`${Math.floor(state.health)}%`, { size: 14 }),
    pos(210, 28),
    color(200, 200, 200),
  ]);

  // 返回选择按钮背景
  const backBtnBg = add([
    rect(110, 36),
    pos(20, height() - 56),
    anchor('topleft'),
    color(60, 80, 60),
    outline(2, rgb(100, 140, 100)),
    z(30),
    fixed(),
    area(),
  ]);
  
  // 返回选择按钮文字
  const backBtnText = backBtnBg.add([
    text('换只怪兽', { size: 16 }),
    pos(55, 18),
    anchor('center'),
    color(200, 230, 200),
  ]);
  
  // 返回选择按钮悬停效果
  backBtnBg.onHover(() => {
    backBtnBg.color = rgb(80, 100, 80);
  });
  backBtnBg.onHoverEnd(() => {
    backBtnBg.color = rgb(60, 80, 60);
  });
  
  // 返回选择按钮点击
  backBtnBg.onClick(() => {
    // 直接显示怪兽选择界面，不跳转到标题界面
    showMonsterSelect((selectedMonsterId) => {
      setMonsterType(selectedMonsterId);
      go('game');
    });
  });

  // 全屏按钮背景
  const fullscreenBtnBg = add([
    rect(100, 36),
    pos(width() - 120, 20),
    anchor('topleft'),
    color(60, 60, 90),
    outline(2, rgb(100, 100, 140)),
    z(30),
    fixed(),
  ]);
  
  // 每帧更新按钮位置
  onUpdate(() => {
    if (fullscreenBtnBg && fullscreenBtnBg.exists()) {
      fullscreenBtnBg.pos.x = width() - 120;
    }
    if (backBtnBg && backBtnBg.exists()) {
      backBtnBg.pos.y = height() - 56;
    }
  });
  
  // 全屏按钮文字
  const fullscreenText = fullscreenBtnBg.add([
    text('全屏', { size: 16 }),
    pos(50, 18),
    anchor('center'),
    color(200, 200, 220),
  ]);

  // ========== 鼠标血量 UI ==========
  
  // 鼠标血量容器 - 右下角
  const cursorHealthContainer = add([
    pos(width() - 230, height() - 100),
    z(30),
    fixed(),
  ]);
  
  cursorHealthContainer.add([
    text('鼠标能量', { size: 14 }),
    pos(0, 0),
    color(180, 200, 180),
  ]);
  
  // 鼠标血量背景条
  const cursorHealthBar = cursorHealthContainer.add([
    rect(200, 20),
    pos(0, 20),
    color(40, 40, 60),
    outline(2, rgb(80, 120, 100)),
  ]);
  
  // 鼠标血量填充
  const cursorHealthFill = cursorHealthContainer.add([
    rect(200, 16),
    pos(2, 22),
    color(100, 220, 150),
  ]);
  
  // 鼠标血量百分比文字
  const cursorHealthText = cursorHealthContainer.add([
    text('100%', { size: 12 }),
    pos(210, 22),
    color(200, 200, 200),
  ]);
  
  // 鼠标血量状态指示
  const cursorStateText = cursorHealthContainer.add([
    text('', { size: 10 }),
    pos(100, 45),
    anchor('center'),
    color(150, 150, 180),
  ]);
  
  // 更新鼠标血量显示
  onUpdate(() => {
    // 更新容器位置
    cursorHealthContainer.pos.x = width() - 230;
    cursorHealthContainer.pos.y = height() - 100;
    
    // 更新血量条
    const healthPercent = cursorState.health / cursorState.maxHealth;
    const barWidth = Math.max(0, healthPercent * 196);
    cursorHealthFill.width = barWidth;
    
    // 根据血量改变颜色
    if (cursorState.isWeak) {
      cursorHealthFill.color = rgb(150, 100, 180);
    } else if (healthPercent > 0.6) {
      cursorHealthFill.color = rgb(100, 220, 150);
    } else if (healthPercent > 0.3) {
      cursorHealthFill.color = rgb(220, 200, 80);
    } else {
      cursorHealthFill.color = rgb(220, 80, 80);
    }
    
    // 更新百分比文字
    cursorHealthText.text = `${Math.floor(cursorState.health)}%`;
    
    // 更新状态指示
    if (cursorState.isWeak) {
      cursorStateText.text = '⚠ 虚弱状态';
      cursorStateText.color = rgb(150, 100, 180);
    } else if (healthPercent < 0.3) {
      cursorStateText.text = '⚠ 能量不足';
      cursorStateText.color = rgb(220, 80, 80);
    } else if (healthPercent > 0.8) {
      cursorStateText.text = '✓ 能量充沛';
      cursorStateText.color = rgb(100, 200, 150);
    } else {
      cursorStateText.text = '';
    }
  });
  
  // ========== 结束鼠标血量 UI ==========

  // 更新函数
  function updateScore(score) {
    if (scoreDisplay) {
      scoreDisplay.text = score.toString();
    }
  }

  function updateHunger(hunger) {
    if (hungerFill) {
      const barWidth = Math.max(0, hunger * 2);
      hungerFill.width = barWidth;
      
      // 根据饱食度改变颜色
      if (hunger > 70) {
        hungerFill.color = rgb(100, 230, 100);
      } else if (hunger > 40) {
        hungerFill.color = rgb(230, 200, 50);
      } else if (hunger > 20) {
        hungerFill.color = rgb(230, 130, 50);
      } else {
        hungerFill.color = rgb(230, 60, 60);
      }
    }
    
    if (hungerText) {
      hungerText.text = `${Math.floor(hunger)}%`;
    }
  }

  function updateHealth(health) {
    if (healthFill) {
      const barWidth = Math.max(0, health * 2);
      healthFill.width = barWidth;
      
      // 根据生命值改变颜色
      if (health > 70) {
        healthFill.color = rgb(100, 230, 100);
      } else if (health > 40) {
        healthFill.color = rgb(230, 200, 50);
      } else if (health > 20) {
        healthFill.color = rgb(230, 130, 50);
      } else {
        healthFill.color = rgb(230, 60, 60);
      }
    }
    
    if (healthText) {
      healthText.text = `${Math.floor(health)}%`;
    }
  }

  function updateCombo(combo) {
    if (comboDisplay) {
      if (combo > 1) {
        comboDisplay.text = `${combo}x 连击!`;
        comboDisplay.opacity = 1;
      }
    }
  }

  // 更新全屏按钮位置（窗口大小变化时调用）
  function updateFullscreenBtnPos() {
    if (fullscreenBtnBg) {
      fullscreenBtnBg.pos.x = width() - 120;
    }
  }

  // 保存引用
  uiRefs = {
    updateScore,
    updateHunger,
    updateHealth,
    updateCombo,
    fullscreenBtnBg,
    fullscreenText,
    updateFullscreenBtnPos,
    backBtnBg,
    backBtnText,
  };

  return uiRefs;
}

// 获取 UI 引用
export function getUIRefs() {
  return uiRefs;
}

// ESC 键退出全屏
export async function initFullscreenControls() {
  onKeyPress('escape', async () => {
    let isFull;
    if (window.electronAPI) {
      isFull = await window.electronAPI.isFullscreen();
      if (isFull) {
        await window.electronAPI.toggleFullscreen();
        if (uiRefs && uiRefs.fullscreenText) {
          uiRefs.fullscreenText.text = '全屏';
        }
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        if (uiRefs && uiRefs.fullscreenText) {
          uiRefs.fullscreenText.text = '全屏';
        }
      }
    }
  });
}

// 创建游戏标题画面
export function createTitleScreen(highScore) {
  // 背景
  add([
    rect(width(), height()),
    color(26, 26, 46),
    z(0),
    fixed(),
  ]);
  
  // 标题
  add([
    text('小怪兽投喂', { size: 64 }),
    pos(center().x, center().y - 80),
    anchor('center'),
    color(100, 200, 150),
    z(100),
  ]);
  
  // 最高分
  if (highScore > 0) {
    add([
      text(`最高分: ${highScore}`, { size: 24 }),
      pos(center().x, center().y),
      anchor('center'),
      color(255, 215, 0),
      z(100),
    ]);
  }
  
  // 开始提示
  add([
    text('点击任意位置开始游戏', { size: 24 }),
    pos(center().x, center().y + 80),
    anchor('center'),
    color(200, 200, 200),
    z(100),
    opacity(),
    'start-hint',
  ]);
  
  // 闪烁效果
  onUpdate('start-hint', (hint) => {
    hint.opacity = 0.5 + Math.sin(time() * 4) * 0.5;
  });
  
  // 操作说明
  add([
    text('拖拽食物投喂小怪兽 | 收集食材合成配方', { size: 16 }),
    pos(center().x, center().y + 140),
    anchor('center'),
    color(150, 150, 170),
    z(100),
  ]);
}

// 创建游戏结束画面
export function createGameOverScreen(finalScore, highScore) {
  // 遮罩
  add([
    rect(width(), height()),
    color(0, 0, 0),
    opacity(0.8),
    z(50),
    fixed(),
  ]);
  
  // 游戏结束标题
  add([
    text('游戏结束', { size: 48 }),
    pos(center().x, center().y - 80),
    anchor('center'),
    color(255, 100, 100),
    z(51),
  ]);
  
  // 最终得分
  add([
    text(`最终得分: ${finalScore}`, { size: 32 }),
    pos(center().x, center().y - 20),
    anchor('center'),
    color(255, 255, 100),
    z(51),
  ]);
  
  // 新纪录提示
  if (finalScore >= highScore && finalScore > 0) {
    add([
      text('新纪录!', { size: 28 }),
      pos(center().x, center().y + 30),
      anchor('center'),
      color(255, 215, 0),
      z(51),
    ]);
  }
  
  // 最高分
  add([
    text(`最高分: ${highScore}`, { size: 20 }),
    pos(center().x, center().y + 70),
    anchor('center'),
    color(200, 200, 200),
    z(51),
  ]);
  
  // 重新开始提示
  add([
    text('点击任意位置重新开始', { size: 20 }),
    pos(center().x, center().y + 120),
    anchor('center'),
    color(200, 200, 200),
    z(51),
    opacity(),
    'restart-hint',
  ]);
  
  // 闪烁效果
  onUpdate('restart-hint', (hint) => {
    hint.opacity = 0.5 + Math.sin(time() * 4) * 0.5;
  });
}
