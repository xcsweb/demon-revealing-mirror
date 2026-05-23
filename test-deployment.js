/**
 * 照妖镜部署测试脚本
 * 测试 GitHub Pages 部署是否成功
 */

const https = require('https');
const http = require('http');

const GITHUB_PAGES_URL = 'xcsweb.github.io';
const BASE_PATH = '/demon-revealing-mirror/';

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: data
      }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function checkContent(html, checks) {
  const results = [];
  for (const check of checks) {
    const found = html.includes(check);
    results.push({ check, found });
  }
  return results;
}

async function runTests() {
  console.log('🧪 开始测试照妖镜部署...\n');
  
  let allPassed = true;

  // 测试1: 检查首页是否可访问
  console.log('📋 测试 1: 检查首页可访问性');
  try {
    const response = await fetch(`https://${GITHUB_PAGES_URL}${BASE_PATH}`);
    if (response.statusCode === 200) {
      console.log('  ✅ 首页可访问 (HTTP 200)');
    } else {
      console.log(`  ❌ 首页返回状态码: ${response.statusCode}`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ 首页访问失败: ${error.message}`);
    allPassed = false;
  }

  // 测试2: 检查 HTML 内容
  console.log('\n📋 测试 2: 检查 HTML 内容');
  try {
    const response = await fetch(`https://${GITHUB_PAGES_URL}${BASE_PATH}`);
    const html = response.body;
    
    const checks = [
      { name: '包含 root 容器', pattern: 'id="root"' },
      { name: '包含标题', pattern: '照妖镜' },
      { name: '包含 JS 引用', pattern: '<script' },
      { name: '包含 CSS 引用', pattern: '<link' },
      { name: '包含 SPA 路由脚本', pattern: '单页应用' },
    ];
    
    for (const check of checks) {
      if (html.includes(check.pattern)) {
        console.log(`  ✅ ${check.name}`);
      } else {
        console.log(`  ❌ ${check.name}`);
        allPassed = false;
      }
    }
  } catch (error) {
    console.log(`  ❌ HTML 内容检查失败: ${error.message}`);
    allPassed = false;
  }

  // 测试3: 检查 JS 文件是否存在
  console.log('\n📋 测试 3: 检查 JS 资源文件');
  try {
    const response = await fetch(`https://${GITHUB_PAGES_URL}${BASE_PATH}`);
    const html = response.body;
    
    // 提取 JS 文件路径
    const jsMatch = html.match(/src="([^"]*\.js)"/);
    if (jsMatch) {
      const jsPath = jsMatch[1];
      const jsUrl = jsPath.startsWith('http') ? jsPath : `https://${GITHUB_PAGES_URL}${jsPath}`;
      
      try {
        const jsResponse = await fetch(jsUrl);
        if (jsResponse.statusCode === 200) {
          console.log(`  ✅ JS 文件可访问: ${jsPath}`);
          
          // 检查 JS 内容是否包含关键代码
          const jsContent = jsResponse.body;
          const hasReact = jsContent.includes('react') || jsContent.includes('createElement');
          const hasRouter = jsContent.includes('Router') || jsContent.includes('Route');
          
          if (hasReact) console.log('  ✅ 包含 React 代码');
          if (hasRouter) console.log('  ✅ 包含路由代码');
        } else {
          console.log(`  ❌ JS 文件返回状态码: ${jsResponse.statusCode}`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`  ❌ JS 文件访问失败: ${error.message}`);
        allPassed = false;
      }
    } else {
      console.log('  ❌ 未找到 JS 文件引用');
      allPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ JS 资源检查失败: ${error.message}`);
    allPassed = false;
  }

  // 测试4: 检查 CSS 文件是否存在
  console.log('\n📋 测试 4: 检查 CSS 资源文件');
  try {
    const response = await fetch(`https://${GITHUB_PAGES_URL}${BASE_PATH}`);
    const html = response.body;
    
    // 提取 CSS 文件路径
    const cssMatch = html.match(/href="([^"]*\.css)"/);
    if (cssMatch) {
      const cssPath = cssMatch[1];
      const cssUrl = cssPath.startsWith('http') ? cssPath : `https://${GITHUB_PAGES_URL}${cssPath}`;
      
      try {
        const cssResponse = await fetch(cssUrl);
        if (cssResponse.statusCode === 200) {
          console.log(`  ✅ CSS 文件可访问: ${cssPath}`);
        } else {
          console.log(`  ❌ CSS 文件返回状态码: ${cssResponse.statusCode}`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`  ❌ CSS 文件访问失败: ${error.message}`);
        allPassed = false;
      }
    } else {
      console.log('  ❌ 未找到 CSS 文件引用');
      allPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ CSS 资源检查失败: ${error.message}`);
    allPassed = false;
  }

  // 测试5: 检查 404 页面
  console.log('\n📋 测试 5: 检查 404 页面配置');
  try {
    const response = await fetch(`https://${GITHUB_PAGES_URL}${BASE_PATH}404.html`);
    if (response.statusCode === 200) {
      console.log('  ✅ 404.html 存在');
    } else {
      console.log(`  ⚠️ 404.html 返回状态码: ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`  ⚠️ 404.html 检查失败: ${error.message}`);
  }

  // 测试6: 检查关键路由
  console.log('\n📋 测试 6: 检查路由页面');
  const routes = ['/mirror', '/result'];
  for (const route of routes) {
    try {
      const response = await fetch(`https://${GITHUB_PAGES_URL}${BASE_PATH}${route}`);
      if (response.statusCode === 200) {
        console.log(`  ✅ 路由 ${route} 可访问`);
      } else {
        console.log(`  ⚠️ 路由 ${route} 返回状态码: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`  ⚠️ 路由 ${route} 检查失败: ${error.message}`);
    }
  }

  // 总结
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ 所有测试通过！部署看起来正常。');
  } else {
    console.log('❌ 部分测试失败，请检查部署状态。');
  }
  console.log('='.repeat(50));
  
  return allPassed;
}

// 运行测试
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
