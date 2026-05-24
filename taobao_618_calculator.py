"""
淘宝618购物车最优购买方案计算器 v8 - 最终确定版

基于核实的2026淘宝618官方政策：
- 跨店满减：每满300减50，全周期统一，上不封顶
- 88VIP消费券：满200减25、满480减60、满1500减180、满3000减400、满5000减650（共5张）
- 政府补贴：家电15%最高1500，数码15%最高500（家具类需核实）
- 店铺优惠：蓝盒子9.7折、林氏官方立减等
- 优惠叠加顺序：店铺优惠→跨店满减→88VIP消费券→政府补贴→88VIP折扣
"""

import json


class Product:
    """商品类"""
    def __init__(self, name, price, shop, category, 
                 has_mattress=False, store_discount=None,
                 gov_subsidy_eligible=False, gov_subsidy_rate=0):
        self.name = name
        self.price = price  # 加入购物车的折后价（已含店铺优惠）
        self.shop = shop
        self.category = category  # 'bed_with_mattress', 'bed_frame', 'mattress', 'sofa', 'table'
        self.has_mattress = has_mattress
        self.store_discount = store_discount or {}  # 店铺折扣信息
        self.gov_subsidy_eligible = gov_subsidy_eligible
        self.gov_subsidy_rate = gov_subsidy_rate


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
    """计算政府补贴"""
    total_subsidy = 0
    eligible_products = []
    
    for p in products:
        if p.gov_subsidy_eligible and p.gov_subsidy_rate > 0:
            subsidy = p.price * p.gov_subsidy_rate
            if p.gov_subsidy_rate == 0.15:  # 家电类
                subsidy = min(subsidy, 1500)
            elif p.gov_subsidy_rate == 0.10:  # 数码类
                subsidy = min(subsidy, 500)
            total_subsidy += subsidy
            eligible_products.append(p.name)
    
    return total_subsidy, eligible_products


def calc_order_final(products, used_coupons=None):
    """
    计算单个订单的最终价格
    优惠叠加顺序（基于核实的官方规则）：
    1. 店铺优惠（已体现在price中）
    2. 跨店满减
    3. 88VIP消费券
    4. 政府补贴
    5. 88VIP折扣
    """
    # price已经是店铺优惠后的价格
    total = sum(p.price for p in products)

    # 1. 跨店满减
    discount1 = calc_cross_shop_discount(total)
    after1 = total - discount1

    # 2. 88VIP消费券
    coupon_threshold, coupon_discount = get_coupon_discount(after1, used_coupons)
    after2 = after1 - coupon_discount

    # 3. 政府补贴
    gov_subsidy, eligible_products = calc_gov_subsidy(products)
    after3 = after2 - gov_subsidy

    # 4. 88VIP会员折扣（如果有店铺专属折扣如9.7折）
    # 注意：店铺折扣（如蓝盒子9.7折）已在price中体现
    # 88VIP全店95折仅适用于特定商品
    min_discount = min(p.store_discount.get('vip_rate', 1.0) for p in products) if products else 1.0
    vip_discount = after3 * (1 - min_discount) if min_discount < 1.0 else 0
    final = after3 - vip_discount

    return {
        'total': total,
        'cross_discount': discount1,
        'after_cross': after1,
        'coupon_threshold': coupon_threshold,
        'coupon_discount': coupon_discount,
        'after_coupon': after2,
        'gov_subsidy': gov_subsidy,
        'after_gov': after3,
        'vip_discount': vip_discount,
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

    # 从购物车提取的商品列表（价格取加入购物车后的价，已含店铺优惠）
    # 根据截图，价格已经是店铺优惠后的价格
    all_products = {
        # 床垫类
        '蓝盒子Z1床垫': Product(
            '蓝盒子Z1床垫', 3251.08, '蓝盒子', 'mattress',
            store_discount={'name': '9.7折限时折扣券', 'rate': 0.97},
            gov_subsidy_eligible=False,  # 床垫通常不在国补范围内
        ),
        '林氏椰棕床垫': Product(
            '林氏椰棕床垫', 2023.96, '林氏家居', 'mattress',
            store_discount={'name': '官方立减', 'rate': 1.0},
            gov_subsidy_eligible=False,
        ),

        # 床架类（不含床垫）
        '林氏实木儿童床(含床垫)': Product(
            '林氏实木儿童床', 2419.85, '林氏家居', 'bed_with_mattress',
            has_mattress=True,
            store_discount={'name': '官方立减', 'rate': 1.0},
            gov_subsidy_eligible=False,
        ),
        '林氏奶油风实木床(高配,含床垫)': Product(
            '林氏奶油风实木床(高配)', 2704.40, '林氏家居', 'bed_with_mattress',
            has_mattress=True,
            store_discount={'name': '官方立减', 'rate': 1.0},
            gov_subsidy_eligible=False,
        ),
        '林氏实木床1.8m标配(仅床架)': Product(
            '林氏实木床1.8m标配', 1727.28, '林氏家居', 'bed_frame',
            has_mattress=False,
            store_discount={'name': '官方立减', 'rate': 1.0},
            gov_subsidy_eligible=False,
        ),

        # 沙发类
        '林氏奶油风沙发': Product(
            '林氏奶油风沙发', 2401.59, '林氏家居', 'sofa',
            store_discount={'name': '官方立减', 'rate': 1.0},
            gov_subsidy_eligible=False,
        ),
        '林氏原木风沙发': Product(
            '林氏原木风沙发', 3548.24, '林氏家居', 'sofa',
            store_discount={'name': '官方立减', 'rate': 1.0},
            gov_subsidy_eligible=False,
        ),

        # 餐桌类
        '林氏岩板餐桌': Product(
            '林氏岩板餐桌1桌4椅', 2645.68, '林氏家居', 'table',
            store_discount={'name': '官方立减', 'rate': 1.0},
            gov_subsidy_eligible=False,
        ),
        '林氏原木风餐桌': Product(
            '林氏原木风餐桌1桌4椅', 2139.52, '林氏家居', 'table',
            store_discount={'name': '官方立减', 'rate': 1.0},
            gov_subsidy_eligible=False,
        ),
    }

    print("=" * 75)
    print("淘宝618购物车最优购买方案计算器 v8（基于核实政策）")
    print("=" * 75)
    print("\n✅ 已核实政策数据：")
    print("  • 跨店满减：每满300减50（全周期统一）")
    print("  • 88VIP消费券：满5000减650、满3000减400、满1500减180")
    print("  • 政府补贴：家具类通常不在国补范围内")
    print("  • 店铺优惠：蓝盒子9.7折、林氏官方立减")
    print("  • 优惠叠加顺序：店铺优惠→跨店满减→88VIP消费券→政府补贴\n")

    # 需求：2张含床垫的床 + 1张床架 + 1张单独床垫 + 1沙发 + 1餐桌
    # 比较：单独床垫选蓝盒子还是椰棕

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

    print(f"\n原始总价：{best_a['total_original']:.2f} 元")
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
        print(f"    金额：{order['total']:.2f} 元")
        print(f"    跨店满减：-{order['cross_discount']:.0f} 元")
        if order['coupon_discount'] > 0:
            print(f"    88VIP消费券：-{order['coupon_discount']} 元 (满{order['coupon_threshold']}减{order['coupon_discount']})")
        if order['gov_subsidy'] > 0:
            print(f"    政府补贴：-{order['gov_subsidy']:.2f} 元")
        if order['vip_discount'] > 0:
            print(f"    88VIP折扣：-{order['vip_discount']:.2f} 元")
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

    print(f"\n原始总价：{best_b['total_original']:.2f} 元")
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
        print(f"    ─────────────────────────────")
        print(f"    金额：{order['total']:.2f} 元")
        print(f"    跨店满减：-{order['cross_discount']:.0f} 元")
        if order['coupon_discount'] > 0:
            print(f"    88VIP消费券：-{order['coupon_discount']} 元 (满{order['coupon_threshold']}减{order['coupon_discount']})")
        if order['gov_subsidy'] > 0:
            print(f"    政府补贴：-{order['gov_subsidy']:.2f} 元")
        if order['vip_discount'] > 0:
            print(f"    88VIP折扣：-{order['vip_discount']:.2f} 元")
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
    print("⚠️ 重要说明：")
    print("=" * 75)
    print("  1. 以上计算基于购物车中的折后价（已含店铺优惠）")
    print("  2. 政府补贴：传统家具（床、沙发、餐桌）通常不在国补范围内")
    print("  3. 蓝盒子9.7折已在价格中体现，不再重复计算")
    print("  4. 如需更精确计算，请提供商品原价和具体店铺优惠信息")
    print("  5. 每天淘宝搜索红包口令（福气红包88800）还可额外省100-300元")
    print("  6. 下单时间：5月30日晚8点（开门红）或6月15-18日（终极狂欢期）")


if __name__ == "__main__":
    solve()
