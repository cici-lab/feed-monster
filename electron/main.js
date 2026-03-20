const { app, BrowserWindow } = require('electron');
const path = require('path');

// 判断是否开发模式
const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: '小怪兽投喂',
    icon: path.join(__dirname, '../public/icon.png'),
    backgroundColor: '#1a1a2e',
  });

  if (isDev) {
    // 开发模式：加载 Vite 开发服务器
    win.loadURL('http://localhost:5173');
  } else {
    // 生产模式：加载打包后的文件
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 移除菜单栏（可选）
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
