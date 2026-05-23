#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { spawn, exec } = require('child_process');
const { URL } = require('url');
const path = require('path');
const fs = require('fs');

const { createReporter, PHASES, STATUS } = require('./lib/reporter');

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    url: null,
    timeout: 30000,
    skipBuild: false,
    skipOnline: false,
    verbose: false,
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      case '--url':
        options.url = args[++i] || null;
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i], 10) || 30000;
        break;
      case '--skip-build':
        options.skipBuild = true;
        break;
      case '--skip-online':
        options.skipOnline = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--json':
        options.json = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`未知参数: ${arg}`);
          printHelp();
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
部署测试工具

用法: node index.js [选项]

选项:
  --url <url>        指定线上检查的 URL
  --timeout <ms>     设置超时时间（默认 30000ms）
  --skip-build       跳过构建验证阶段
  --skip-online      跳过线上检查阶段
  --verbose, -v      显示详细错误信息
  --json             以 JSON 格式输出报告
  --help, -h         显示帮助信息

示例:
  node index.js
  node index.js --url https://example.com --timeout 60000
  node index.js --skip-build --skip-online
`);
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} 超时 (${ms}ms)`)), ms)
    ),
  ]);
}

function runCommand(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: options.shell || false,
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        reject(new Error(`命令退出码 ${code}: ${stderr || stdout || cmd}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

function checkUrl(url, timeout) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(url, { timeout }, (res) => {
      const { statusCode } = res;
      if (statusCode >= 200 && statusCode < 400) {
        resolve({ statusCode, headers: res.headers });
      } else {
        reject(new Error(`HTTP ${statusCode}`));
      }
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

function findPackageJson(dir) {
  const file = path.join(dir, 'package.json');
  if (fs.existsSync(file)) return file;
  const parent = path.dirname(dir);
  if (parent === dir) return null;
  return findPackageJson(parent);
}

function hasScript(pkgPath, name) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return !!(pkg.scripts && pkg.scripts[name]);
  } catch {
    return false;
  }
}

async function runLocalTest(reporter, options) {
  const phase = PHASES.LOCAL_TEST;
  const start = Date.now();

  try {
    const pkgPath = findPackageJson(process.cwd());
    if (!pkgPath) {
      reporter.addResult(phase, STATUS.WARN, '未找到 package.json，跳过本地测试', {
        duration: Date.now() - start,
      });
      return;
    }

    if (hasScript(pkgPath, 'test')) {
      await withTimeout(
        runCommand('npm', ['test'], { silent: true }),
        options.timeout,
        '本地测试'
      );
      reporter.addResult(phase, STATUS.PASS, '本地测试通过', {
        duration: Date.now() - start,
      });
    } else {
      reporter.addResult(phase, STATUS.SKIP, 'package.json 中未定义 test 脚本', {
        duration: Date.now() - start,
      });
    }
  } catch (err) {
    reporter.addResult(phase, STATUS.FAIL, `本地测试失败: ${err.message}`, {
      duration: Date.now() - start,
      error: err,
    });
  }
}

async function runBuildValidation(reporter, options) {
  const phase = PHASES.BUILD;
  const start = Date.now();

  if (options.skipBuild) {
    reporter.addResult(phase, STATUS.SKIP, '用户指定跳过构建验证', {
      duration: Date.now() - start,
    });
    return;
  }

  try {
    const pkgPath = findPackageJson(process.cwd());
    if (!pkgPath) {
      reporter.addResult(phase, STATUS.WARN, '未找到 package.json，跳过构建验证', {
        duration: Date.now() - start,
      });
      return;
    }

    if (hasScript(pkgPath, 'build')) {
      await withTimeout(
        runCommand('npm', ['run', 'build'], { silent: true }),
        options.timeout,
        '构建验证'
      );
      reporter.addResult(phase, STATUS.PASS, '构建验证通过', {
        duration: Date.now() - start,
      });
    } else {
      reporter.addResult(phase, STATUS.SKIP, 'package.json 中未定义 build 脚本', {
        duration: Date.now() - start,
      });
    }
  } catch (err) {
    reporter.addResult(phase, STATUS.FAIL, `构建验证失败: ${err.message}`, {
      duration: Date.now() - start,
      error: err,
    });
  }
}

async function runOnlineCheck(reporter, options) {
  const phase = PHASES.ONLINE_CHECK;
  const start = Date.now();

  if (options.skipOnline) {
    reporter.addResult(phase, STATUS.SKIP, '用户指定跳过线上检查', {
      duration: Date.now() - start,
    });
    return;
  }

  const url = options.url;
  if (!url) {
    reporter.addResult(phase, STATUS.SKIP, '未指定 --url，跳过线上检查', {
      duration: Date.now() - start,
    });
    return;
  }

  try {
    const result = await withTimeout(
      checkUrl(url, options.timeout),
      options.timeout,
      '线上检查'
    );
    reporter.addResult(
      phase,
      STATUS.PASS,
      `线上检查通过，HTTP ${result.statusCode}`,
      { duration: Date.now() - start, statusCode: result.statusCode }
    );
  } catch (err) {
    reporter.addResult(phase, STATUS.FAIL, `线上检查失败: ${err.message}`, {
      duration: Date.now() - start,
      error: err,
    });
  }
}

async function runFunctionalTest(reporter, options) {
  const phase = PHASES.FUNCTIONAL_TEST;
  const start = Date.now();

  try {
    const pkgPath = findPackageJson(process.cwd());
    if (pkgPath && hasScript(pkgPath, 'test:e2e')) {
      await withTimeout(
        runCommand('npm', ['run', 'test:e2e'], { silent: true }),
        options.timeout,
        '功能测试'
      );
      reporter.addResult(phase, STATUS.PASS, '功能测试（E2E）通过', {
        duration: Date.now() - start,
      });
      return;
    }

    if (pkgPath && hasScript(pkgPath, 'test: functional')) {
      await withTimeout(
        runCommand('npm', ['run', 'test:functional'], { silent: true }),
        options.timeout,
        '功能测试'
      );
      reporter.addResult(phase, STATUS.PASS, '功能测试通过', {
        duration: Date.now() - start,
      });
      return;
    }

    reporter.addResult(phase, STATUS.SKIP, '未找到功能测试脚本（test:e2e / test:functional）', {
      duration: Date.now() - start,
    });
  } catch (err) {
    reporter.addResult(phase, STATUS.FAIL, `功能测试失败: ${err.message}`, {
      duration: Date.now() - start,
      error: err,
    });
  }
}

function printProgress(label) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🚀 正在执行: ${label}`);
  console.log(`${'═'.repeat(60)}\n`);
}

const runningProcesses = [];

function trackProcess(proc) {
  if (proc && typeof proc.kill === 'function') {
    runningProcesses.push(proc);
  }
}

function cleanup() {
  runningProcesses.forEach((proc) => {
    try {
      proc.kill('SIGTERM');
    } catch {
      // ignore
    }
  });
}

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(143);
});

async function main() {
  const options = parseArgs(process.argv);
  const reporter = createReporter({
    json: options.json,
    verbose: options.verbose,
  });

  console.log('\n' + '█'.repeat(60));
  console.log('█' + ' '.repeat(58) + '█');
  console.log('█' + ' '.repeat(14) + '🚀 部署前测试工具' + ' '.repeat(27) + '█');
  console.log('█' + ' '.repeat(58) + '█');
  console.log('█'.repeat(60) + '\n');

  printProgress(PHASES.LOCAL_TEST);
  await runLocalTest(reporter, options);

  printProgress(PHASES.BUILD);
  await runBuildValidation(reporter, options);

  printProgress(PHASES.ONLINE_CHECK);
  await runOnlineCheck(reporter, options);

  printProgress(PHASES.FUNCTIONAL_TEST);
  await runFunctionalTest(reporter, options);

  console.log('\n' + '█'.repeat(60));
  console.log('█' + ' '.repeat(58) + '█');
  console.log('█' + ' '.repeat(14) + '📊 测试完成，生成报告' + ' '.repeat(24) + '█');
  console.log('█' + ' '.repeat(58) + '█');
  console.log('█'.repeat(60) + '\n');

  reporter.printSummary();

  const exitCode = reporter.getExitCode();
  process.exit(exitCode);
}

main().catch((err) => {
  console.error('未处理的错误:', err);
  cleanup();
  process.exit(1);
});
