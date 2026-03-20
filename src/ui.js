/**
 * UI 模块
 * 处理分数显示、饱食度条、游戏界面元素
 */

let scoreDisplay = null;
let hungerBar = null;
let hungerFill = null;
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

  function updateCombo(combo) {
    if (comboDisplay) {
      if (combo > 1) {
        comboDisplay.text = `${combo}x 连击!`;
        comboDisplay.opacity = 1;
      }
    }
  }

  // 保存引用
  uiRefs = {
    updateScore,
    updateHunger,
    updateCombo,
    fullscreenBtnBg,
    fullscreenText,
  };

  return uiRefs;
}

// 获取 UI 引用
export function getUIRefs() {
  return uiRefs;
}

// ESC 键退出全屏
export function initFullscreenControls() {
  onKeyPress('escape', () => {
    if (isFullscreen()) {
      setFullscreen(false);
      if (uiRefs && uiRefs.fullscreenText) {
        uiRefs.fullscreenText.text = '全屏';
      }
    }
  });
}

// 创建游戏标题画面（可选）
export function createTitleScreen() {
  add([
    text('小怪兽投喂', { size: 64 }),
    pos(center()),
    anchor('center'),
    color(100, 200, 150),
    z(100),
  ]);
  
  add([
    text('点击任意位置开始', { size: 24 }),
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
}

// 创建游戏结束画面（可选）
export function createGameOverScreen(finalScore) {
  add([
    rect(width(), height()),
    color(0, 0, 0),
    opacity(0.7),
    z(50),
  ]);
  
  add([
    text('游戏结束', { size: 48 }),
    pos(center().x, center().y - 50),
    anchor('center'),
    color(255, 100, 100),
    z(51),
  ]);
  
  add([
    text(`最终得分: ${finalScore}`, { size: 32 }),
    pos(center().x, center().y + 20),
    anchor('center'),
    color(255, 255, 100),
    z(51),
  ]);
  
  add([
    text('点击重新开始', { size: 20 }),
    pos(center().x, center().y + 80),
    anchor('center'),
    color(200, 200, 200),
    z(51),
  ]);
}