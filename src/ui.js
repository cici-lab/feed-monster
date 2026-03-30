/**
 * UI 模块
 * 处理分数显示、饱食度条、生命值条、游戏界面元素
 */

let scoreDisplay = null;
let hungerBar = null;
let hungerFill = null;
let healthBar = null;
let healthFill = null;
let comboDisplay = null;

// UI 引用（供其他模块使用）
let uiRefs = null;

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

  // 提示文字
  const hintContainer = add([
    pos(width() - 20, height() - 20),
    anchor('botright'),
    z(30),
    fixed(),
  ]);
  
  hintContainer.add([
    text('拖拽食物到小怪物嘴里投喂！', { size: 14 }),
    color(150, 150, 170),
  ]);

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
  
  // 每帧更新全屏按钮位置
  onUpdate(() => {
    if (fullscreenBtnBg && fullscreenBtnBg.exists()) {
      fullscreenBtnBg.pos.x = width() - 120;
    }
  });
  
  // 全屏按钮文字
  const fullscreenText = fullscreenBtnBg.add([
    text('全屏', { size: 16 }),
    pos(50, 18),
    anchor('center'),
    color(200, 200, 220),
  ]);

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
