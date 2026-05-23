const STATUS = {
  PASS: 'pass',
  FAIL: 'fail',
  SKIP: 'skip',
  WARN: 'warn',
};

const PHASES = {
  LOCAL_TEST: '本地测试',
  BUILD: '构建验证',
  ONLINE_CHECK: '线上检查',
  FUNCTIONAL_TEST: '功能测试',
};

const EMOJI = {
  [STATUS.PASS]: '✅',
  [STATUS.FAIL]: '❌',
  [STATUS.SKIP]: '⏭️',
  [STATUS.WARN]: '⚠️',
  summary: '📊',
  phase: '🔹',
  duration: '⏱️',
  suggestion: '💡',
  fix: '🔧',
  separator: '─',
};

const COLOR = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const DIAGNOSTICS = {
  [PHASES.LOCAL_TEST]: {
    common: [
      '检查本地开发服务器是否已启动',
      '确认端口未被其他进程占用',
      '检查环境变量配置是否正确',
    ],
    fix: [
      '运行 npm run dev 启动本地服务器',
      '使用 lsof -i :<port> 查找占用端口的进程',
      '检查 .env 文件中的配置项',
    ],
  },
  [PHASES.BUILD]: {
    common: [
      '检查 package.json 中的 build 脚本',
      '确认所有依赖已正确安装',
      '查看构建日志中的错误信息',
    ],
    fix: [
      '运行 npm install 安装缺失依赖',
      '检查 tsconfig.json / webpack.config.js 配置',
      '清理 node_modules 和缓存后重试：rm -rf node_modules && npm install',
    ],
  },
  [PHASES.ONLINE_CHECK]: {
    common: [
      '检查目标 URL 是否可访问',
      '确认网络连接正常',
      '验证 DNS 解析是否正确',
    ],
    fix: [
      '使用 curl -I <url> 检查响应状态',
      '检查防火墙或代理设置',
      '确认域名已正确解析到服务器',
    ],
  },
  [PHASES.FUNCTIONAL_TEST]: {
    common: [
      '检查页面元素选择器是否正确',
      '确认测试数据是否准备就绪',
      '查看浏览器控制台错误信息',
    ],
    fix: [
      '更新元素选择器以匹配最新 DOM 结构',
      '检查 API 接口返回数据格式',
      '确认测试环境数据库状态',
    ],
  },
};

function colorize(text, color) {
  return `${COLOR[color] || COLOR.reset}${text}${COLOR.reset}`;
}

function padCenter(text, width) {
  const pad = Math.max(0, width - text.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function createReporter(options = {}) {
  const results = [];
  const { json = false, verbose = false } = options;

  function addResult(phase, status, message, details = {}) {
    const result = {
      phase,
      status,
      message,
      duration: details.duration ?? 0,
      timestamp: new Date().toISOString(),
      details: details.error
        ? { ...details, error: details.error.message || String(details.error) }
        : details,
    };
    results.push(result);
    return result;
  }

  function getSummary() {
    const summary = {
      total: results.length,
      pass: results.filter((r) => r.status === STATUS.PASS).length,
      fail: results.filter((r) => r.status === STATUS.FAIL).length,
      skip: results.filter((r) => r.status === STATUS.SKIP).length,
      warn: results.filter((r) => r.status === STATUS.WARN).length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
    };
    summary.success = summary.fail === 0;
    return summary;
  }

  function printLine(width = 60, char = EMOJI.separator) {
    console.log(char.repeat(width));
  }

  function printHeader(title) {
    const width = 60;
    printLine(width);
    console.log(colorize(padCenter(` ${title} `, width), 'bright'));
    printLine(width);
  }

  function printPhaseResult(result) {
    const icon = EMOJI[result.status] || '';
    const statusColor =
      result.status === STATUS.PASS
        ? 'green'
        : result.status === STATUS.FAIL
        ? 'red'
        : result.status === STATUS.WARN
        ? 'yellow'
        : 'dim';

    console.log(
      `${EMOJI.phase} ${colorize(result.phase, 'bright')} ${icon} ${colorize(
        result.status.toUpperCase(),
        statusColor
      )}`
    );
    console.log(`   ${result.message}`);
    if (result.duration > 0) {
      console.log(`   ${EMOJI.duration} 耗时: ${formatDuration(result.duration)}`);
    }
    if (result.details.error && verbose) {
      console.log(`   ${colorize('错误详情:', 'red')} ${result.details.error}`);
    }
    console.log();
  }

  function printDiagnostics(failedResults) {
    if (failedResults.length === 0) return;

    console.log(colorize('\n📋 诊断建议与修复指南\n', 'bright'));
    printLine(60);

    const grouped = failedResults.reduce((acc, r) => {
      if (!acc[r.phase]) acc[r.phase] = [];
      acc[r.phase].push(r);
      return acc;
    }, {});

    for (const [phase, items] of Object.entries(grouped)) {
      console.log(colorize(`\n${phase}`, 'cyan'));
      const diag = DIAGNOSTICS[phase] || DIAGNOSTICS[PHASES.FUNCTIONAL_TEST];

      console.log(colorize(`  ${EMOJI.suggestion} 可能原因:`, 'yellow'));
      diag.common.forEach((item) => console.log(`    • ${item}`));

      console.log(colorize(`  ${EMOJI.fix} 修复步骤:`, 'green'));
      diag.fix.forEach((item) => console.log(`    • ${item}`));

      if (verbose) {
        console.log(colorize('  错误信息:', 'red'));
        items.forEach((item) => {
          const err = item.details.error || item.message;
          console.log(`    • ${err}`);
        });
      }
    }
  }

  function printSummary() {
    if (json) {
      const output = {
        summary: getSummary(),
        results: results.map((r) => ({
          phase: r.phase,
          status: r.status,
          message: r.message,
          duration: r.duration,
          timestamp: r.timestamp,
        })),
      };
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    printHeader('部署测试报告');

    if (results.length === 0) {
      console.log(colorize('暂无测试结果', 'dim'));
      return;
    }

    results.forEach(printPhaseResult);

    const summary = getSummary();
    printLine(60);
    console.log(
      `${EMOJI.summary} ${colorize('汇总:', 'bright')} ` +
        `${colorize(`通过 ${summary.pass}`, 'green')} | ` +
        `${colorize(`失败 ${summary.fail}`, 'red')} | ` +
        `${colorize(`跳过 ${summary.skip}`, 'dim')} | ` +
        `${colorize(`警告 ${summary.warn}`, 'yellow')} | ` +
        `${EMOJI.duration} 总耗时: ${formatDuration(summary.totalDuration)}`
    );
    printLine(60);

    const failed = results.filter((r) => r.status === STATUS.FAIL);
    printDiagnostics(failed);

    console.log();
    if (summary.success) {
      console.log(colorize('🎉 所有测试通过，可以安全部署！', 'green'));
    } else {
      console.log(
        colorize(
          `⚠️ 存在 ${summary.fail} 个失败项，请修复后再部署。`,
          'red'
        )
      );
    }
  }

  function getExitCode() {
    const summary = getSummary();
    return summary.success ? 0 : 1;
  }

  function toJSON() {
    return {
      summary: getSummary(),
      results,
    };
  }

  return {
    addResult,
    printSummary,
    getExitCode,
    getSummary,
    toJSON,
    STATUS,
    PHASES,
  };
}

module.exports = {
  createReporter,
  STATUS,
  PHASES,
};
