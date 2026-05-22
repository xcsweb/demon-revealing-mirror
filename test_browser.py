from playwright.sync_api import sync_playwright

def test_page():
    with sync_playwright() as p:
        print("🚀 启动浏览器...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 监听控制台错误
        console_errors = []
        console_warnings = []

        def handle_console(msg):
            if msg.type == 'error':
                console_errors.append(msg.text)
                print(f"❌ 控制台错误: {msg.text}")
            elif msg.type == 'warning':
                console_warnings.append(msg.text)

        page.on('console', handle_console)

        # 监听页面错误
        page_errors = []
        def handle_page_error(error):
            page_errors.append(str(error))
            print(f"❌ 页面错误: {error}")

        page.on('pageerror', handle_page_error)

        print("🌐 访问本地预览服务器...")
        try:
            page.goto('http://localhost:4173/demon-revealing-mirror/', timeout=30000)
            print("✅ 页面加载成功")
        except Exception as e:
            print(f"❌ 页面加载失败: {e}")
            browser.close()
            return False

        # 等待页面稳定
        page.wait_for_load_state('networkidle')
        print("✅ 网络请求完成")

        # 等待React渲染
        page.wait_for_timeout(3000)

        # 检查root元素
        root = page.locator('#root')
        if root.count() == 0:
            print("❌ 未找到#root元素")
            browser.close()
            return False

        print("✅ 找到#root元素")

        # 检查root元素内容
        root_html = root.inner_html()
        if len(root_html) > 0:
            print(f"✅ #root元素有内容 ({len(root_html)} 字符)")

            # 检查是否有可见元素
            visible_elements = page.locator('body').inner_text()
            if visible_elements.strip():
                print(f"✅ 页面有可见文本: {visible_elements[:100]}...")
            else:
                print("⚠️ 页面没有可见文本")
        else:
            print("❌ #root元素为空，React可能未渲染")

        # 截图
        page.screenshot(path='/tmp/local-preview.png', full_page=True)
        print("📸 截图已保存到 /tmp/local-preview.png")

        # 测试GitHub Pages版本
        print("\n🌐 测试GitHub Pages版本...")
        try:
            page.goto('https://xcsweb.github.io/demon-revealing-mirror/', timeout=30000)
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(3000)

            github_root = page.locator('#root')
            github_html = github_root.inner_html()

            if len(github_html) > 0:
                print(f"✅ GitHub Pages版本渲染成功 ({len(github_html)} 字符)")
            else:
                print("❌ GitHub Pages版本渲染失败")

            page.screenshot(path='/tmp/github-pages.png', full_page=True)
            print("📸 GitHub Pages截图已保存到 /tmp/github-pages.png")

        except Exception as e:
            print(f"❌ GitHub Pages测试失败: {e}")

        # 打印结果汇总
        print("\n" + "="*80)
        print("📊 测试结果汇总:")
        print("="*80)
        print(f"控制台错误: {len(console_errors)}")
        if console_errors:
            for i, error in enumerate(console_errors[:5], 1):
                print(f"  {i}. {error}")

        print(f"\n页面错误: {len(page_errors)}")
        if page_errors:
            for i, error in enumerate(page_errors[:5], 1):
                print(f"  {i}. {error}")

        print("\n" + "="*80)

        if len(console_errors) == 0 and len(page_errors) == 0:
            print("✅ 没有JavaScript错误！")
        else:
            print("❌ 发现JavaScript错误")

        browser.close()
        return len(console_errors) == 0 and len(page_errors) == 0

if __name__ == "__main__":
    success = test_page()
    exit(0 if success else 1)
