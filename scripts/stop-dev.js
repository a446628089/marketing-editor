/**
 * 端口级兜底清理脚本（Windows）
 *
 * 以 8081/8080 端口为锚点，定位 LISTENING 进程并连进程树杀死。
 * 用于：
 *   1. 切换到 pm2 托管前清场（清理旧 concurrently/nodemon/webpack 残留）
 *   2. pm2 stop 后仍发现端口被占时的兜底清理
 *
 * 幂等：未命中任何端口时正常退出，提示"无残留"。
 * 安全：只匹配 LISTENING 状态的本地端口占用，避免 TIME_WAIT/ESTABLISHED
 *       及对端端口相同（foreign address）的进程被误杀。
 */
const { execFileSync } = require('child_process');

const PORTS = [8081, 8080];

function findPidsByPort(port) {
  // netstat -ano -p tcp 输出示例：
  //   TCP    0.0.0.0:8081           0.0.0.0:0              LISTENING       12345
  //   TCP    [::]:8081              [::]:0                 LISTENING       12346
  let stdout;
  try {
    stdout = execFileSync('netstat', ['-ano', '-p', 'tcp'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    // netstat 极罕见失败（如系统异常），此时静默跳过该端口
    console.error(`[stop-dev] 执行 netstat 失败: ${String(err.stderr || err.message)}`);
    return [];
  }
  const pids = new Set();
  // 边界匹配：\s 在端口号之后，避免 :8081 误匹配到 :80810
  const re = new RegExp(`:${port}\\s`);
  for (const line of stdout.split(/\r?\n/)) {
    // 只匹配 LISTENING 状态，且本地端口命中
    if (re.test(line) && line.includes('LISTENING')) {
      const pid = line.trim().split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid)) {
        pids.add(pid);
      }
    }
  }
  return [...pids];
}

function killTree(pid) {
  // taskkill /F /T /PID <pid>：强制结束进程及其子进程树
  execFileSync('taskkill', ['/F', '/T', '/PID', pid], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function main() {
  let killed = 0;
  let failed = 0;
  for (const port of PORTS) {
    const pids = findPidsByPort(port);
    if (pids.length === 0) {
      console.log(`[stop-dev] 端口 ${port} 无占用，跳过`);
      continue;
    }
    console.log(`[stop-dev] 端口 ${port} 被 PID ${pids.join(', ')} 占用，正在清理...`);
    for (const pid of pids) {
      try {
        killTree(pid);
        console.log(`[stop-dev] 已结束进程树 PID ${pid}`);
        killed += 1;
      } catch (err) {
        // 进程可能已被杀或权限不足，输出到 stderr 但不中断
        console.error(`[stop-dev] 结束 PID ${pid} 失败: ${String(err.stderr || err.message)}`);
        failed += 1;
      }
    }
  }
  if (killed === 0 && failed === 0) {
    console.log('[stop-dev] 无残留进程，8081/8080 已全部空闲');
  } else if (failed > 0) {
    console.error(`[stop-dev] 清理不完整：已结束 ${killed} 个，失败 ${failed} 个`);
    process.exitCode = 1;
  } else {
    console.log(`[stop-dev] 清理完成，共结束 ${killed} 个进程树`);
  }
}

main();
