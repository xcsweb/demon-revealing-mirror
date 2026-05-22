#!/usr/bin/env node

import https from 'https';

const GITHUB_PAGES_URL = 'https://xcsweb.github.io/demon-revealing-mirror/';

function httpsGet(urlString) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      timeout: 15000,
      headers: {
        'User-Agent': 'Resource-Checker/1.0',
        'Accept': '*/*'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          contentType: res.headers['content-type']
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function extractResources(html, baseUrl) {
  const resources = [];
  const base = new URL(baseUrl);

  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;

  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const src = match[1];
    const absoluteUrl = new URL(src, base).href;
    resources.push({ url: absoluteUrl, type: 'JavaScript', original: src });
  }

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('http') || href.startsWith('/') || href.startsWith('./')) {
      const absoluteUrl = new URL(href, base).href;
      const isStylesheet = match[0].includes('rel="stylesheet"') || match[0].includes("rel='stylesheet'");
      resources.push({
        url: absoluteUrl,
        type: isStylesheet ? 'CSS' : 'Link',
        original: href
      });
    }
  }

  return resources;
}

async function checkResource(url, resourceType) {
  try {
    const response = await httpsGet(url);
    if (response.status >= 200 && response.status < 400) {
      console.log(`✅ ${resourceType}: ${url} - OK (${response.status})`);
      return { success: true, status: response.status, url, type: resourceType };
    } else {
      console.log(`❌ ${resourceType}: ${url} - FAILED (${response.status})`);
      return { success: false, status: response.status, url, type: resourceType };
    }
  } catch (error) {
    console.log(`❌ ${resourceType}: ${url} - ERROR: ${error.message}`);
    return { success: false, error: error.message, url, type: resourceType };
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 照妖镜项目 - GitHub Pages 生产环境测试');
  console.log('='.repeat(80) + '\n');

  console.log(`📍 测试目标: ${GITHUB_PAGES_URL}\n`);

  try {
    console.log('🌐 正在获取主页面...\n');
    const mainPage = await httpsGet(GITHUB_PAGES_URL);

    console.log(`状态码: ${mainPage.status}\n`);

    if (mainPage.status !== 200) {
      console.log(`❌ 错误: 主页面返回状态码 ${mainPage.status}\n`);
      process.exit(1);
    }

    console.log('✅ 主页面获取成功\n');

    const resources = extractResources(mainPage.body, GITHUB_PAGES_URL);
    console.log(`🔗 发现 ${resources.length} 个外部资源:\n`);

    if (resources.length > 0) {
      for (const resource of resources) {
        await checkResource(resource.url, resource.type);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ 所有资源加载测试完成！\n');

    process.exit(0);

  } catch (error) {
    console.log(`\n❌ 测试失败: ${error.message}\n`);
    process.exit(1);
  }
}

main();
