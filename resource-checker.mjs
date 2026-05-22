#!/usr/bin/env node

import http from 'http';
import https from 'https';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.argv[2] || 'http://localhost:4173/demon-revealing-mirror/';
const OUTPUT_FILE = path.join(__dirname, 'resource-check-report.txt');

let report = [];
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    title: '\n📋'
  }[type] || '•';

  const logMessage = `${prefix} [${timestamp}] ${message}`;
  console.log(logMessage);
  report.push(logMessage);
}

function httpGet(urlString) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlString);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Resource-Check-Script/1.0',
        'Accept': '*/*'
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
  totalChecks++;
  try {
    const response = await httpGet(url);

    if (response.status >= 200 && response.status < 400) {
      passedChecks++;
      log(`${resourceType}: ${url} - OK (${response.status})`, 'success');

      if (response.contentType) {
        log(`  Content-Type: ${response.contentType}`, 'info');
      }

      return { success: true, status: response.status, url, type: resourceType };
    } else {
      failedChecks++;
      log(`${resourceType}: ${url} - FAILED (${response.status})`, 'error');
      return { success: false, status: response.status, url, type: resourceType };
    }
  } catch (error) {
    failedChecks++;
    log(`${resourceType}: ${url} - ERROR: ${error.message}`, 'error');
    return { success: false, error: error.message, url, type: resourceType };
  }
}

function extractResources(html, baseUrl) {
  const resources = [];
  const base = new URL(baseUrl);

  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const styleRegex = /<style[^>]*>[\s\S]*?url\(["']?([^"')]+)["']?\)/gi;

  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const src = match[1];
    const absoluteUrl = new URL(src, base).href;
    resources.push({ url: absoluteUrl, type: 'JavaScript', original: src });
  }

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('http') || href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
      const absoluteUrl = new URL(href, base).href;
      const isStylesheet = match[0].includes('rel="stylesheet"') || match[0].includes("rel='stylesheet'");
      resources.push({
        url: absoluteUrl,
        type: isStylesheet ? 'CSS' : 'Link',
        original: href
      });
    }
  }

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (!src.startsWith('data:')) {
      const absoluteUrl = new URL(src, base).href;
      resources.push({ url: absoluteUrl, type: 'Image', original: src });
    }
  }

  return resources;
}

function extractInlineScripts(html) {
  const inlineScripts = [];
  const scriptRegex = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1].trim();
    if (content && content.length > 0) {
      inlineScripts.push({
        content: content,
        length: content.length
      });
    }
  }

  return inlineScripts;
}

function analyzeHTMLStructure(html) {
  log('\n📊 HTML结构分析:', 'title');

  const hasRoot = html.includes('id="root"');
  const hasBody = html.includes('<body>');
  const hasScripts = (html.match(/<script/gi) || []).length;
  const hasStyles = (html.match(/<style/gi) || []).length;

  log(`  Root元素: ${hasRoot ? '✅ 存在' : '❌ 缺失'}`, hasRoot ? 'success' : 'error');
  log(`  Body元素: ${hasBody ? '✅ 存在' : '❌ 缺失'}`, hasBody ? 'success' : 'error');
  log(`  Script标签数: ${hasScripts}`, 'info');
  log(`  Style标签数: ${hasStyles}`, 'info');
}

async function checkLocalDist() {
  log('\n📁 检查本地构建目录:', 'title');

  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');
  const assetsPath = path.join(distPath, 'assets');

  if (!fs.existsSync(distPath)) {
    log('  ❌ dist目录不存在 - 需要先运行 npm run build', 'error');
    return;
  }

  log('  ✅ dist目录存在', 'success');

  if (fs.existsSync(indexPath)) {
    log('  ✅ index.html存在', 'success');
    const html = fs.readFileSync(indexPath, 'utf-8');
    log(`  📄 index.html大小: ${(Buffer.byteLength(html) / 1024).toFixed(2)} KB`, 'info');
  } else {
    log('  ❌ index.html缺失', 'error');
  }

  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);
    log(`  ✅ assets目录存在，包含 ${files.length} 个文件:`, 'success');
    files.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const size = fs.statSync(filePath).size;
      log(`     - ${file} (${(size / 1024).toFixed(2)} KB)`, 'info');
    });
  } else {
    log('  ⚠️ assets目录不存在或为空', 'warning');
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  log('🔍 照妖镜项目 - 资源加载自动化测试工具', 'title');
  console.log('='.repeat(80) + '\n');

  log(`📍 测试目标: ${BASE_URL}`, 'info');
  log(`📅 测试时间: ${new Date().toLocaleString('zh-CN')}`, 'info');

  try {
    await checkLocalDist();

    log('\n🌐 获取主页面HTML:', 'title');
    const mainPage = await httpGet(BASE_URL);

    if (mainPage.status !== 200) {
      log(`❌ 主页面返回错误状态码: ${mainPage.status}`, 'error');
      process.exit(1);
    }

    log('✅ 主页面获取成功', 'success');
    log(`  状态码: ${mainPage.status}`, 'info');

    analyzeHTMLStructure(mainPage.body);

    const resources = extractResources(mainPage.body, BASE_URL);
    log(`\n🔗 发现 ${resources.length} 个外部资源:`, 'title');

    if (resources.length === 0) {
      log('  ⚠️ 未发现任何外部资源，可能存在问题', 'warning');
    } else {
      for (const resource of resources) {
        await checkResource(resource.url, resource.type);
      }
    }

    const inlineScripts = extractInlineScripts(mainPage.body);
    log(`\n📜 内联脚本分析:`, 'title');
    log(`  发现 ${inlineScripts.length} 个内联脚本`, 'info');

    log('\n' + '='.repeat(80));
    log('📊 测试结果汇总:', 'title');
    log(`  总检查数: ${totalChecks}`, 'info');
    log(`  通过: ${passedChecks} ✅`, passedChecks > 0 ? 'success' : 'warning');
    log(`  失败: ${failedChecks} ❌`, failedChecks > 0 ? 'error' : 'success');

    if (failedChecks === 0 && passedChecks > 0) {
      log('\n✅ 所有资源加载正常！', 'success');
    } else if (failedChecks > 0) {
      log(`\n⚠️ 发现 ${failedChecks} 个资源加载失败！`, 'error');
    }

    log('\n' + '='.repeat(80));

    const reportContent = report.join('\n');
    fs.writeFileSync(OUTPUT_FILE, reportContent, 'utf-8');
    log(`\n📄 详细报告已保存至: ${OUTPUT_FILE}`, 'info');

    process.exit(failedChecks > 0 ? 1 : 0);

  } catch (error) {
    log(`\n❌ 测试过程中发生错误: ${error.message}`, 'error');
    log(`错误详情: ${error.stack}`, 'error');

    const errorReport = report.join('\n') + '\n\n' + error.stack;
    fs.writeFileSync(OUTPUT_FILE, errorReport, 'utf-8');

    process.exit(1);
  }
}

main();
