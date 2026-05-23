# 创建部署测试 Skill Spec

## Why
项目部署到 GitHub Pages 后频繁出现白板问题（资源 404、缓存不匹配、路径错误等）。需要一个自动化的部署测试 Skill，覆盖：本地开发测试、构建验证、部署后线上资源检查、功能测试，确保每次部署都可靠。

## What Changes
- 创建 `deploy-test` Skill，提供一键式部署测试流程
- Skill 包含：本地开发服务器启动、构建验证、部署触发、线上资源检查、功能测试
- 生成可复用的测试脚本和检查清单

## Impact
- 新增 Skill 配置和测试脚本
- 影响部署流程，每次部署后自动验证

## ADDED Requirements

### Requirement: 本地开发测试
The system SHALL 启动本地开发服务器并验证基础功能：
- 启动 `npm run dev` 或 `vite`
- 检查首页可访问（HTTP 200）
- 检查关键 DOM 元素（`#root` 存在）
- 检查无控制台致命错误

#### Scenario: 开发服务器正常
- **WHEN** 执行本地开发测试
- **THEN** 服务器启动成功，首页返回 200，包含 `#root`

### Requirement: 构建验证
The system SHALL 验证生产构建产物：
- 执行 `npm run build`
- 检查 `dist/` 目录存在且非空
- 检查 `index.html` 包含正确的资源引用（JS、CSS）
- 检查资源文件大小合理（JS < 500KB, CSS < 100KB）
- 检查 `base` 标签或路径配置正确

#### Scenario: 构建成功
- **WHEN** 执行构建验证
- **THEN** 构建无错误，产物完整，路径配置正确

### Requirement: 部署后线上检查
The system SHALL 部署完成后检查线上环境：
- 等待 GitHub Pages 部署完成（轮询检查）
- 检查线上首页 HTTP 200
- 检查所有资源文件可访问（JS、CSS、图片等，无 404）
- 检查响应头 Content-Type 正确
- 检查加载时间 < 5 秒

#### Scenario: 线上资源完整
- **WHEN** 部署完成后执行线上检查
- **THEN** 所有资源返回 200，无 404，加载时间合理

### Requirement: 功能测试
The system SHALL 执行基础功能验证：
- 检查页面标题正确
- 检查关键文本内容存在（如"照妖镜"）
- 检查路由可访问（`/`、`/mirror`、`/result`）
- **可选**：使用 Playwright 进行浏览器自动化测试

#### Scenario: 功能正常
- **WHEN** 执行功能测试
- **THEN** 页面内容正确，路由可访问

### Requirement: 生成报告
The system SHALL 生成测试报告：
- 汇总所有检查结果（通过/失败）
- 记录加载时间和资源大小
- 失败时提供明确的错误信息和修复建议

#### Scenario: 测试完成
- **WHEN** 所有测试执行完毕
- **THEN** 生成清晰的测试报告
