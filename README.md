# 小怪兽投喂 (Monster Feeder)

一个使用 Kaplay 游戏引擎开发的互动小游戏，支持 Electron 桌面应用。玩家通过拖拽食物投喂可爱的小怪兽，收集食材进行合成，解锁各种配方。

## 运行方式

```bash
# 安装依赖
npm install

# 开发模式（浏览器）
npm run dev

# Electron 开发模式
npm run electron:dev

# 打包桌面应用
npm run electron:build
```

## 技术栈

- **游戏引擎**: Kaplay (Kaboom.js fork)
- **构建工具**: Vite
- **桌面框架**: Electron
- **开发语言**: JavaScript (ES6+)
- **UI弹窗**: 原生 HTML/CSS（图鉴、配方面板）

## 已完成功能

### 核心玩法

**小怪兽角色系统**
- 状态切换：待机/开心/伤心/吃东西
- 眼睛跟随鼠标移动
- 成长系统（吃食物后变大）
- 饱食度机制（随时间下降）
- 生命值系统（饱食度过低时减少）

**食物系统**
- 28种食物，6大类别：自然/液体/奇怪/美味/抽象
- 食物从屏幕边缘飘入，带摆动动画
- 彩虹色变化效果
- 不可食用食物的拒绝机制
- 游戏重启时正确清除并重新生成食物

**拖拽交互**
- 拖拽食物到小怪兽投喂
- 投掷力度加成（最高2倍）
- 连击系统
- 拖拽轨迹视觉效果

### 合成系统

- 中世纪魔法炉子 UI（带符文、火焰动画）
- 收集3个食材进行合成
- 10种配方（传说/稀有/普通三个稀有度）
- 配方解锁与进度保存（localStorage）

### UI系统

- 分数显示
- 饱食度进度条（颜色随数值变化）
- 生命值进度条
- 全屏按钮（支持 Electron 和浏览器）
- 右下角操作提示

### 弹窗面板（HTML实现）

**食物图鉴**
- HTML弹窗实现，完美适配各种屏幕
- 分类筛选（全部/自然/液体/奇怪/美味/抽象）
- 滚动浏览所有食材
- 显示食材名称、分数、类别
- 点击遮罩或关闭按钮关闭

**配方面板**
- HTML弹窗实现
- 显示解锁进度
- 已解锁配方：显示名称、分数、食材、描述
- 未解锁配方：显示提示信息
- 滚动浏览所有配方

### 存档系统

- 自动保存最高分
- 保存总投喂次数
- localStorage持久化存储

## 控制台调试 API

打开浏览器开发者工具（F12），使用 `GameDebug` 对象进行调试：

### 游戏状态

```js
GameDebug.getState()           // 获取当前游戏状态
GameDebug.setScore(n)          // 设置分数
GameDebug.addScore(n)          // 增加分数
GameDebug.setHunger(n)         // 设置饱食度 (0-100)
GameDebug.addHunger(n)         // 增加饱食度
GameDebug.setHealth(n)         // 设置生命值 (0-100)
GameDebug.addHealth(n)         // 增加生命值
GameDebug.reduceHealth(n)      // 减少生命值
GameDebug.resetState()         // 重置游戏状态
GameDebug.triggerGameOver()    // 触发游戏结束
```

### 存档操作

```js
GameDebug.save()               // 保存游戏进度
GameDebug.load()               // 加载游戏进度
```

### 食物操作

```js
GameDebug.spawnFood(type)      // 生成指定类型食物
GameDebug.spawnRandomFood()    // 生成随机食物
GameDebug.spawnMultipleFoods(n) // 生成多个食物
GameDebug.getActiveFoods()     // 获取所有活跃食物
GameDebug.clearAllFoods()      // 清除所有食物
GameDebug.listFoodTypes()      // 列出所有食物类型
```

### 怪物操作

```js
GameDebug.getMonster()         // 获取怪物对象
GameDebug.setMonsterState(s)   // 设置状态: idle/happy/sad/eating
GameDebug.growMonster(n)       // 让怪物成长
```

### 合成炉操作

```js
GameDebug.getForgeFoods()      // 获取合成炉中的食物
GameDebug.canCraft()           // 检查是否可以合成
GameDebug.craft()              // 触发合成
```

### 配方操作

```js
GameDebug.listRecipes()        // 列出所有配方
GameDebug.unlockRecipe(id)     // 解锁指定配方
GameDebug.unlockAllRecipes()   // 解锁所有配方
GameDebug.getRecipeProgress()  // 获取解锁进度
```

### UI面板操作

```js
GameDebug.openEncyclopedia()   // 打开图鉴
GameDebug.closeEncyclopedia()  // 关闭图鉴
GameDebug.openRecipePanel()    // 打开配方面板
GameDebug.closeRecipePanel()   // 关闭配方面板
GameDebug.toggleFullscreen()   // 切换全屏
```

### 快捷命令

```js
GameDebug.help()               // 显示帮助信息
GameDebug.test()               // 运行快速测试
GameDebug.demo()               // 演示功能
```

## 按钮与交互 API

### Canvas 按钮（游戏内）

| 按钮 | 位置 | 功能 | 触发条件 |
|------|------|------|----------|
| 全屏按钮 | 右上角 (width-120, 20) | 切换全屏 | onClick |
| 图鉴按钮 | 右上角 (width-130, 70) | 打开图鉴弹窗 | onClick |
| 配方按钮 | 右上角 (width-130, 110) | 打开配方弹窗 | onClick |

### HTML 弹窗 API

**图鉴弹窗**
```js
// 打开/关闭
window.closeEncyclopedia()     // 关闭图鉴（全局函数）
GameDebug.openEncyclopedia()   // 打开图鉴
GameDebug.closeEncyclopedia()  // 关闭图鉴

// DOM 元素
#encyclopedia-modal            // 弹窗容器
#enc-categories                // 分类按钮容器
#enc-list                      // 食物列表容器
#enc-stats                     // 统计信息
```

**配方弹窗**
```js
// 打开/关闭
window.closeRecipePanel()      // 关闭配方（全局函数）
GameDebug.openRecipePanel()    // 打开配方
GameDebug.closeRecipePanel()   // 关闭配方

// DOM 元素
#recipe-modal                  // 弹窗容器
#recipe-list                   // 配方列表容器
#recipe-progress               // 解锁进度
```

## 问题定位指南

### 按钮点击无响应

1. 检查 Canvas 按钮是否被遮挡：
```js
// 获取按钮对象，检查 z 值
GameDebug.help()
```

2. 检查弹窗 DOM 是否存在：
```js
document.getElementById('encyclopedia-modal')  // 应返回 DOM 元素
document.getElementById('recipe-modal')        // 应返回 DOM 元素
```

3. 检查弹窗是否正确显示：
```js
document.querySelector('#encyclopedia-modal.active')  // 打开时应返回元素
```

### 食物不生成

1. 检查活跃食物数量：
```js
GameDebug.getActiveFoods().length  // 应该 >= 0
```

2. 手动生成测试：
```js
GameDebug.spawnRandomFood()  // 应该生成一个食物
```

3. 清除后重新生成：
```js
GameDebug.clearAllFoods()
GameDebug.spawnMultipleFoods(5)
```

### 合成不工作

1. 检查合成炉状态：
```js
GameDebug.getForgeFoods()    // 查看炉中食材
GameDebug.canCraft()         // 检查是否可合成
```

2. 强制合成：
```js
GameDebug.craft()
```

3. 解锁配方测试：
```js
GameDebug.unlockAllRecipes()
GameDebug.openRecipePanel()  // 查看效果
```

## 待开发/可改进

### 游戏内容

- [ ] 多个小怪兽选择系统
  - 不同怪物外观/颜色
  - 不同怪物有独特偏好或技能
- [ ] 每日食材更新机制
  - 每天可获得的食材池刷新
  - 特殊日期限定食材
- [ ] 游戏标题画面
- [ ] 游戏结束条件与结算画面
- [ ] 更多怪物状态/表情
- [ ] 更多合成配方
- [ ] 成就系统

### 用户体验

- [ ] 音效系统（背景音乐、投喂音效、合成音效）
- [ ] 设置面板（音量、画质等）
- [ ] 教程/新手引导

### 技术优化

- [ ] 资源预加载（目前使用程序化绘制）
- [ ] 性能优化（大量粒子时可能卡顿）
- [ ] 多语言支持
- [ ] 移动端适配

## 更新日志

### 2026-03-30

- **重构**: 将图鉴和配方面板从 Canvas 改为 HTML 弹窗实现
  - 解决 Canvas UI 与游戏引擎的适配问题
  - 原生滚动、点击事件更流畅
- **修复**: 图鉴分类按钮点击导致面板关闭的 bug
- **修复**: 滚轮滚动无响应的问题
- **修复**: 列表项超出显示区域的问题
- **修复**: 游戏重启后食物不再飘出的问题
- **新增**: `clearAllActiveFoods()` 函数用于清除所有活跃食物
- **优化**: 删除不再需要的 `panel.js` 公共模块