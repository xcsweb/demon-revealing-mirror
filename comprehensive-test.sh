#!/bin/bash

echo "================================================================================"
echo "🔍 照妖镜项目 - 完整自动化测试"
echo "================================================================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试URL
GITHUB_PAGES_URL="https://xcsweb.github.io/demon-revealing-mirror/"
LOCAL_URL="http://localhost:4173/demon-revealing-mirror/"

# 计数器
PASSED=0
FAILED=0
TOTAL=0

# 测试函数
test_url() {
  local url=$1
  local name=$2
  TOTAL=$((TOTAL + 1))

  echo -n "测试 $name... "

  # 使用curl获取HTTP状态码
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

  if [ "$status" -eq 200 ]; then
    echo -e "${GREEN}✅ OK (HTTP $status)${NC}"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAILED (HTTP $status)${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# 测试资源加载函数
test_resource() {
  local resource_url=$1
  local resource_name=$2
  TOTAL=$((TOTAL + 1))

  echo -n "  - $resource_name... "

  status=$(curl -s -o /dev/null -w "%{http_code}" "$resource_url")

  if [ "$status" -eq 200 ]; then
    echo -e "${GREEN}✅ OK${NC}"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAILED (HTTP $status)${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

echo -e "${BLUE}📍 测试目标: $GITHUB_PAGES_URL${NC}"
echo ""

echo "1. 测试主页可访问性"
echo "-----------------------------------"
test_url "$GITHUB_PAGES_URL" "主页"
echo ""

echo "2. 测试关键资源加载"
echo "-----------------------------------"

# 获取主页HTML并提取资源
HTML=$(curl -s "$GITHUB_PAGES_URL")

# 提取JS文件
JS_URL=$(echo "$HTML" | grep -oP 'src="[^"]*\.js"' | head -1 | cut -d'"' -f2)
# 确保是绝对URL
if [[ ! "$JS_URL" =~ ^http ]]; then
  JS_URL="${GITHUB_PAGES_URL}${JS_URL#/}"
fi
test_resource "$JS_URL" "JavaScript主文件"

# 提取CSS文件
CSS_URL=$(echo "$HTML" | grep -oP 'href="[^"]*\.css"' | head -1 | cut -d'"' -f2)
if [[ ! "$CSS_URL" =~ ^http ]]; then
  CSS_URL="${GITHUB_PAGES_URL}${CSS_URL#/}"
fi
test_resource "$CSS_URL" "CSS样式文件"

# 测试favicon
FAVICON_URL="${GITHUB_PAGES_URL}favicon.svg"
test_resource "$FAVICON_URL" "Favicon"
echo ""

echo "3. 测试MediaPipe CDN可访问性"
echo "-----------------------------------"
MEDIAPIPE_BASE="https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/"
test_resource "${MEDIAPIPE_BASE}face_detection_model.bin" "MediaPipe模型文件"
test_resource "${MEDIAPIPE_BASE}face_detection_solution_simd_wasm_bin.wasm" "MediaPipe WASM文件"
test_resource "${MEDIAPIPE_BASE}face_detection_solution_simd_js.js" "MediaPipe JS文件"
echo ""

echo "4. 测试React Router路由"
echo "-----------------------------------"
test_url "${GITHUB_PAGES_URL}mirror" "Mirror页面"
test_url "${GITHUB_PAGES_URL}result" "Result页面"
test_url "${GITHUB_PAGES_URL}?/" "带查询参数的路由"
echo ""

echo "5. 检查GitHub Pages配置"
echo "-----------------------------------"

# 检查是否有404.html
if [ -f "dist/404.html" ]; then
  echo -e "${GREEN}✅ 404.html存在（SPA路由支持）${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ 404.html不存在${NC}"
  FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# 检查index.html
if [ -f "dist/index.html" ]; then
  echo -e "${GREEN}✅ index.html存在${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ index.html不存在${NC}"
  FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))
echo ""

echo "6. 本地开发环境检查（如果运行中）"
echo "-----------------------------------"
if curl -s -o /dev/null -w "%{http_code}" "$LOCAL_URL" | grep -q "200"; then
  echo -e "${GREEN}✅ 本地开发服务器正在运行${NC}"
  test_resource "${LOCAL_URL}assets/index-Bf8iD5kt.js" "本地JS文件"
  test_resource "${LOCAL_URL}assets/index-Dkf4BVc7.css" "本地CSS文件"
else
  echo -e "${YELLOW}⚠️ 本地开发服务器未运行（跳过本地测试）${NC}"
fi
echo ""

echo "================================================================================"
echo "📊 测试结果汇总"
echo "================================================================================"
echo -e "总测试数: ${TOTAL}"
echo -e "${GREEN}通过: ${PASSED}${NC}"
echo -e "${RED}失败: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ 所有测试通过！${NC}"
  echo ""
  echo "如果页面仍然显示白板，问题可能在:"
  echo "  1. JavaScript运行时错误（请在浏览器控制台中查看）"
  echo "  2. MediaPipe加载失败"
  echo "  3. React组件渲染错误"
  echo ""
  echo "建议：使用Playwright浏览器测试来检测JavaScript错误"
  exit 0
else
  echo -e "${RED}❌ 发现 ${FAILED} 个测试失败${NC}"
  echo ""
  echo "请修复上述问题后重新测试"
  exit 1
fi
