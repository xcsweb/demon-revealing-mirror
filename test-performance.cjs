/**
 * 照妖镜性能和错误检查脚本
 * 全面检查部署后的性能、加载时间、资源加载状态
 */

const https = require('https');
const http = require('http');

const GITHUB_PAGES_URL = 'xcsweb.github.io';
const BASE_PATH = '/demon-revealing-mirror/';

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const start = Date.now();
    const req = client.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: data,
        time: Date.now() - start
      }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testPerformance() {
  console.log('🚀 开始性能和错误检查...\n');

  let allOk = true;

  // 1. 首页加载测试
  console.log('📊 测试 1: 首页响应时间');
  try {
    const response = await fetch(`https://${GITHUB_PAGES_URL}${BASE_PATH}`);
    if (response.statusCode === 200) {
      console.log(`  ✅ 首页响应时间: ${response.time}ms`);
      if (response.time > 3000) {
        console.log('  ⚠️ 响应较慢，可能需要优化');
      }
    } else {
      console.log(`  ❌ 首页错误: ${response.statusCode}`);
      allOk = false;
    }
  } catch (error) {
    console.log(`  ❌ 首页失败: ${error.message}`);
    allOk = false;
  }

  // 2. 获取 HTML 内容
  let html;
  try {
    const response = await fetch(`https://${GITHUB_PAGES_URL}${BASE_PATH}`);
    html = response.body;
  } catch (error) {
    console.log('❌ 获取 HTML 失败');
    return;
  }

  // 3. 检查关键资源
  console.log('\n📊 测试 2: 资源文件加载测试');
  
  // 提取 JS 路径
  const jsMatch = html.match(/src="([^"]*\.js)"/);
  let jsPath = jsMatch ? jsMatch[1] : null;
  if (jsPath && !jsPath.startsWith('http')) {
    jsPath = `https://${GITHUB_PAGES_URL}${jsPath}`;
  }

  if (jsPath) {
    try {
      const jsStart = Date.now();
      const response = await fetch(jsPath);
      const jsTime = Date.now() - jsStart;
      const jsSize = response.headers['content-length'] 
        ? `${(parseInt(response.headers['content-length'])/1024).toFixed(1)}KB` 
        : '未知';
      
      console.log(`  ✅ JS 加载时间: ${jsTime}ms (大小: ${jsSize})`);
      
      if (jsTime > 5000) {
        console.log('  ⚠️ JS 加载过慢！');
        allOk = false;
      }
    } catch (error) {
      console.log(`  ❌ JS 加载失败: ${error.message}`);
      allOk = false;
    }
  }

  // 提取 CSS 路径
  const cssMatch = html.match(/href="([^"]*\.css)"/);
  let cssPath = cssMatch ? cssMatch[1] : null;
  if (cssPath && !cssPath.startsWith('http')) {
    cssPath = `https://${GITHUB_PAGES_URL}${cssPath}`;
  }

  if (cssPath) {
    try {
      const cssStart = Date.now();
      const response = await fetch(cssPath);
      const cssTime = Date.now() - cssStart;
      const cssSize = response.headers['content-length'] 
        ? `${(parseInt(response.headers['content-length'])/1024).toFixed(1)}KB` 
        : '未知';
      
      console.log(`  ✅ CSS 加载时间: ${cssTime}ms (大小: ${cssSize})`);
    } catch (error) {
      console.log(`  ❌ CSS 加载失败: ${error.message}`);
      allOk = false;
    }
  }

  // 4. 检查 HTML 关键内容
  console.log('\n📊 测试 3: 关键内容检查');
  
  const checks = [
    { name: '包含 id="root"', pattern: 'id="root"' },
    { name: '包含脚本标签', pattern: '<script' },
    { name: '包含样式标签', pattern: '<link' },
    { name: '包含 favicon', pattern: 'favicon' },
  ];
  
  for (const check of checks) {
    if (html.includes(check.pattern)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name}`);
      allOk = false;
    }
  }

  // 5. 检查响应头
  console.log('\n📊 测试 4: 响应头检查');
  try {
    const response = await fetch(`https://${GITHUB_PAGES_URL}${BASE_PATH}`);
    const headers = response.headers;
    
    console.log(`  ✅ Content-Type: ${headers['content-type']}`);
    
    if (!headers['content-type'].includes('text/html')) {
      console.log('  ❌ Content-Type 不正确');
      allOk = false;
    }
    
    if (headers['cache-control']) {
      console.log(`  ℹ️ 缓存策略: ${headers['cache-control']}`);
    }
  } catch (error) {
    console.log(`  ❌ 响应头检查失败: ${error.message}`);
  }

  // 6. 检查是否有常见的错误源
  console.log('\n📊 测试 5: 潜在问题检查');
  const issues = [];
  
  // 检查 base URL
  if (!html.includes('base')) {
    console.log('  ⚠️ 可能缺少 base URL 配置');
  }
  
  // 检查脚本类型
  if (html.includes('type="module"')) {
    console.log('  ℹ️ 使用了 ES Modules（兼容现代浏览器）');
  } else {
    console.log('  ⚠️ 未检测到 ES Modules 标记');
  }

  // 总结
  console.log('\n' + '='.repeat(60));
  if (allOk) {
    console.log('✅ 主要功能测试通过！部署看起来正常。');
    console.log('\n💡 如果页面仍然是白板，请尝试:');
    console.log('   1. 清除浏览器缓存并刷新');
    console.log('   2. 使用浏览器开发者工具检查控制台错误');
    console.log('   3. 检查网络面板看资源加载状态');
  } else {
    console.log('❌ 发现问题！请检查上面的错误。');
  }
  console.log('='.repeat(60));

  return allOk;
}

testPerformance().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
