const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── 全屏 ──────────────────────────────────────
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),

  // ── 窗口操作 ─────────────────────────────────
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // ── 模式切换 ──────────────────────────────────
  switchToPet: () => ipcRenderer.invoke('switch-to-pet'),
  switchToGame: () => ipcRenderer.invoke('switch-to-game'),
  getMode: () => ipcRenderer.invoke('get-mode'),

  // ── 屏幕信息 ──────────────────────────────────
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),

  // ── 截图流程 ──────────────────────────────────
  /** 第一步：隐藏桌宠窗口，弹出选区遮罩 */
  startScreenshot: () => ipcRenderer.invoke('start-screenshot'),

  /** 第二步（由 overlay 调用）：用户确认选区 → 实际截图 → 返回 dataURL */
  confirmScreenshot: (rect) => ipcRenderer.invoke('confirm-screenshot', rect),

  /** 取消截图（overlay 或渲染进程调用） */
  cancelScreenshot: () => ipcRenderer.invoke('cancel-screenshot'),

  // ── 桌宠窗口位置 ──────────────────────────────
  /** 移动桌宠窗口（单向 send，不等返回，降低延迟） */
  movePetWindow: (pos) => ipcRenderer.send('move-pet-window', pos),
  /** 获取桌宠窗口位置（仅初始化时用） */
  getPetWindowPos: () => ipcRenderer.invoke('get-pet-window-pos'),

  // ── 主进程 → 渲染进程消息监听 ────────────────
  /** 收到截图结果（桌宠窗口用） */
  onScreenshotReady: (callback) => {
    ipcRenderer.on('screenshot-ready', (event, data) => callback(data));
  },

  /** 主进程通知：进入桌宠模式 */
  onEnterPetMode: (callback) => {
    ipcRenderer.on('enter-pet-mode', () => callback());
  },

  /** 主进程通知：进入游戏模式 */
  onEnterGameMode: (callback) => {
    ipcRenderer.on('enter-game-mode', () => callback());
  },

  /** 主进程通知：触发截图（快捷键 / 托盘菜单） */
  onTriggerScreenshot: (callback) => {
    ipcRenderer.on('trigger-screenshot', () => callback());
  },

  /** 移除所有监听（页面卸载时用） */
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
