# 智能营销运营工作台 · Marketing Editor

面向房产营销场景的低代码页面搭建项目，使用 React、TypeScript 和 Redux 构建可视化编辑器。通过物料拖拽、属性配置和实时预览组织营销活动页，让运营人员自主配置页面内容，降低重复页面开发带来的研发介入成本。

## 核心设计

以下按项目方案介绍核心问题与设计思路，不作为各项能力的测试报告。

### Schema 驱动与组件协议

营销页面中的 Banner、表单和活动模块需要复用，同时保留灵活的组合方式。相比固定模板，Schema 驱动方案将页面结构与组件实现分离，通过组件协议描述类型、属性及层级关系，由物料注册表衔接配置与渲染，便于标准化接入物料和跨页面复用。

### Redux 画布状态模型

拖拽、选中、属性修改与预览会同时影响页面状态。使用 Redux 组织组件树、选中状态、属性配置和页面 Schema 的数据流，让不同面板围绕统一的状态模型协作，减少多份页面数据分别维护带来的一致性问题。

### dnd-kit 拖拽与层级编排

页面编排既涉及同层排序，也涉及容器嵌套。围绕 dnd-kit 的拖拽事件与碰撞检测组织拖拽生命周期，结合节点层级和插入位置描述移动意图，使新增、排序与嵌套布局使用一致的交互模型。

### Command Pattern 历史管理

全量保存页面快照会随着页面规模和操作次数增加存储开销。命令模式方案将新增、移动、属性修改等用户行为抽象为可逆命令，以执行与撤销逻辑组织历史记录，并通过连续操作合并减少历史噪声，为撤销、重做和状态回滚提供设计基础。

### Hotkeys 与实时预览

复制、删除和撤销属于高频编辑操作，通过 Hotkeys 统一快捷键入口；编辑态与预览态围绕同一份页面 Schema 组织数据同步，使属性配置结果及时反馈到页面展示中。

## 使用流程

1. 在物料面板选择 Banner、文本、表单、活动卡片或容器。
2. 将物料拖入画布，调整顺序与容器层级。
3. 选中节点，在属性面板配置文案、样式与表单字段。
4. 查看实时预览，使用复制、删除、撤销与重做辅助编辑。
5. 保存页面 Schema，或导出 JSON 用于后续恢复与复用。

常用快捷键：`Ctrl/Cmd + C` 复制、`Delete/Backspace` 删除、`Ctrl/Cmd + Z` 撤销、`Ctrl/Cmd + Shift + Z` 重做。

## 技术栈

| 层次 | 技术 |
| --- | --- |
| 页面与类型 | React 18、TypeScript |
| 状态管理 | Redux Toolkit、React Redux |
| 编辑交互 | dnd-kit、Hotkeys |
| UI | Ant Design |
| 构建 | Webpack、Babel、pnpm |
| Schema 服务 | Koa、koa-router、koa-body、本地 JSON 持久化 |

## 快速启动

准备 Node.js 22 和 pnpm；依赖由锁文件安装，仓库不包含 `node_modules`。

```bash
pnpm install --frozen-lockfile
```

### 本地开发

PM2 用于管理前后端开发进程，首次使用需安装：

```bash
npm install -g pm2
npm run dev
```

- 编辑器：<http://localhost:8080/>
- 服务检查：<http://localhost:8081/api>
- Schema 接口：`GET /api/schema`、`POST /api/schema`

```bash
npm run stop                 # 停止本项目的开发进程
pm2 logs marketing-editor-server    # 后端日志
pm2 logs marketing-editor-client    # 前端日志
```

PM2 会在后台托管进程，关闭终端不会自动停止服务。默认端口为前端 8080、后端 8081；启动前应确保端口可用。

保存的页面写入 `package/server/data/editor-schema.json`，该文件属于本地运行数据，不提交到仓库；尚未保存页面时，Schema 接口返回 `schema: null`。

### 构建

分别构建前后端，避免 Windows 环境依赖 `build:all` 中的 Unix 清理命令：

```bash
npm run build:client
npm run build:server
```

构建产物位于 `output/`。构建与启动的实际验证结果见下方说明。

### 验证记录（2026-09-19）

验证环境为 Windows、Node.js 22.20.0。以下构建和启动检查使用本机原有依赖，不代表全新安装已通过。

- 全新安装：在独立目录执行 `pnpm install --frozen-lockfile`，锁文件中的 `registry.npmmirror.com` 下载出现 `ECONNRESET` / `fetch failed`，未完成安装。
- 前端构建：通过；Webpack 提示入口与资源体积超过建议值。
- 后端构建：未通过；当前 TypeScript 4.9.5 与 `@types/node` 25.6.0 的声明不兼容，出现 `Disposable`、`Symbol.dispose` 等类型错误。
- 开发启动：通过；编辑器页面、后端 `/api`、`/api/schema` 及前端 `/api` 代理均返回 HTTP 200。未进行完整交互回归。
- 本机 pnpm 11 对旧依赖目录触发重装确认，因此启动及构建使用 `npm run` 执行现有脚本；迁移没有重建原依赖目录。

## 目录结构

```text
package/
├── client/
│   ├── components/   # 编辑器与预览界面
│   ├── pages/        # 页面入口
│   ├── schemas/      # 组件协议与物料注册
│   ├── store/        # 画布状态管理
│   └── utils/        # 树结构与 ID 工具
└── server/           # Koa 接口与本地持久化
scripts/             # 开发辅助脚本
ecosystem.config.js  # PM2 开发进程配置
```

## License

ISC
