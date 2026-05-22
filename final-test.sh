#!/bin/bash

echo "================================================================================"
echo "🔍 照妖镜项目 - 资源加载最终测试"
echo "================================================================================"
echo ""

GITHUB_PAGES_URL="https://xcsweb.github.io/demon-revealing-mirror/"

echo "测试GitHub Pages上的关键资源:"
echo ""

echo "1. 主页"
curl -s -o /dev/null -w "状态码: %{http_code}\n" "$GITHUB_PAGES_URL"

echo ""
echo "2. JavaScript文件"
curl -s -o /dev/null -w "状态码: %{http_code}\n" "${GITHUB_PAGES_URL}assets/index-Bf8iD5kt.js"

echo ""
echo "3. CSS文件"
curl -s -o /dev/null -w "状态码: %{http_code}\n" "${GITHUB_PAGES_URL}assets/index-Dkf4BVc7.css"

echo ""
echo "4. Favicon"
curl -s -o /dev/null -w "状态码: %{http_code}\n" "${GITHUB_PAGES_URL}favicon.svg"

echo ""
echo "5. 404页面"
curl -s -o /dev/null -w "状态码: %{http_code}\n" "${GITHUB_PAGES_URL}404.html"

echo ""
echo "6. MediaPipe CDN测试"
echo "  - WASM文件"
curl -s -o /dev/null -w "状态码: %{http_code}\n" "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/face_detection_solution_simd_wasm_bin.wasm"
echo "  - JS文件"
curl -s -o /dev/null -w "状态码: %{http_code}\n" "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/face_detection_solution_simd_js.js"

echo ""
echo "================================================================================"
echo "✅ 所有关键资源测试完成"
echo "================================================================================"
echo ""
echo "下一步：使用Playwright进行浏览器渲染测试"
echo ""
