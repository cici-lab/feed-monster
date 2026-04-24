const { app, BrowserWindow, ipcMain, desktopCapturer, screen, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('path');

// 判断是否开发模式
const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

let mainWindow = null;   // 主游戏窗口
let petWindow = null;    // 桌宠悬浮窗
let tray = null;         // 系统托盘
let currentMode = 'game'; // 'game' | 'pet'

// ============================================================
// 主游戏窗口
// ============================================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: '小怪兽投喂',
    icon: path.join(__dirname, '../public/icon.png'),
    backgroundColor: '#1a1a2e',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.setMenuBarVisibility(false);

  // 点击最小化 → 切换到桌宠模式（minimize 事件触发后立即 restore+hide）
  mainWindow.on('minimize', () => {
    // 先 restore 避免任务栏残留，再 hide
    mainWindow.restore();
    mainWindow.hide();
    switchToPetMode();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================
// 桌宠悬浮窗
// ============================================================
function createPetWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  petWindow = new BrowserWindow({
    width: 320,
    height: 400,
    x: sw - 350,
    y: sh - 440,
    transparent: true,       // 透明背景 - 关键！让桌面透出来
    frame: false,            // 无边框
    alwaysOnTop: 'screen-saver',  // 最高级别置顶，覆盖所有窗口
    resizable: false,
    skipTaskbar: true,       // 不显示在任务栏
    hasShadow: false,
    focusable: true,
    backgroundColor: '#00000000', // 完全透明的背景色（8位16进制，最后两位是alpha）
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    petWindow.loadURL('http://localhost:3000?mode=pet');
  } else {
    petWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { mode: 'pet' }
    });
  }

  petWindow.on('closed', () => {
    petWindow = null;
  });
}

// ============================================================
// 模式切换
// ============================================================
function switchToPetMode() {
  if (currentMode === 'pet') return;
  currentMode = 'pet';

  // 创建桌宠窗口（如果不存在）
  if (!petWindow || petWindow.isDestroyed()) {
    createPetWindow();
  } else {
    petWindow.show();
  }

  // 隐藏主窗口（不销毁，保留游戏状态）
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }

  // 通知桌宠窗口进入桌宠模式
  if (petWindow && !petWindow.isDestroyed()) {
    if (petWindow.webContents.isLoading()) {
      // 还在加载，等加载完再发
      petWindow.webContents.once('did-finish-load', () => {
        if (petWindow && !petWindow.isDestroyed()) {
          petWindow.webContents.send('enter-pet-mode');
        }
      });
    } else {
      // 已加载完毕，直接发
      petWindow.webContents.send('enter-pet-mode');
    }
  }
}

function switchToGameMode() {
  if (currentMode === 'game') return;
  currentMode = 'game';

  // 显示/恢复主窗口
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }

  // 隐藏桌宠窗口
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.hide();
  }

  // 通知主窗口回到游戏模式
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('enter-game-mode');
  }
}

// ============================================================
// 截图功能 - desktopCapturer
// ============================================================

/**
 * 截取屏幕指定区域
 * @param {Object} rect - { x, y, width, height } 屏幕坐标（相对于主显示器）
 * @returns {string} base64 编码的 PNG 图片数据 URL
 */
async function captureScreenRegion(rect) {
  try {
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    const scaleFactor = screen.getPrimaryDisplay().scaleFactor || 1;

    // 获取屏幕截图源
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.round(sw * scaleFactor),
        height: Math.round(sh * scaleFactor),
      },
    });

    if (!sources || sources.length === 0) {
      throw new Error('No screen source found');
    }

    // 取第一个屏幕（主显示器）
    const source = sources[0];
    const fullImg = source.thumbnail; // NativeImage

    // 裁剪到指定区域
    const cropRect = {
      x: Math.round(rect.x * scaleFactor),
      y: Math.round(rect.y * scaleFactor),
      width: Math.max(1, Math.round(rect.width * scaleFactor)),
      height: Math.max(1, Math.round(rect.height * scaleFactor)),
    };

    const cropped = fullImg.crop(cropRect);
    return cropped.toDataURL(); // "data:image/png;base64,..."

  } catch (err) {
    console.error('[Screenshot] Error:', err);
    throw err;
  }
}

/**
 * 截取全屏（用于覆盖层展示给用户框选）
 */
async function captureFullScreen() {
  try {
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    const scaleFactor = screen.getPrimaryDisplay().scaleFactor || 1;

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.round(sw * scaleFactor),
        height: Math.round(sh * scaleFactor),
      },
    });

    if (!sources || sources.length === 0) throw new Error('No source');

    return sources[0].thumbnail.toDataURL();
  } catch (err) {
    console.error('[Screenshot] Full screen error:', err);
    throw err;
  }
}

// ============================================================
// 截图选区窗口（全屏透明遮罩，用于用户框选）
// ============================================================
let overlayWindow = null;

function createOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }

  const { x, y, width, height } = screen.getPrimaryDisplay().bounds;

  overlayWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // 载入选区 HTML（内联）
  const htmlContent = getOverlayHTML();
  overlayWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
  overlayWindow.focus();

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

function getOverlayHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.45);
    cursor: crosshair;
    overflow: hidden;
    user-select: none;
    -webkit-app-region: no-drag;
  }
  #hint {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: rgba(255,255,255,0.85);
    font-size: 22px;
    font-family: sans-serif;
    text-shadow: 0 2px 8px rgba(0,0,0,0.8);
    pointer-events: none;
    text-align: center;
    line-height: 1.6;
  }
  #selection {
    position: fixed;
    border: 2px solid #00e5ff;
    background: rgba(0, 229, 255, 0.12);
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.35);
    display: none;
    pointer-events: none;
  }
</style>
</head>
<body>
  <div id="hint">拖拽框选你要喂给小怪兽的区域<br><small>按 ESC 取消</small></div>
  <div id="selection"></div>
  <script>
    const sel = document.getElementById('selection');
    const hint = document.getElementById('hint');
    let startX = 0, startY = 0, isDown = false;

    document.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      sel.style.display = 'block';
      sel.style.left = startX + 'px';
      sel.style.top = startY + 'px';
      sel.style.width = '0px';
      sel.style.height = '0px';
      hint.style.display = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = Math.min(e.clientX, startX);
      const y = Math.min(e.clientY, startY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);
      sel.style.left = x + 'px';
      sel.style.top = y + 'px';
      sel.style.width = w + 'px';
      sel.style.height = h + 'px';
    });

    document.addEventListener('mouseup', (e) => {
      if (!isDown) return;
      isDown = false;
      const x = Math.min(e.clientX, startX);
      const y = Math.min(e.clientY, startY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);
      // 太小的框选忽略
      if (w < 10 || h < 10) {
        window.electronAPI && window.electronAPI.cancelScreenshot();
        return;
      }
      window.electronAPI && window.electronAPI.confirmScreenshot({ x, y, width: w, height: h });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.electronAPI && window.electronAPI.cancelScreenshot();
      }
    });
  </script>
</body>
</html>`;
}

// ============================================================
// IPC 处理
// ============================================================

// 全屏切换
ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return mainWindow.isFullScreen();
  }
  return false;
});

// 获取全屏状态
ipcMain.handle('is-fullscreen', () => {
  if (mainWindow) return mainWindow.isFullScreen();
  return false;
});

// 切换到桌宠模式
ipcMain.handle('switch-to-pet', () => {
  switchToPetMode();
  return true;
});

// 切换到游戏模式
ipcMain.handle('switch-to-game', () => {
  switchToGameMode();
  return true;
});

// 获取当前模式
ipcMain.handle('get-mode', () => currentMode);

// 获取屏幕尺寸
ipcMain.handle('get-screen-size', () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width, height };
});

// 开始截图：创建选区遮罩窗口
ipcMain.handle('start-screenshot', async (event) => {
  // 先隐藏桌宠窗口（避免截到自己）
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.hide();
  }

  // 短暂等待窗口消失
  await new Promise(r => setTimeout(r, 150));

  createOverlayWindow();
  return true;
});

// 用户确认选区 → 实际截图
ipcMain.handle('confirm-screenshot', async (event, rect) => {
  // 关闭遮罩窗口
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }

  // 短暂等待遮罩消失
  await new Promise(r => setTimeout(r, 100));

  try {
    const dataURL = await captureScreenRegion(rect);

    // 恢复桌宠窗口
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.show();
      petWindow.focus();
      // 把截图结果发给桌宠渲染进程
      petWindow.webContents.send('screenshot-ready', { dataURL, rect });
    }

    return { success: true, dataURL };
  } catch (err) {
    // 恢复桌宠窗口
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.show();
    }
    return { success: false, error: err.message };
  }
});

// 取消截图
ipcMain.handle('cancel-screenshot', () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }
  // 恢复桌宠窗口
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.show();
    petWindow.focus();
  }
  return true;
});

// 移动桌宠窗口（用 on 而不是 handle，单向接收，减少 IPC 往返延迟）
ipcMain.on('move-pet-window', (event, { x, y }) => {
  if (petWindow && !petWindow.isDestroyed()) {
    // setBounds 比 setPosition 更快，因为省去了内部尺寸查询
    const [w, h] = petWindow.getSize();
    petWindow.setBounds({ x: Math.round(x), y: Math.round(y), width: w, height: h }, false);
  }
});

// 获取桌宠窗口位置
ipcMain.handle('get-pet-window-pos', () => {
  if (petWindow && !petWindow.isDestroyed()) {
    const [x, y] = petWindow.getPosition();
    return { x, y };
  }
  return { x: 0, y: 0 };
});

// ============================================================
// 系统托盘
// ============================================================
function createTray() {
  // 使用内置图标（如果没有自定义图标则跳过）
  try {
    const iconPath = path.join(__dirname, '../public/icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath);

    if (trayIcon.isEmpty()) return;

    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    tray.setToolTip('小怪兽投喂');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '截图投喂',
        click: () => {
          if (currentMode === 'pet' && petWindow && !petWindow.isDestroyed()) {
            petWindow.webContents.send('trigger-screenshot');
          }
        }
      },
      {
        label: '返回游戏',
        click: () => switchToGameMode()
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => app.exit(0)
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => switchToGameMode());
  } catch (e) {
    console.warn('[Tray] 创建托盘图标失败:', e.message);
  }
}

// ============================================================
// 全局快捷键
// ============================================================
function registerShortcuts() {
  // Ctrl+Shift+F → 触发截图投喂
  globalShortcut.register('CommandOrControl+Shift+F', () => {
    if (currentMode === 'pet' && petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send('trigger-screenshot');
    }
  });
}

// ============================================================
// App 生命周期
// ============================================================
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.exit(0);
});

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
  if (petWindow && !petWindow.isDestroyed()) petWindow.destroy();
  if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.destroy();
});
