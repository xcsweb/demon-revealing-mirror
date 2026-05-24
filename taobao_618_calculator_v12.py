"""
淘宝618购物车最优购买方案计算器 v12（最终修正版）

基于实际截图核实的数据：
- 商品总价：¥12887.40
- 店铺优惠（含官方立减）：-¥2474.20
- 平台优惠：-¥1121.92
  - 官方限时补贴：-¥359
  - 平台券：-¥112.92
  - 红包（88VIP消费券）：-¥650
- 政府补贴：-¥964.03
- 合计实付：¥8327.25

政府补贴核实：
- 蓝盒子Z1床垫：¥511.85（从新截图确认）
"""

from itertools import combinations


class Product:
    """商品类"""
    def __init__(self, name, price, shop, category, original_price=None, 
                 has_mattress=False,
                 gov_subsidy_eligible=False, gov_subsidy=0):
        self.name = name
        self.price = price  # 加入购物车的折后价（已含店铺优惠）
        self.shop = shop
        self.category = category
        self.original_price = original_price or price
        self.has_mattress = has_mattress
        self.gov_subsidy_eligible = gov_subsidy_eligible
        self.gov_subsidy = gov_subsidy  # 政府补贴直接给数值


def calc_cross_shop_discount(amount):
    """计算跨店满减：每满300减50"""
    return (int(amount) // 300) * 50


def get_coupon_discount(amount, used_coupons=None):
    """获取最优消费券减免（每个门槛只能用一次）"""
    if used_coupons is None:
        used_coupons = set()

    coupons = [
        (5000, 650),
        (3000, 400),
        (1500, 180),
        (480, 60),
        (200, 25)
    ]

    best = (0, 0)
    for threshold, discount in coupons:
        if amount >= threshold and threshold not in used_coupons:
            if discount > best[1]:
                best = (threshold, discount)
    return best


def calc_gov_subsidy(products):
    """
    计算政府补贴
    从截图看，直接按商品的政府补贴金额相加即可
    """
    total_subsidy = 0
    eligible_products = []
    
    for p in products:
        if p.gov_subsidy_eligible and p.gov_subsidy > 0:
            total_subsidy += p.gov_subsidy
            eligible_products.append((p.name, p.gov_subsidy))
    
    return total_subsidy, eligible_products


def calc_order_final(products, used_coupons=None):
    """
    计算单个订单的最终价格
    优惠叠加顺序：
    1. 店铺优惠（已体现在price中）
    2. 跨店满减
    3. 88VIP消费券
    4. 政府补贴（直接用截图中的数值）
    """
    total = sum(p.price for p in products)

    # 1. 跨店满减
    cross_discount = calc_cross_shop_discount(total)
    after_cross = total - cross_discount

    # 2. 88VIP消费券
    coupon_threshold, coupon_discount = get_coupon_discount(after_cross, used_coupons)
    after_coupon = after_cross - coupon_discount

    # 3. 政府补贴（直接用截图中的数值）
    gov_subsidy, eligible_products = calc_gov_subsidy(products)
    final = after_coupon - gov_subsidy

    return {
        'total': total,
        'cross_discount': cross_discount,
        'after_cross': after_cross,
        'coupon_threshold': coupon_threshold,
        'coupon_discount': coupon_discount,
        'after_coupon': after_coupon,
        'gov_subsidy': gov_subsidy,
        'final': final,
        'eligible_gov_products': eligible_products
    }


def evaluate_grouping(grouping, products_map):
    """评估一种分组方案"""
    orders = []
    total_original = 0
    total_final = 0
    used_coupons = set()

    for group_names in grouping:
        group = [products_map[name] for name in group_names]
        if not group:
            continue
        calc = calc_order_final(group, used_coupons)
        orders.append({
            'products': group_names,
            **calc
        })
        total_original += calc['total']
        total_final += calc['final']
        if calc['coupon_threshold'] > 0:
            used_coupons.add(calc['coupon_threshold'])

    savings = total_original - total_final
    return {
        'orders': orders,
        'total_original': total_original,
        'total_final': total_final,
        'savings': savings,
        'savings_rate': savings / total_original if total_original > 0 else 0
    }


def solve():
    """主求解函数"""

    # 从最新截图重新提取数据
    # price = 购物车折后价（已含店铺优惠）
    # gov_subsidy = 政府补贴金额（直接从截图中提取）
    all_products = {
        # 床垫类
        '蓝盒子Z1床垫': Product(
            '蓝盒子Z1床垫', 2763.42, '蓝盒子', 'mattress',
            original_price=4788,
            gov_subsidy_eligible=True,
            gov_subsidy=511.85,  # 从新截图确认
        ),
        '林氏椰棕床垫': Product(
            '林氏椰棕床垫', 1686.37, '林氏家居', 'mattress',
            original_price=3238,
            gov_subsidy_eligible=True,
            gov_subsidy=297.59,
        ),

        # 床类
        '林氏实木儿童床(含床垫)': Product(
            '林氏实木儿童床', 2022.7, '林氏家居', 'bed_with_mattress',
            original_price=3985,
            has_mattress=True,
            gov_subsidy_eligible=True,
            gov_subsidy=356.95,
        ),
        '林氏奶油风实木床(高配,含床垫)': Product(
            '林氏奶油风实木床(高配)', 2265.08, '林氏家居', 'bed_with_mattress',
            original_price=4515,
            has_mattress=True,
            gov_subsidy_eligible=True,
            gov_subsidy=399.72,
        ),
        '林氏实木床1.8m标配(仅床架)': Product(
            '林氏实木床1.8m标配', 1434.19, '林氏家居', 'bed_frame',
            original_price=2809,
            has_mattress=False,
            gov_subsidy_eligible=True,
            gov_subsidy=253.09,
        ),

        # 沙发类
        '林氏奶油风沙发': Product(
            '林氏奶油风沙发', 2482.44, '林氏家居', 'sofa',
            original_price=3584.4,
            gov_subsidy_eligible=True,
            gov_subsidy=346.48,
        ),
        '林氏原木风沙发': Product(
            '林氏原木风沙发', 3514.24, '林氏家居', 'sofa',
            original_price=6645,
            gov_subsidy_eligible=True,
            gov_subsidy=620.16,
        ),

        # 餐桌类
        '林氏岩板餐桌': Product(
            '林氏岩板餐桌1桌4椅', 2605.68, '林氏家居', 'table',
            original_price=4429,
            gov_subsidy_eligible=True,
            gov_subsidy=407.82,
        ),
        '林氏原木风餐桌': Product(
            '林氏原木风餐桌1桌4椅', 2099.52, '林氏家居', 'table',
            original_price=3406,
            gov_subsidy_eligible=True,
            gov_subsidy=304.59,
        ),
    }

    print("=" * 75)
    print("淘宝618购物车最优购买方案计算器 v12（最终修正版）")
    print("=" * 75)
    print("\n✅ 基于实际截图核实数据：")
    print("  • 商品总价：¥12,887.40")
    print("  • 店铺优惠（含官方立减）：-¥2,474.20")
    print("  • 平台优惠：-¥1,121.92")
    print("  • 官方限时补贴：-¥359")
    print("  • 平台券：-¥112.92")
    print("  • 红包（88VIP消费券）：-¥650")
    print("  • 政府补贴：-¥964.03")
    print("  • 合计实付：¥8,327.25\n")

    # 需求：2张含床垫的床 + 1张床架 + 1张单独床垫 + 1沙发 + 1餐桌
    print("=" * 75)
    print("【方案A】单独床垫选【蓝盒子Z1床垫】")
    print("=" * 75)

    products_a = [
        '林氏实木儿童床(含床垫)',
        '林氏奶油风实木床(高配,含床垫)',
        '林氏实木床1.8m标配(仅床架)',
        '蓝盒子Z1床垫',
        '林氏奶油风沙发',
        '林氏原木风餐桌'
    ]

    # 尝试不同分组策略
    groupings_a = []
    sorted_a = sorted(products_a, key=lambda x: all_products[x].price, reverse=True)
    
    for split in range(1, len(sorted_a)):
        groupings_a.append([sorted_a[:split], sorted_a[split:]])
    
    for split1 in range(1, len(sorted_a) - 1):
        for split2 in range(split1 + 1, len(sorted_a)):
            groupings_a.append([
                sorted_a[:split1],
                sorted_a[split1:split2],
                sorted_a[split2:]
            ])

    best_a = None
    best_price_a = float('inf')
    for grouping in groupings_a:
        result = evaluate_grouping(grouping, all_products)
        if result['total_final'] < best_price_a:
            best_price_a = result['total_final']
            best_a = result

    print(f"\n原始总价（购物车价）：{best_a['total_original']:.2f} 元")
    print(f"\n最佳订单拆分：")
    for i, order in enumerate(best_a['orders']):
        print(f"\n  【订单{i + 1}】")
        for item in order['products']:
            p = all_products[item]
            tag = ""
            if p.category == 'bed_with_mattress':
                tag = " (床+床垫)"
            elif p.category == 'bed_frame':
                tag = " (仅床架)"
            elif p.category == 'mattress':
                tag = " (床垫)"
            elif p.category == 'sofa':
                tag = " (沙发)"
            elif p.category == 'table':
                tag = " (餐桌)"
            print(f"    • {item} {tag}")
        print(f"    ─────────────────────────────")
        print(f"    购物车金额：{order['total']:.2f} 元")
        print(f"    跨店满减：-{order['cross_discount']:.0f} 元")
        if order['coupon_discount'] > 0:
            print(f"    88VIP消费券：-{order['coupon_discount']} 元 (满{order['coupon_threshold']}减{order['coupon_discount']})")
        if order['gov_subsidy'] > 0:
            print(f"    政府补贴：-{order['gov_subsidy']:.2f} 元")
            for prod_name, subsidy in order['eligible_gov_products']:
                print(f"      - {prod_name}: {subsidy:.2f} 元")
        print(f"    ★ 实付：{order['final']:.2f} 元")

    print(f"\n  ★ 方案A总支付：{best_a['total_final']:.2f} 元")
    print(f"  ★ 节省：{best_a['savings']:.2f} 元 ({best_a['savings_rate']*100:.1f}%)")

    print("\n" + "=" * 75)
    print("【方案B】单独床垫选【林氏椰棕床垫】")
    print("=" * 75)

    products_b = [
        '林氏实木儿童床(含床垫)',
        '林氏奶油风实木床(高配,含床垫)',
        '林氏实木床1.8m标配(仅床架)',
        '林氏椰棕床垫',
        '林氏奶油风沙发',
        '林氏原木风餐桌'
    ]

    groupings_b = []
    sorted_b = sorted(products_b, key=lambda x: all_products[x].price, reverse=True)
    
    for split in range(1, len(sorted_b)):
        groupings_b.append([sorted_b[:split], sorted_b[split:]])
    
    for split1 in range(1, len(sorted_b) - 1):
        for split2 in range(split1 + 1, len(sorted_b)):
            groupings_b.append([
                sorted_b[:split1],
                sorted_b[split1:split2],
                sorted_b[split2:]
            ])

    best_b = None
    best_price_b = float('inf')
    for grouping in groupings_b:
        result = evaluate_grouping(grouping, all_products)
        if result['total_final'] < best_price_b:
            best_price_b = result['total_final']
            best_b = result

    print(f"\n原始总价（购物车价）：{best_b['total_original']:.2f} 元")
    print(f"\n最佳订单拆分：")
    for i, order in enumerate(best_b['orders']):
        print(f"\n  【订单{i + 1}】")
        for item in order['products']:
            p = all_products[item]
            tag = ""
            if p.category == 'bed_with_mattress':
                tag = " (床+床垫)"
            elif p.category == 'bed_frame':
                tag = " (仅床架)"
            elif p.category == 'mattress':
                tag = " (床垫)"
            elif p.category == 'sofa':
                tag = " (沙发)"
            elif p.category == 'table':
                tag = " (餐桌)"
            print(f"    • {item} {tag}")
        print(f"    ────────────────────────────")
        print(f"    购物车金额：{order['total']:.2f} 元")
        print(f"    跨店满减：-{order['cross_discount']:.0f} 元")
        if order['coupon_discount'] > 0:
            print(f"    88VIP消费券：-{order['coupon_discount']} 元 (满{order['coupon_threshold']}减{order['coupon_discount']})")
        if order['gov_subsidy'] > 0:
            print(f"    政府补贴：-{order['gov_subsidy']:.2f} 元")
            for prod_name, subsidy in order['eligible_gov_products']:
                print(f"      - {prod_name}: {subsidy:.2f} 元")
        print(f"    ★ 实付：{order['final']:.2f} 元")

    print(f"\n  ★ 方案B总支付：{best_b['total_final']:.2f} 元")
    print(f"  ★ 节省：{best_b['savings']:.2f} 元 ({best_b['savings_rate']*100:.1f}%)")

    print("\n" + "=" * 75)
    print("最终对比结论：")
    print("=" * 75)
    if best_a['total_final'] < best_b['total_final']:
        diff = best_b['total_final'] - best_a['total_final']
        print(f"\n✅ 推荐方案A（选蓝盒子床垫），比方案B便宜 {diff:.2f} 元")
        print("\n最佳订单拆分（方案A）：")
        for i, order in enumerate(best_a['orders']):
            print(f"  订单{i + 1}：{', '.join(order['products'])} → 实付 {order['final']:.2f} 元")
    else:
        diff = best_a['total_final'] - best_b['total_final']
        print(f"\n✅ 推荐方案B（选椰棕床垫），比方案A便宜 {diff:.2f} 元")
        print("\n最佳订单拆分（方案B）：")
        for i, order in enumerate(best_b['orders']):
            print(f"  订单{i + 1}：{', '.join(order['products'])} → 实付 {order['final']:.2f} 元")

    print("\n" + "=" * 75)
    print("✅ 政策核实结果（基于最新截图）：")
    print("=" * 75)
    print("  1. 政府补贴：按商品实际补贴金额，不是按比例计算")
    print("  2. 88VIP消费券：满5000减650、满3000减400、满1500减180")
    print("  3. 跨店满减：每满300减50，全周期统一")
    print("  4. 店铺优惠已在购物车价格中体现")
    print("  5. 每天淘宝搜索红包口令还可额外省100-300元")
    print("  6. 下单时间：5月31日晚8点（开门红）或6月15-18日（终极狂欢期）")


if __name__ == "__main__":
    solve()
