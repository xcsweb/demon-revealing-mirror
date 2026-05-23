#!/bin/bash

# 照妖镜项目 - 部署检查和部署脚本
# 使用方法: ./deploy-check.sh

set -e

echo "====================================="
echo "🚀 照妖镜项目 - 部署检查"
echo "====================================="
echo ""

# 1. 检查 Node 版本
echo "📋 步骤 1: 检查 Node 环境"
node -v
npm -v
echo "✅ Node 环境检查完成"
echo ""

# 2. 安装依赖
echo "📋 步骤 2: 安装依赖"
npm install
echo "✅ 依赖安装完成"
echo ""

# 3. 检查类型
echo "📋 步骤 3: 检查 TypeScript 类型"
npm run check
echo "✅ 类型检查完成"
echo ""

# 4. 构建项目
echo "📋 步骤 4: 构建项目"
npm run build
echo "✅ 构建完成"
echo ""

# 5. 本地测试构建产物
echo "📋 步骤 5: 检查构建产物"
ls -la dist/
echo "✅ 构建产物检查完成"
echo ""

# 6. 运行测试脚本
echo "📋 步骤 6: 运行性能测试"
node test-performance.cjs
echo ""

echo "====================================="
echo "🎉 所有检查通过！"
echo "====================================="
echo ""
echo "下一步操作:"
echo "1. 在本地预览测试: npm run preview"
echo "2. 推送到 GitHub 触发自动部署: git push origin main"
echo ""
