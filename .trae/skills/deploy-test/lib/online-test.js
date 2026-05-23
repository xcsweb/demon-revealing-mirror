const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * 发送 HTTP/HTTPS 请求（自动跟随重定向）
 * @param {string} url - 请求 URL
 * @param {number} timeout - 超时时间（毫秒）
 * @param {string} method - 请求方法，默认 GET
 * @returns {Promise<{statusCode: number, headers: Object, body: string, loadTime: number, size: number, redirected: boolean}>}
 */
function request(url, timeout = 30000, method = 'GET') {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let redirected = false;

    function doRequest(currentUrl) {
      const parsedUrl = new URL(currentUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: {
          'User-Agent': 'deploy-test-online-checker/1.0',
          'Accept': '*/*',
          'Accept-Encoding': 'identity',
        },
        timeout: timeout,
      };

      const req = client.request(options, (res) => {
        // 处理 3xx 重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          redirected = true;
          const newUrl = new URL(res.headers.location, currentUrl).toString();
          res.resume(); // 消耗响应体
          doRequest(newUrl);
          return;
        }

        let body = '';
        let size = 0;

        res.on('data', (chunk) => {
          body += chunk;
          size += chunk.length;
        });

        res.on('end', () => {
          const loadTime = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
            loadTime,
            size,
            redirected,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });

      req.end();
    }

    doRequest(url);
  });
}

/**
 * 测试线上部署
 * @param {string} deployUrl - 部署 URL
 * @param {number} timeout - 总超时时间（毫秒）
 * @returns {Promise<Object>}
 */
async function testOnline(deployUrl, timeout = 120000) {
  const errors = [];
  const warnings = [];
  const resources = [];
  const startTime = Date.now();

  // 轮询等待部署完成
  const pollInterval = 5000; // 5秒
  const maxAttempts = Math.floor(timeout / pollInterval);
  let pollSuccess = false;
  let pollStatusCode = null;
  let pollLoadTime = 0;
  let htmlBody = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await request(deployUrl, 10000);

      if (result.statusCode >= 200 && result.statusCode < 400) {
        pollSuccess = true;
        pollStatusCode = result.statusCode;
        pollLoadTime = result.loadTime;
        htmlBody = result.body;
        break;
      }

      if (attempt < maxAttempts) {
        console.log(`  ⏳ 等待部署完成... (${attempt}/${maxAttempts})`);
        await new Promise(r => setTimeout(r, pollInterval));
      }
    } catch (err) {
      errors.push({ phase: 'poll', attempt, message: err.message });
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, pollInterval));
      }
    }
  }

  if (!pollSuccess) {
    return {
      url: deployUrl,
      timestamp: new Date().toISOString(),
      poll: { success: false, statusCode: pollStatusCode, loadTime: pollLoadTime, attempts: maxAttempts },
      resources,
      summary: { total: 0, success: 0, failed: 0, warnings: 0, totalLoadTime: 0, avgLoadTime: 0 },
      errors,
      warnings,
    };
  }

  // 提取资源
  if (htmlBody) {
    const resourcePatterns = [
      { type: 'script', pattern: /<script[^>]+src=["']([^"']+)["']/gi },
      { type: 'link', pattern: /<link[^>]+href=["']([^"']+\.css)["']/gi },
      { type: 'image', pattern: /<img[^>]+src=["']([^"']+)["']/gi },
      { type: 'image', pattern: /url\(["']?([^"')]+)["']?\)/gi },
    ];

    const seen = new Set();

    for (const { type, pattern } of resourcePatterns) {
      let match;
      while ((match = pattern.exec(htmlBody)) !== null) {
        let resourceUrl = match[1];

        // 跳过外部资源
        if (resourceUrl.startsWith('http') && !resourceUrl.startsWith(deployUrl)) {
          continue;
        }

        // 解析相对路径
        if (!resourceUrl.startsWith('http')) {
          const baseUrl = new URL(deployUrl);
          resourceUrl = baseUrl.origin + (resourceUrl.startsWith('/') ? resourceUrl : baseUrl.pathname.replace(/[^/]*$/, '') + resourceUrl);
        }

        if (seen.has(resourceUrl)) continue;
        seen.add(resourceUrl);

        try {
          const result = await request(resourceUrl, 10000);
          const contentTypeValid = checkContentType(resourceUrl, result.headers['content-type']);
          const cacheHeaders = {
            'cache-control': result.headers['cache-control'],
            'etag': result.headers['etag'],
            'last-modified': result.headers['last-modified'],
            'expires': result.headers['expires'],
          };
          const hasCache = Object.values(cacheHeaders).some(v => v);

          resources.push({
            type,
            url: resourceUrl,
            statusCode: result.statusCode,
            loadTime: result.loadTime,
            size: result.size,
            contentType: contentTypeValid,
            cache: { hasCache, warnings: [] },
            error: result.statusCode !== 200 ? `HTTP ${result.statusCode}` : null,
          });

          if (result.statusCode !== 200) {
            errors.push({ phase: 'resource', url: resourceUrl, statusCode: result.statusCode });
          }
        } catch (err) {
          resources.push({
            type,
            url: resourceUrl,
            statusCode: 0,
            loadTime: 0,
            size: 0,
            contentType: { valid: false, expected: '', actual: '' },
            cache: { hasCache: false, warnings: [] },
            error: err.message,
          });
          errors.push({ phase: 'resource', url: resourceUrl, error: err.message });
        }
      }
    }
  }

  // 计算汇总
  const totalLoadTime = resources.reduce((sum, r) => sum + (r.loadTime || 0), 0);
  const summary = {
    total: resources.length,
    success: resources.filter(r => r.statusCode === 200).length,
    failed: resources.filter(r => r.statusCode !== 200).length,
    warnings: resources.filter(r => !r.contentType.valid).length,
    totalLoadTime,
    avgLoadTime: resources.length > 0 ? Math.round(totalLoadTime / resources.length) : 0,
  };

  return {
    url: deployUrl,
    timestamp: new Date().toISOString(),
    poll: { success: true, statusCode: pollStatusCode, loadTime: pollLoadTime, attempts: 1 },
    resources,
    summary,
    errors,
    warnings,
  };
}

/**
 * 检查 Content-Type 是否正确
 */
function checkContentType(url, contentType) {
  if (!contentType) return { valid: false, expected: 'unknown', actual: 'none' };

  const ext = url.split('.').pop().toLowerCase();
  const expected = {
    'js': 'javascript',
    'css': 'css',
    'html': 'html',
    'svg': 'svg',
    'png': 'png',
    'jpg': 'jpeg',
    'jpeg': 'jpeg',
    'gif': 'gif',
    'woff': 'font-woff',
    'woff2': 'font-woff2',
  };

  const expectedType = expected[ext] || 'unknown';
  const valid = contentType.toLowerCase().includes(expectedType);

  return { valid, expected: expectedType, actual: contentType };
}

module.exports = { testOnline, request };
