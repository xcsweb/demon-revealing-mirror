const https = require('https');
const http = require('http');
const { URL } = require('url');

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
          'User-Agent': 'deploy-test-functional-checker/1.0',
          'Accept': 'text/html,*/*',
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
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
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
 * 测试功能
 * @param {string} deployUrl - 部署 URL
 * @returns {Promise<Object>}
 */
async function testFunctional(deployUrl) {
  const errors = [];
  const startTime = Date.now();

  // 检查主页
  let mainResult;
  try {
    mainResult = await request(deployUrl);
  } catch (err) {
    return {
      url: deployUrl,
      timestamp: new Date().toISOString(),
      title: null,
      textChecks: [],
      routes: [],
      spaRouting: null,
      summary: { passed: 0, failed: 1, total: 1 },
      errors: [{ phase: 'fetch-main', message: err.message }],
    };
  }

  if (mainResult.statusCode !== 200) {
    return {
      url: deployUrl,
      timestamp: new Date().toISOString(),
      title: null,
      textChecks: [],
      routes: [],
      spaRouting: null,
      summary: { passed: 0, failed: 1, total: 1 },
      errors: [{ phase: 'fetch-main', message: `主页面返回非 200 状态码: ${mainResult.statusCode}` }],
    };
  }

  const html = mainResult.body;

  // 检查标题
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;
  const titleCheck = {
    expected: '照妖镜',
    found: title ? title.includes('照妖镜') : false,
    actual: title,
  };

  // 检查关键文本
  const textChecks = [
    { text: '照妖镜', found: html.includes('照妖镜') },
  ];

  // 检查路由
  const routes = [];
  const routePaths = ['/', '/mirror', '/result'];

  for (const routePath of routePaths) {
    const routeUrl = deployUrl.replace(/\/$/, '') + routePath;
    try {
      const result = await request(routeUrl);
      routes.push({
        path: routePath,
        accessible: result.statusCode === 200,
        statusCode: result.statusCode,
        loadTime: result.loadTime,
      });
    } catch (err) {
      routes.push({
        path: routePath,
        accessible: false,
        statusCode: 0,
        loadTime: 0,
        error: err.message,
      });
    }
  }

  // 检查 SPA 路由
  const baseUrl = new URL(deployUrl);
  const notFoundUrl = `${baseUrl.origin}${baseUrl.pathname.replace(/\/$/, '')}/non-existent-page-123`;

  let spaRouting = {
    has404Page: false,
    redirectWorks: false,
    details: '未检查',
  };

  try {
    const result404 = await request(notFoundUrl);
    spaRouting.has404Page = result404.statusCode === 404;
    spaRouting.redirectWorks = result404.body.includes('root') || result404.body.includes('SPA');
  } catch (err) {
    spaRouting.details = `检查失败: ${err.message}`;
  }

  // 计算汇总
  let passed = 0;
  if (titleCheck.found) passed++;
  textChecks.forEach(t => { if (t.found) passed++; });
  routes.forEach(r => { if (r.accessible) passed++; });
  if (spaRouting.redirectWorks) passed++;

  return {
    url: deployUrl,
    timestamp: new Date().toISOString(),
    title: titleCheck,
    textChecks,
    routes,
    spaRouting,
    summary: {
      passed,
      failed: (1 + textChecks.length + routes.length + 1) - passed,
      total: 1 + textChecks.length + routes.length + 1,
    },
    errors,
  };
}

module.exports = { testFunctional, request };
