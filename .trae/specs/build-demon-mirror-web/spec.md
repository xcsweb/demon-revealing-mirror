# 照妖镜 Web 应用 Spec

## Why
用户需要一个基于浏览器的趣味人脸检测应用"照妖镜"，通过摄像头实时检测人脸并叠加妖怪特效。项目需要兼容 PC 和移动端，纯前端实现，无需后端。

## What Changes
- 新建 React + TypeScript + Vite 前端项目
- 集成 MediaPipe Face Detection 进行人脸检测
- 实现启动页、摄像头实时检测页、结果预览页
- 实现多种妖怪特效（红眼、獠牙、恶魔角、幽灵等）
- 实现拍照/截图下载功能
- 响应式设计，兼容 PC 和移动端

## Impact
- 新增纯前端 Web 应用
- 依赖 @mediapipe/face_detection、zustand、lucide-react
- 需要摄像头权限

## ADDED Requirements

### Requirement: 启动页
The system SHALL provide a start page with:
- 展示"照妖镜"标题，带金色发光动画
- 古风/玄幻风格背景
- "开始"按钮，点击后请求摄像头权限并进入主页面

#### Scenario: 正常进入
- **WHEN** 用户打开应用
- **THEN** 展示启动页，标题有脉冲发光动画

#### Scenario: 点击开始
- **WHEN** 用户点击开始按钮
- **THEN** 请求摄像头权限，授权成功后跳转到主页面

### Requirement: 摄像头实时检测页
The system SHALL provide a real-time camera page with:
- 全屏/自适应摄像头视频流
- MediaPipe 实时人脸检测
- 在人脸位置叠加 Canvas 妖怪特效
- 底部控制面板：特效切换、拍照按钮、前后摄像头切换（移动端）
- 人脸检测框带呼吸灯效果

#### Scenario: 检测到人脸
- **WHEN** MediaPipe 检测到人脸
- **THEN** 在人脸位置绘制红色发光检测框，并叠加当前选中的妖怪特效

#### Scenario: 切换特效
- **WHEN** 用户点击特效按钮
- **THEN** 切换 Canvas 上绘制的特效类型

#### Scenario: 拍照
- **WHEN** 用户点击拍照按钮
- **THEN** 触发闪光灯动画，将当前 Canvas 内容保存为图片并跳转到结果页

### Requirement: 结果预览页
The system SHALL provide a result preview page with:
- 居中展示拍摄的图片
- 下载按钮：将图片保存到本地
- 重拍按钮：返回摄像头页面

#### Scenario: 下载图片
- **WHEN** 用户点击下载按钮
- **THEN** 触发浏览器下载当前图片

### Requirement: 响应式设计
The system SHALL be responsive:
- PC 端：最大宽度限制，居中展示，16:9 比例摄像头区域
- 移动端：全屏沉浸式，底部控制面板，按钮适配触摸
- 支持横屏/竖屏切换

## MODIFIED Requirements
无

## REMOVED Requirements
无
