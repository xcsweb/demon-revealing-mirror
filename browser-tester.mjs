#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.argv[2] || 'http://localhost:4173/demon-revealing-mirror/';
const OUTPUT_FILE = path.join(__dirname, 'browser-test-report.txt');

let report = [];

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

async function main() {
  console.log('\n' + '='.repeat(80));
  log('🌐 照妖镜项目 - 浏览器渲染测试工具', 'title');
  console.log('='.repeat(80) + '\n');

  log(`📍 测试目标: ${BASE_URL}`, 'info');
  log(`📅 测试时间: ${new Date().toLocaleString('zh-CN')}`, 'info');

  let browser;
  let consoleErrors = [];
  let consoleWarnings = [];

  try {
    log('\n🚀 启动浏览器...', 'info');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        consoleErrors.push(text);
        log(`浏览器控制台错误: ${text}`, 'error');
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        log(`浏览器控制台警告: ${text}`, 'warning');
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      log(`页面JavaScript错误: ${error.message}`, 'error');
    });

    page.on('requestfailed', request => {
      const failure = request.failure();
      log(`资源加载失败: ${request.url()} - ${failure.errorText}`, 'error');
    });

    log('🌐 正在访问页面...', 'info');
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    log('✅ 页面加载完成', 'success');

    await page.waitForTimeout(2000);

    log('\n📊 页面渲染检查:', 'title');

    const title = await page.title();
    log(`  页面标题: ${title}`, 'info');

    const rootElement = await page.$('#root');
    if (rootElement) {
      log('  ✅ Root元素存在', 'success');

      const rootContent = await rootElement.innerHTML();
      const rootLength = rootContent.length;

      log(`  Root元素内容长度: ${rootLength} 字符`, 'info');

      if (rootLength > 0) {
        log('  ✅ Root元素有内容（React应用已渲染）', 'success');

        const childCount = await page.evaluate(() => {
          const root = document.getElementById('root');
          return root ? root.children.length : 0;
        });

        log(`  Root元素子元素数量: ${childCount}`, 'info');

        if (childCount === 0) {
          log('  ⚠️ Root元素存在但没有子元素，可能渲染失败', 'warning');
        }
      } else {
        log('  ❌ Root元素为空，React应用未渲染！', 'error');
      }
    } else {
      log('  ❌ Root元素不存在！', 'error');
    }

    const visibleText = await page.evaluate(() => {
      const root = document.getElementById('root');
      if (!root) return '';

      const getVisibleText = (element) => {
        let text = '';
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        while (node = walker.nextNode()) {
          const trimmed = node.textContent.trim();
          if (trimmed) {
            text += trimmed + ' ';
          }
        }

        return text.trim();
      };

      return getVisibleText(root);
    });

    log(`\n📝 页面可见文本: "${visibleText.substring(0, 200)}${visibleText.length > 200 ? '...' : ''}"`, 'info');

    if (visibleText.length === 0) {
      log('  ⚠️ 页面没有任何可见文本，可能渲染失败', 'warning');
    }

    log('\n🔍 检查页面元素:', 'title');

    const elements = await page.evaluate(() => {
      const checks = {
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
        images: document.querySelectorAll('img').length,
        inputs: document.querySelectorAll('input').length,
        divs: document.querySelectorAll('div').length,
        spans: document.querySelectorAll('span').length
      };

      return checks;
    });

    log(`  按钮: ${elements.buttons}`, 'info');
    log(`  链接: ${elements.links}`, 'info');
    log(`  图片: ${elements.images}`, 'info');
    log(`  输入框: ${elements.inputs}`, 'info');
    log(`  Div: ${elements.divs}`, 'info');
    log(`  Span: ${elements.spans}`, 'info');

    const totalElements = elements.buttons + elements.links + elements.images +
                         elements.inputs + elements.divs + elements.spans;

    if (totalElements > 5) {
      log(`  ✅ 页面包含足够元素（${totalElements}个）`, 'success');
    } else {
      log(`  ⚠️ 页面元素较少（${totalElements}个），可能渲染不完整`, 'warning');
    }

    log('\n🎯 测试路由功能:', 'title');

    const routes = ['/', '/mirror', '/result'];
    for (const route of routes) {
      try {
        const fullUrl = new URL(route, BASE_URL).href;
        await page.goto(fullUrl, {
          waitUntil: 'networkidle',
          timeout: 10000
        });

        await page.waitForTimeout(1000);

        const routeRoot = await page.$('#root');
        if (routeRoot) {
          const routeContent = await routeRoot.innerHTML();
          if (routeContent.length > 0) {
            log(`  ✅ 路由 ${route} 渲染成功`, 'success');
          } else {
            log(`  ❌ 路由 ${route} 渲染失败（空白）`, 'error');
          }
        }
      } catch (error) {
        log(`  ❌ 路由 ${route} 加载失败: ${error.message}`, 'error');
      }
    }

    log('\n' + '='.repeat(80));
    log('📊 测试结果汇总:', 'title');

    log(`  控制台错误数: ${consoleErrors.length}`, consoleErrors.length > 0 ? 'error' : 'success');
    log(`  控制台警告数: ${consoleWarnings.length}`, consoleWarnings.length > 0 ? 'warning' : 'success');

    if (consoleErrors.length > 0) {
      log('\n❌ 发现JavaScript错误:', 'error');
      consoleErrors.forEach((error, index) => {
        log(`  ${index + 1}. ${error}`, 'error');
      });
    }

    if (consoleWarnings.length > 0) {
      log('\n⚠️ 发现控制台警告:', 'warning');
      consoleWarnings.forEach((warning, index) => {
        if (index < 5) {
          log(`  ${index + 1}. ${warning.substring(0, 100)}`, 'warning');
        }
      });
    }

    const hasContent = visibleText.length > 0 && totalElements > 5;

    if (hasContent && consoleErrors.length === 0) {
      log('\n✅ 页面渲染正常，无JavaScript错误！', 'success');
    } else if (hasContent && consoleErrors.length > 0) {
      log('\n⚠️ 页面有内容但存在JavaScript错误', 'warning');
    } else {
      log('\n❌ 页面渲染失败或空白', 'error');
    }

    log('\n' + '='.repeat(80));

    const reportContent = report.join('\n');
    fs.writeFileSync(OUTPUT_FILE, reportContent, 'utf-8');
    log(`\n📄 详细报告已保存至: ${OUTPUT_FILE}`, 'info');

    await browser.close();

    process.exit(hasContent && consoleErrors.length === 0 ? 0 : 1);

  } catch (error) {
    log(`\n❌ 测试过程中发生错误: ${error.message}`, 'error');
    log(`错误详情: ${error.stack}`, 'error');

    const errorReport = report.join('\n') + '\n\n' + error.stack;
    fs.writeFileSync(OUTPUT_FILE, errorReport, 'utf-8');

    if (browser) await browser.close();

    process.exit(1);
  }
}

main();
