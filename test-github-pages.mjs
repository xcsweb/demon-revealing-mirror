#!/usr/bin/env node

import http from 'http';
import https from 'https';
import { URL } from 'url';

const GITHUB_PAGES_URL = 'https://xcsweb.github.io/demon-revealing-mirror/';
const TIMEOUT = 15000;

let consoleErrors = [];
let resourceFailures = [];

function httpGet(urlString) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlString);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'GitHub-Pages-Tester/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = protocol.request(options, (res) => {
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

async function checkResource(url, resourceType) {
  try {
    const response = await httpGet(url);
    if (response.status >= 200 && response.status < 400) {
      console.log(`✅ ${resourceType}: ${url} - OK (${response.status})`);
      return { success: true, status: response.status, url, type: resourceType };
    } else {
      console.log(`❌ ${resourceType}: ${url} - FAILED (${response.status})`);
      resourceFailures.push({ url, status: response.status, type: resourceType });
      return { success: false, status: response.status, url, type: resourceType };
    }
  } catch (error) {
    console.log(`❌ ${resourceType}: ${url} - ERROR: ${error.message}`);
    resourceFailures.push({ url, error: error.message, type: resourceType });
    return { success: false, error: error.message, url, type: resourceType };
  }
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

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 照妖镜项目 - GitHub Pages 生产环境测试');
  console.log('='.repeat(80) + '\n');

  console.log(`📍 测试目标: ${GITHUB_PAGES_URL}\n`);

  try {
    console.log('🌐 正在获取主页面...\n');
    const mainPage = await httpGet(GITHUB_PAGES_URL);

    console.log(`状态码: ${mainPage.status}`);
    console.log(`Content-Type: ${mainPage.contentType || 'N/A'}\n`);

    if (mainPage.status !== 200) {
      console.log(`❌ 错误: 主页面返回状态码 ${mainPage.status}\n`);
      console.log('可能的问题:');
      console.log('1. GitHub Pages 未正确配置');
      console.log('2. 仓库名与 base 路径不匹配');
      console.log('3. 部署未完成或失败\n');
      process.exit(1);
    }

    console.log('✅ 主页面获取成功\n');

    const resources = extractResources(mainPage.body, GITHUB_PAGES_URL);
    console.log(`🔗 发现 ${resources.length} 个外部资源:\n`);

    if (resources.length === 0) {
      console.log('⚠️ 警告: 未发现任何外部资源\n');
    } else {
      for (const resource of resources) {
        await checkResource(resource.url, resource.type);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 测试结果汇总:\n');

    if (resourceFailures.length === 0) {
      console.log('✅ 所有资源加载正常！\n');
      console.log('如果页面仍然显示白板，问题可能在:');
      console.log('1. JavaScript 运行时错误（检查浏览器控制台）');
      console.log('2. React Router 路由配置问题');
      console.log('3. CDN 资源（MediaPipe）加载失败\n');
    } else {
      console.log(`❌ 发现 ${resourceFailures.length} 个资源加载失败:\n`);
      resourceFailures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.type}: ${failure.url}`);
        if (failure.status) console.log(`   状态码: ${failure.status}`);
        if (failure.error) console.log(`   错误: ${failure.error}`);
      });
      console.log('');
    }

    console.log('='.repeat(80) + '\n');

    process.exit(resourceFailures.length > 0 ? 1 : 0);

  } catch (error) {
    console.log(`\n❌ 测试失败: ${error.message}\n`);
    console.log('可能的原因:');
    console.log('1. 网络连接问题');
    console.log('2. GitHub Pages 服务不可用');
    console.log('3. DNS 解析失败\n');
    process.exit(1);
  }
}

main();
