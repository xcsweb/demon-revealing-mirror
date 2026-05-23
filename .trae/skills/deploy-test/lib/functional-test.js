const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * 发送 HTTP/HTTPS 请求
 * @param {string} url - 请求 URL
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<{statusCode: number, headers: Object, body: string, loadTime: number}>}
 */
function request(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'deploy-test-functional-checker/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept-Encoding': 'identity',
      },
      timeout: timeout,
    };

    const req = client.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        const loadTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          loadTime,
        });
      });
    });

    req.on('error', (err) => {
      reject(new Error(`请求失败: ${err.message} (${url})`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`请求超时 (${timeout}ms): ${url}`));
    });

    req.end();
  });
}

/**
 * 检查页面标题
 * @param {string} html - HTML 内容
 * @param {string} expectedTitle - 期望的标题
 * @returns {{found: boolean, actual: string}}
 */
function checkTitle(html, expectedTitle) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const actual = titleMatch ? titleMatch[1].trim() : '';
  const found = actual.includes(expectedTitle);
  return { found, actual };
}

/**
 * 检查关键文本是否存在
 * @param {string} html - HTML 内容
 * @param {string} text - 要检查的文本
 * @returns {boolean}
 */
function hasText(html, text) {
  const normalizedHtml = html.replace(/\s+/g, ' ');
  return normalizedHtml.includes(text);
}

/**
 * 检查路由是否可访问
 * @param {string} deployUrl - 基础 URL
 * @param {string} path - 路由路径
 * @param {number} timeout - 超时时间
 * @returns {Promise<{path: string, url: string, accessible: boolean, statusCode: number, loadTime: number, error?: string}>}
 */
async function checkRoute(deployUrl, path, timeout = 30000) {
  const base = deployUrl.replace(/\/$/, '');
  const url = `${base}${path}`;

  try {
    const result = await request(url, timeout);
    const accessible = result.statusCode >= 200 && result.statusCode < 400;

    return {
      path,
      url,
      accessible,
      statusCode: result.statusCode,
      loadTime: result.loadTime,
    };
  } catch (err) {
    return {
      path,
      url,
      accessible: false,
      statusCode: null,
      loadTime: null,
      error: err.message,
    };
  }
}

/**
 * 检查 SPA 路由处理（404.html 重定向）
 * @param {string} deployUrl - 基础 URL
 * @param {number} timeout - 超时时间
 * @returns {Promise<{has404Page: boolean, redirectWorks: boolean, details: string}>}
 */
async function checkSpaRouting(deployUrl, timeout = 30000) {
  const base = deployUrl.replace(/\/$/, '');
  const notFoundUrl = `${base}/404.html`;

  let has404Page = false;
  let redirectWorks = false;
  const details = [];

  try {
    const result = await request(notFoundUrl, timeout);
    has404Page = result.statusCode === 200 && result.body.length > 0;

    if (has404Page) {
      details.push(`404.html 存在 (状态码: ${result.statusCode}, 大小: ${result.body.length} bytes)`);

      // 检查是否包含 SPA 重定向逻辑
      const hasRedirectScript = result.body.includes('location.replace') ||
        result.body.includes('location.href') ||
        result.body.includes('sessionStorage') ||
        result.body.includes('history.replaceState');

      const hasMetaRefresh = result.body.includes('<meta http-equiv="refresh"');

      if (hasRedirectScript) {
        redirectWorks = true;
        details.push('404.html 包含 JavaScript 重定向逻辑');
      }
      if (hasMetaRefresh) {
        redirectWorks = true;
        details.push('404.html 包含 meta refresh 重定向');
      }
      if (!hasRedirectScript && !hasMetaRefresh) {
        details.push('404.html 未检测到重定向逻辑，可能不是 SPA 路由处理');
      }
    } else {
      details.push(`404.html 返回状态码: ${result.statusCode}`);
    }
  } catch (err) {
    details.push(`获取 404.html 失败: ${err.message}`);
  }

  // 额外检查：访问一个不存在的路由，看是否返回 404.html 的内容
  try {
    const fakePath = `/non-existent-path-${Date.now()}`;
    const fakeUrl = `${base}${fakePath}`;
    const fakeResult = await request(fakeUrl, timeout);

    if (fakeResult.statusCode === 200 || fakeResult.statusCode === 404) {
      const hasSpaIndicator = fakeResult.body.includes('<div id="root"') ||
        fakeResult.body.includes('<div id="app"') ||
        fakeResult.body.includes('__spa') ||
        fakeResult.body.includes('404.html');

      if (hasSpaIndicator && fakeResult.statusCode === 200) {
        redirectWorks = true;
        details.push(`不存在的路由 ${fakePath} 返回了 200 并包含 SPA 标记，说明服务器已配置为返回 index.html`);
      } else if (fakeResult.statusCode === 404) {
        details.push(`不存在的路由 ${fakePath} 返回 404，符合预期`);
      }
    }
  } catch (err) {
    details.push(`检查不存在的路由时出错: ${err.message}`);
  }

  return {
    has404Page,
    redirectWorks,
    details: details.join('; '),
  };
}

/**
 * 功能测试主函数
 * @param {string} deployUrl - 部署后的 URL
 * @returns {Promise<Object>}
 */
async function testFunctional(deployUrl) {
  const results = {
    url: deployUrl,
    timestamp: new Date().toISOString(),
    title: null,
    textChecks: [],
    routes: [],
    spaRouting: null,
    summary: {
      passed: 0,
      failed: 0,
      total: 0,
    },
    errors: [],
  };

  // 1. 获取主页面
  let mainPage;
  try {
    mainPage = await request(deployUrl, 30000);
  } catch (err) {
    results.errors.push({
      phase: 'fetch-main',
      message: err.message,
    });
    results.summary.total = 1;
    results.summary.failed = 1;
    return results;
  }

  if (mainPage.statusCode !== 200) {
    results.errors.push({
      phase: 'fetch-main',
      message: `主页面返回非 200 状态码: ${mainPage.statusCode}`,
    });
    results.summary.total = 1;
    results.summary.failed = 1;
    return results;
  }

  // 2. 检查页面标题
  const titleCheck = checkTitle(mainPage.body, '照妖镜');
  results.title = {
    expected: '照妖镜',
    found: titleCheck.found,
    actual: titleCheck.actual,
  };
  results.summary.total++;
  if (titleCheck.found) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
    results.errors.push({
      phase: 'title-check',
      message: `页面标题不包含"照妖镜"，实际标题: "${titleCheck.actual}"`,
    });
  }

  // 3. 检查关键文本内容
  const keyTexts = ['照妖镜'];
  for (const text of keyTexts) {
    const found = hasText(mainPage.body, text);
    results.textChecks.push({ text, found });
    results.summary.total++;
    if (found) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
      results.errors.push({
        phase: 'text-check',
        message: `页面中未找到关键文本: "${text}"`,
      });
    }
  }

  // 4. 检查路由可访问性
  const routesToCheck = ['/', '/mirror', '/result'];
  for (const route of routesToCheck) {
    const routeResult = await checkRoute(deployUrl, route);
    results.routes.push(routeResult);
    results.summary.total++;
    if (routeResult.accessible) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
      results.errors.push({
        phase: 'route-check',
        url: routeResult.url,
        message: routeResult.error || `路由 ${route} 不可访问 (状态码: ${routeResult.statusCode})`,
      });
    }
  }

  // 5. 检查 SPA 路由处理
  const spaResult = await checkSpaRouting(deployUrl);
  results.spaRouting = spaResult;
  results.summary.total++;
  if (spaResult.has404Page) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
    results.errors.push({
      phase: 'spa-routing',
      message: '未检测到 404.html 页面，SPA 路由可能无法正常工作',
    });
  }

  return results;
}

module.exports = { testFunctional };
