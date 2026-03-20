const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 判断是否开发模式
const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

let mainWindow = null;

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
    // 开发模式：加载 Vite 开发服务器
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // 生产模式：加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 移除菜单栏（可选）
  mainWindow.setMenuBarVisibility(false);

  // 窗口关闭时清理引用
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 全屏切换 IPC 处理
ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return mainWindow.isFullScreen();
  }
  return false;
});

// 获取全屏状态
ipcMain.handle('is-fullscreen', () => {
  if (mainWindow) {
    return mainWindow.isFullScreen();
  }
  return false;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时强制退出应用
app.on('window-all-closed', () => {
  // 强制退出，包括 macOS
  app.exit(0);
});

// 确保应用退出前清理
app.on('before-quit', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});
