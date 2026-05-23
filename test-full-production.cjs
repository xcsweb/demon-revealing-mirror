/**
 * 正确的全面生产环境测试脚本
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST_DIR = '/workspace/dist';
const BASE_URL = 'https://xcsweb.github.io/demon-revealing-mirror';

/**
 * 发送 HTTP/HTTPS 请求（自动跟随重定向）
 */
function request(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function doRequest(currentUrl) {
      const parsedUrl = new URL(currentUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'deploy-test-full-checker/2.0',
          'Accept': '*/*',
        },
        timeout,
      };

      const req = client.request(options, (res) => {
        // 处理 3xx 重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const newUrl = new URL(res.headers.location, currentUrl).toString();
          res.resume();
          doRequest(newUrl);
          return;
        }

        let body = '';
        let size = 0;
        res.on('data', chunk => {
          body += chunk;
          size += chunk.length;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
            size,
            loadTime: Date.now() - startTime,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    }

    doRequest(url);
  });
}

/**
 * 获取 dist 目录中所有文件
 */
function getAllFiles(dir, basePath = '') {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, relativePath));
    } else {
      const stats = fs.statSync(fullPath);
      files.push({
        relativePath,
        fullPath,
        size: stats.size,
        name: entry.name,
      });
    }
  }

  return files;
}

async function runFullTest() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     全面生产环境测试 - 检查所有资源文件                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // 1. 获取 dist 目录中所有文件
  console.log('📋 步骤 1: 扫描本地 dist 目录...\n');
  const localFiles = getAllFiles(DIST_DIR);

  console.log(`   找到 ${localFiles.length} 个文件:\n`);
  localFiles.forEach((file, i) => {
    const sizeStr = file.size > 1024 ? `${(file.size / 1024).toFixed(1)}KB` : `${file.size}B`;
    console.log(`   ${String(i + 1).padStart(2)}. ${file.relativePath.padEnd(40)} ${sizeStr.padStart(10)}`);
  });

  // 2. 逐一检查线上是否存在
  console.log('\n\n📋 步骤 2: 逐一验证线上资源...\n');

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const file of localFiles) {
    const onlineUrl = `${BASE_URL}/${file.relativePath}`;
    process.stdout.write(`   检查: ${file.relativePath.padEnd(40)}`);

    try {
      const result = await request(onlineUrl, 15000);

      if (result.statusCode === 200) {
        console.log(` ✅ HTTP ${result.statusCode} (${result.loadTime}ms, ${result.size}B)\n`);
        results.push({
          ...file,
          onlineUrl,
          statusCode: result.statusCode,
          onlineSize: result.size,
          loadTime: result.loadTime,
          success: true,
        });
        successCount++;
      } else {
        console.log(` ❌ HTTP ${result.statusCode}\n`);
        results.push({
          ...file,
          onlineUrl,
          statusCode: result.statusCode,
          loadTime: result.loadTime,
          success: false,
        });
        failCount++;
      }
    } catch (err) {
      console.log(` ❌ ${err.message}\n`);
      results.push({
        ...file,
        onlineUrl,
        success: false,
        error: err.message,
      });
      failCount++;
    }
  }

  // 3. 汇总报告
  console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    📊 测试汇总报告                         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('   📁 本地文件总数:', localFiles.length);
  console.log('   🌐 线上检查结果:');
  console.log('      ✅ 成功:', successCount);
  console.log('      ❌ 失败:', failCount);

  // 文件大小对比
  console.log('\n   📋 文件详情对比:\n');
  console.log('   ' + '文件名'.padEnd(35) + '本地大小'.padEnd(12) + '线上大小'.padEnd(12) + '状态');
  console.log('   ' + '-'.repeat(80));

  results.forEach(file => {
    const localSize = file.size > 1024 ? `${(file.size / 1024).toFixed(1)}KB` : `${file.size}B`;
    const onlineSize = file.onlineSize > 1024 ? `${(file.onlineSize / 1024).toFixed(1)}KB` : `${file.onlineSize || 0}B`;
    const status = file.success ? '✅' : '❌';
    const sizeMatch = file.success && file.size === file.onlineSize ? '' : ' (大小不匹配!)';

    console.log(
      `   ${file.relativePath.padEnd(35)} ${localSize.padEnd(12)} ${onlineSize.padEnd(12)} ${status}${sizeMatch}`
    );
  });

  // 最终结论
  console.log('\n\n' + '='.repeat(74));

  if (failCount === 0) {
    console.log('🎉 所有资源测试通过！部署正常！\n');
    console.log('   访问地址: https://xcsweb.github.io/demon-revealing-mirror/\n');
  } else {
    console.log('❌ 存在问题！有 ' + failCount + ' 个文件无法访问。\n');
    console.log('   请检查网络或重新部署。\n');
  }

  console.log('='.repeat(74) + '\n');

  return { results, successCount, failCount, localFiles };
}

// 运行测试
runFullTest()
  .then(result => {
    process.exit(result.failCount > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
  });
