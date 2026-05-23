const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * 发送 HTTP/HTTPS 请求
 * @param {string} url - 请求 URL
 * @param {number} timeout - 超时时间（毫秒）
 * @param {string} method - 请求方法，默认 GET
 * @returns {Promise<{statusCode: number, headers: Object, body: string, loadTime: number, size: number}>}
 */
function request(url, timeout = 30000, method = 'GET') {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const parsedUrl = new URL(url);
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
 * 轮询检测 URL 是否可访问
 * @param {string} url - 检测 URL
 * @param {number} timeout - 总超时时间（毫秒）
 * @param {number} interval - 轮询间隔（毫秒）
 * @returns {Promise<{success: boolean, statusCode: number, loadTime: number, attempts: number, error?: string}>}
 */
async function pollUrl(url, timeout = 120000, interval = 5000) {
  const startTime = Date.now();
  let attempts = 0;

  while (Date.now() - startTime < timeout) {
    attempts++;
    try {
      const result = await request(url, Math.min(interval, 10000));
      if (result.statusCode >= 200 && result.statusCode < 400) {
        return {
          success: true,
          statusCode: result.statusCode,
          loadTime: result.loadTime,
          attempts,
        };
      }
    } catch (err) {
      // 继续轮询
    }

    const remaining = timeout - (Date.now() - startTime);
    if (remaining > 0 && remaining >= interval) {
      await sleep(interval);
    } else if (remaining > 0) {
      await sleep(remaining);
    }
  }

  return {
    success: false,
    statusCode: null,
    loadTime: null,
    attempts,
    error: `轮询超时，${timeout}ms 内未检测到可用状态`,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 从 HTML 中提取所有资源引用
 * @param {string} html - HTML 内容
 * @param {string} baseUrl - 基础 URL，用于解析相对路径
 * @returns {Array<{type: string, url: string, original: string}>}
 */
function extractResources(html, baseUrl) {
  const resources = [];
  const base = new URL(baseUrl);

  // JS 文件
  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    resources.push({
      type: 'script',
      url: resolveUrl(match[1], base),
      original: match[1],
    });
  }

  // CSS 文件
  const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const relMatch = match[0].match(/rel=["']([^"']+)["']/i);
    const rel = relMatch ? relMatch[1].toLowerCase() : '';
    if (rel === 'stylesheet' || match[0].includes('stylesheet')) {
      resources.push({
        type: 'stylesheet',
        url: resolveUrl(match[1], base),
        original: match[1],
      });
    } else if (rel === 'icon' || rel === 'shortcut icon') {
      resources.push({
        type: 'icon',
        url: resolveUrl(match[1], base),
        original: match[1],
      });
    }
  }

  // 图片
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = imgRegex.exec(html)) !== null) {
    resources.push({
      type: 'image',
      url: resolveUrl(match[1], base),
      original: match[1],
    });
  }

  // 背景图片 / CSS url()
  const cssUrlRegex = /url\(["']?([^"')\s]+)["']?\)/gi;
  while ((match = cssUrlRegex.exec(html)) !== null) {
    const url = match[1];
    if (!url.startsWith('data:')) {
      resources.push({
        type: 'css-image',
        url: resolveUrl(url, base),
        original: url,
      });
    }
  }

  // 字体文件
  const fontRegex = /@font-face\s*\{[^}]*src:[^}]*\}/gi;
  const fontSrcRegex = /url\(["']?([^"')\s]+)["']?\)/gi;
  while ((match = fontRegex.exec(html)) !== null) {
    let fontMatch;
    while ((fontMatch = fontSrcRegex.exec(match[0])) !== null) {
      if (!fontMatch[1].startsWith('data:')) {
        resources.push({
          type: 'font',
          url: resolveUrl(fontMatch[1], base),
          original: fontMatch[1],
        });
      }
    }
  }

  // video / audio / source
  const mediaRegex = /<(video|audio|source)[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = mediaRegex.exec(html)) !== null) {
    resources.push({
      type: 'media',
      url: resolveUrl(match[2], base),
      original: match[2],
    });
  }

  // preload / prefetch
  const preloadRegex = /<link[^>]+rel=["'](preload|prefetch|modulepreload)["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
  while ((match = preloadRegex.exec(html)) !== null) {
    const asMatch = match[0].match(/as=["']([^"']+)["']/i);
    resources.push({
      type: asMatch ? `preload-${asMatch[1]}` : 'preload',
      url: resolveUrl(match[2], base),
      original: match[2],
    });
  }

  // 去重
  const seen = new Set();
  return resources.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

/**
 * 解析相对 URL 为绝对 URL
 * @param {string} url - 原始 URL
 * @param {URL} base - 基础 URL
 * @returns {string}
 */
function resolveUrl(url, base) {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

/**
 * 检查 Content-Type 是否正确
 * @param {string} url - 资源 URL
 * @param {string} contentType - 响应头中的 Content-Type
 * @returns {{valid: boolean, expected: string}}
 */
function checkContentType(url, contentType) {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  const ct = (contentType || '').toLowerCase();

  const expectedMap = {
    js: ['application/javascript', 'text/javascript', 'application/x-javascript', 'application/ecmascript'],
    mjs: ['application/javascript', 'text/javascript', 'application/x-javascript', 'application/ecmascript'],
    css: ['text/css'],
    html: ['text/html'],
    htm: ['text/html'],
    json: ['application/json'],
    png: ['image/png'],
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg'],
    gif: ['image/gif'],
    svg: ['image/svg+xml'],
    webp: ['image/webp'],
    ico: ['image/x-icon', 'image/vnd.microsoft.icon'],
    woff: ['font/woff', 'application/font-woff'],
    woff2: ['font/woff2', 'application/font-woff2'],
    ttf: ['font/ttf', 'application/x-font-ttf', 'application/octet-stream'],
    otf: ['font/otf', 'application/x-font-opentype'],
    eot: ['application/vnd.ms-fontobject'],
    mp4: ['video/mp4'],
    webm: ['video/webm'],
    mp3: ['audio/mpeg'],
    ogg: ['audio/ogg', 'video/ogg'],
    wav: ['audio/wav'],
    pdf: ['application/pdf'],
    xml: ['application/xml', 'text/xml'],
  };

  const expected = expectedMap[ext];
  if (!expected) {
    return { valid: true, expected: 'unknown' };
  }

  const valid = expected.some((e) => ct.includes(e));
  return { valid, expected: expected.join(' or ') };
}

/**
 * 检查资源是否存在缓存问题
 * @param {Object} resource - 资源信息
 * @param {Object} headers - 响应头
 * @returns {{hasCache: boolean, warnings: string[]}}
 */
function checkCache(resource, headers) {
  const warnings = [];
  const cacheControl = (headers['cache-control'] || '').toLowerCase();
  const etag = headers['etag'];
  const lastModified = headers['last-modified'];
  const expires = headers['expires'];

  const hasCache = !!(cacheControl || etag || lastModified || expires);

  if (!hasCache) {
    warnings.push('缺少缓存头（Cache-Control / ETag / Last-Modified / Expires）');
  }

  if (cacheControl.includes('no-cache') && cacheControl.includes('no-store')) {
    warnings.push('同时设置了 no-cache 和 no-store，可能影响性能');
  }

  if (resource.type === 'script' || resource.type === 'stylesheet') {
    if (!cacheControl.includes('max-age') && !etag) {
      warnings.push('静态资源建议设置 max-age 或 ETag');
    }
  }

  return { hasCache, warnings };
}

/**
 * 检测部署后线上资源是否完整可用
 * @param {string} deployUrl - 部署后的 URL（如 GitHub Pages）
 * @param {number} timeout - 总超时时间（毫秒）
 * @returns {Promise<Object>}
 */
async function testOnline(deployUrl, timeout = 120000) {
  const results = {
    url: deployUrl,
    timestamp: new Date().toISOString(),
    poll: null,
    resources: [],
    summary: {
      total: 0,
      success: 0,
      failed: 0,
      warnings: 0,
      totalLoadTime: 0,
      avgLoadTime: 0,
    },
    errors: [],
  };

  // 1. 轮询检测主页面是否可访问
  const pollResult = await pollUrl(deployUrl, timeout);
  results.poll = pollResult;

  if (!pollResult.success) {
    results.errors.push({
      phase: 'poll',
      message: pollResult.error || `轮询失败，状态码: ${pollResult.statusCode}`,
    });
    return results;
  }

  // 2. 获取主页面 HTML
  let mainPage;
  try {
    mainPage = await request(deployUrl, 30000);
  } catch (err) {
    results.errors.push({
      phase: 'fetch-html',
      message: err.message,
    });
    return results;
  }

  if (mainPage.statusCode !== 200) {
    results.errors.push({
      phase: 'fetch-html',
      message: `主页面返回非 200 状态码: ${mainPage.statusCode}`,
    });
    return results;
  }

  // 3. 提取资源
  const resources = extractResources(mainPage.body, deployUrl);
  results.summary.total = resources.length;

  // 4. 逐一检查资源
  for (const resource of resources) {
    const resourceResult = {
      type: resource.type,
      url: resource.url,
      original: resource.original,
      statusCode: null,
      loadTime: null,
      size: null,
      contentType: { valid: true, expected: 'unknown', actual: null },
      cache: { hasCache: false, warnings: [] },
      error: null,
    };

    try {
      const res = await request(resource.url, 30000);
      resourceResult.statusCode = res.statusCode;
      resourceResult.loadTime = res.loadTime;
      resourceResult.size = res.size;

      if (res.statusCode >= 200 && res.statusCode < 400) {
        resourceResult.contentType = {
          ...checkContentType(resource.url, res.headers['content-type']),
          actual: res.headers['content-type'] || 'missing',
        };
        resourceResult.cache = checkCache(resource, res.headers);

        if (!resourceResult.contentType.valid) {
          resourceResult.error = `Content-Type 不正确，期望: ${resourceResult.contentType.expected}，实际: ${resourceResult.contentType.actual}`;
          results.summary.warnings++;
        }

        if (resourceResult.cache.warnings.length > 0) {
          results.summary.warnings += resourceResult.cache.warnings.length;
        }

        results.summary.success++;
        results.summary.totalLoadTime += res.loadTime;
      } else {
        resourceResult.error = `HTTP ${res.statusCode}`;
        results.summary.failed++;
        results.errors.push({
          phase: 'resource-check',
          url: resource.url,
          message: `资源返回异常状态码: ${res.statusCode}`,
        });
      }
    } catch (err) {
      resourceResult.error = err.message;
      results.summary.failed++;
      results.errors.push({
        phase: 'resource-check',
        url: resource.url,
        message: err.message,
      });
    }

    results.resources.push(resourceResult);
  }

  // 5. 计算平均加载时间
  if (results.summary.success > 0) {
    results.summary.avgLoadTime = Math.round(
      results.summary.totalLoadTime / results.summary.success
    );
  }

  return results;
}

module.exports = { testOnline };
