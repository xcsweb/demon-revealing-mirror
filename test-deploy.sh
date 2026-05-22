#!/bin/bash
set -e

BASE_URL="https://xcsweb.github.io/demon-revealing-mirror"

echo "=== 1. 获取首页 HTML ==="
HTML=$(curl -s "$BASE_URL/")
echo "$HTML" | head -20
echo ""

echo "=== 2. 提取资源链接 ==="
JS_URL=$(echo "$HTML" | grep -oE 'src="[^"]+"' | grep -oE '/[^"]+' | head -1)
CSS_URL=$(echo "$HTML" | grep -oE 'href="[^"]+"' | grep -oE '/[^"]+' | grep -v 'favicon' | head -1)

echo "JS: $JS_URL"
echo "CSS: $CSS_URL"
echo ""

echo "=== 3. 测试 JS 文件 ==="
if [ -n "$JS_URL" ]; then
  JS_STATUS=$(curl -sI "$BASE_URL$JS_URL" | head -1)
  JS_SIZE=$(curl -s "$BASE_URL$JS_URL" | wc -c)
  echo "JS Status: $JS_STATUS"
  echo "JS Size: $JS_SIZE bytes"
else
  echo "ERROR: JS URL not found!"
fi
echo ""

echo "=== 4. 测试 CSS 文件 ==="
if [ -n "$CSS_URL" ]; then
  CSS_STATUS=$(curl -sI "$BASE_URL$CSS_URL" | head -1)
  CSS_SIZE=$(curl -s "$BASE_URL$CSS_URL" | wc -c)
  echo "CSS Status: $CSS_STATUS"
  echo "CSS Size: $CSS_SIZE bytes"
else
  echo "ERROR: CSS URL not found!"
fi
echo ""

echo "=== 5. 检查 HTML 完整性 ==="
if echo "$HTML" | grep -q "<div id=\"root\"></div>"; then
  echo "✓ root div found"
else
  echo "✗ root div NOT found!"
fi

if echo "$HTML" | grep -q "</html>"; then
  echo "✓ HTML is complete"
else
  echo "✗ HTML is truncated!"
fi

echo ""
echo "=== 6. 检查 favicon ==="
FAVICON_STATUS=$(curl -sI "$BASE_URL/favicon.svg" | head -1)
echo "Favicon Status: $FAVICON_STATUS"
