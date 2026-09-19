/**
 * PM2 统一托管配置（开发环境）
 *
 * 两个应用：
 *   - marketing-editor-server : Koa 后端，端口 8081，ts-node 直跑 TS 源码，pm2 watch 热重启
 *   - marketing-editor-client : webpack-dev-server 前端，端口 8080，HMR 由自身负责，不开 pm2 watch
 *
 * 启动：  pm2 start ecosystem.config.js
 * 停止：  pm2 stop ecosystem.config.js
 * 日志：  pm2 logs marketing-editor-server / marketing-editor-client
 */
const path = require('path');

const ROOT = __dirname;

module.exports = {
  apps: [
    {
      name: 'marketing-editor-server',
      script: path.join(ROOT, 'package/server/app.ts'),
      // 用本地 node + ts-node/register 加载 TS，不依赖全局 ts-node，规避 .cmd 不能做 interpreter 的问题
      interpreter: 'node',
      interpreter_args: '-r ts-node/register',
      cwd: ROOT,
      // pm2 watch 替代 nodemon，监视 server 目录下 .ts 变更
      watch: ['package/server'],
      ignore_watch: [
        'node_modules',
        'output',
        // schema 持久化目录，保存 schema 不应触发重启
        'package/server/data',
      ],
      env: {
        NODE_ENV: 'dev',
        PORT: 8081,
        // 限定 ts-node 使用 server 专用 tsconfig，避免根 tsconfig 缺 include 导致扫描范围过大
        TS_NODE_PROJECT: path.join(ROOT, 'package/server/tsconfig.json'),
      },
      merge_logs: true,
      max_memory_restart: '512M',
    },
    {
      name: 'marketing-editor-client',
      // 用 webpack-cli 的 bin 直跑 serve，与 dev:client 的 `webpack serve` 语义一致
      script: path.join(ROOT, 'node_modules/webpack-cli/bin/cli.js'),
      args: 'serve --progress --hot --config ./package/client/build/webpack.dev.js',
      interpreter: 'node',
      cwd: ROOT,
      // webpack-dev-server 自身负责 HMR，不开启 pm2 watch，防止 output 变化触发重启
      watch: false,
      env: {
        NODE_ENV: 'dev',
        // webpack.dev.js 硬编码 port 8080，不读取 process.env.PORT，故不注入 PORT
      },
      merge_logs: true,
      max_memory_restart: '2G',
    },
  ],
};
