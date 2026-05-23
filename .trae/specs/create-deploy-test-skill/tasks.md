# Tasks

- [ ] Task 1: 创建 Skill 配置文件和元数据
  - [ ] SubTask 1.1: 创建 Skill 目录结构和 `skill.json`
  - [ ] SubTask 1.2: 定义 Skill 名称、描述、入口命令
  - [ ] SubTask 1.3: 配置 Skill 参数（项目路径、部署 URL、超时时间等）

- [ ] Task 2: 实现本地开发测试模块
  - [ ] SubTask 2.1: 编写启动本地服务器的脚本（支持 vite dev）
  - [ ] SubTask 2.2: 编写首页可访问性检查（HTTP 200、DOM 检查）
  - [ ] SubTask 2.3: 编写控制台错误捕获逻辑

- [ ] Task 3: 实现构建验证模块
  - [ ] SubTask 3.1: 编写构建命令执行和错误检查
  - [ ] SubTask 3.2: 编写 dist 产物完整性检查（文件存在、大小）
  - [ ] SubTask 3.3: 编写 HTML 资源引用验证（JS、CSS 路径）
  - [ ] SubTask 3.4: 编写 base 标签和路径配置检查

- [ ] Task 4: 实现部署后线上检查模块
  - [ ] SubTask 4.1: 编写部署状态轮询检测（GitHub Pages）
  - [ ] SubTask 4.2: 编写线上资源 404 检查（遍历所有资源）
  - [ ] SubTask 4.3: 编写响应头和加载时间检查
  - [ ] SubTask 4.4: 编写缓存问题检测逻辑

- [ ] Task 5: 实现功能测试模块
  - [ ] SubTask 5.1: 编写页面内容检查（标题、关键文本）
  - [ ] SubTask 5.2: 编写路由可访问性检查
  - [ ] SubTask 5.3: **可选** 集成 Playwright 浏览器测试

- [ ] Task 6: 实现报告生成和 CLI 界面
  - [ ] SubTask 6.1: 编写测试结果汇总和格式化输出
  - [ ] SubTask 6.2: 编写失败时的诊断建议和修复指南
  - [ ] SubTask 6.3: 编写彩色 CLI 输出和进度指示

- [ ] Task 7: 集成测试和文档
  - [ ] SubTask 7.1: 在照妖镜项目上端到端测试 Skill
  - [ ] SubTask 7.2: 编写 Skill 使用文档和示例
  - [ ] SubTask 7.3: 验证 Skill 可重复执行无残留进程

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 1
- Task 4 依赖 Task 1
- Task 5 依赖 Task 1
- Task 6 依赖 Task 2、3、4、5
- Task 7 依赖 Task 6
