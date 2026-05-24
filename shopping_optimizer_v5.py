"""
淘宝618购物车最优购买方案计算器 v5

最终明确需求：
- 2张床：已经含床垫（儿童房+次卧）
- 1张床架：不含床垫（需要单独配）
- 1个沙发
- 1个餐桌
- 比较：单独配的这张床垫选蓝盒子还是选椰棕哪个更便宜
"""


class Product:
    def __init__(self, name, price, shop, category, discount_rate=1.0):
        self.name = name
        self.price = price
        self.shop = shop
        self.category = category
        self.discount_rate = discount_rate


def calc_cross_shop_discount(amount):
    return (int(amount) // 300) * 50


def get_coupon_discount(amount, used_coupons=None):
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


def calc_order_final(products, used_coupons=None):
    total = sum(p.price for p in products)

    discount1 = calc_cross_shop_discount(total)
    after1 = total - discount1

    coupon_threshold, coupon_discount = get_coupon_discount(after1, used_coupons)
    after2 = after1 - coupon_discount

    min_discount = min(p.discount_rate for p in products) if products else 1.0
    discount3 = after2 * (1 - min_discount)
    final = after2 - discount3

    return {
        'total': total,
        'discount1': discount1,
        'after1': after1,
        'coupon': coupon_discount,
        'after2': after2,
        'vip_discount': discount3,
        'final': final,
        'coupon_threshold': coupon_threshold
    }


def evaluate_grouping(grouping, products_map):
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
    all_products = {
        '蓝盒子Z1床垫': Product('蓝盒子Z1床垫', 3251.08, '蓝盒子', 'mattress', discount_rate=0.97),
        '林氏椰棕床垫': Product('林氏椰棕床垫', 2023.96, '林氏', 'mattress'),

        '林氏实木儿童床(含床垫)': Product('林氏实木儿童床', 2419.85, '林氏', 'bed_with_mattress'),
        '林氏奶油风实木床(高配,含床垫)': Product('林氏奶油风实木床(高配)', 2704.4, '林氏', 'bed_with_mattress'),
        '林氏实木床1.8m标配(仅床架)': Product('林氏实木床1.8m标配', 1727.28, '林氏', 'bed_frame'),

        '林氏奶油风沙发': Product('林氏奶油风沙发', 2401.59, '林氏', 'sofa'),
        '林氏原木风沙发': Product('林氏原木风沙发', 3548.24, '林氏', 'sofa'),

        '林氏岩板餐桌': Product('林氏岩板餐桌1桌4椅', 2645.68, '林氏', 'table'),
        '林氏原木风餐桌': Product('林氏原木风餐桌1桌4椅', 2139.52, '林氏', 'table'),
        '林氏实木脚岩板餐桌': Product('林氏实木脚岩板餐桌', 2257.84, '林氏', 'table'),
    }

    print("=" * 75)
    print("淘宝618购物车最优购买方案计算器 v5")
    print("=" * 75)
    print("\n需求：2张含床垫的床 + 1张床架 + 1张单独床垫 + 1沙发 + 1餐桌\n")

    # 固定：2张含床垫的床 + 标配床架 + 沙发（奶油风） + 餐桌（原木风）
    # 比较：单独床垫选蓝盒子还是椰棕
    print("=" * 75)
    print("方案A：单独床垫选【蓝盒子Z1床垫】")
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

    groupings_a.append([
        ['蓝盒子Z1床垫'],
        [p for p in products_a if p != '蓝盒子Z1床垫']
    ])

    best_a = None
    best_price_a = float('inf')
    for grouping in groupings_a:
        result = evaluate_grouping(grouping, all_products)
        if result['total_final'] < best_price_a:
            best_price_a = result['total_final']
            best_a = result

    print(f"\n原始总价：{best_a['total_original']:.2f} 元")
    print(f"最终支付：{best_a['total_final']:.2f} 元")
    print(f"\n订单拆分：")
    for i, order in enumerate(best_a['orders']):
        print(f"  订单{i + 1}：")
        print(f"    商品：{', '.join(order['products'])}")
        print(f"    金额：{order['total']:.2f} → 满减-{order['discount1']} → 消费券-{order['coupon']} → 实付{order['final']:.2f}")

    print("\n" + "=" * 75)
    print("方案B：单独床垫选【林氏椰棕床垫】")
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
    print(f"最终支付：{best_b['total_final']:.2f} 元")
    print(f"\n订单拆分：")
    for i, order in enumerate(best_b['orders']):
        print(f"  订单{i + 1}：")
        print(f"    商品：{', '.join(order['products'])}")
        print(f"    金额：{order['total']:.2f} → 满减-{order['discount1']} → 消费券-{order['coupon']} → 实付{order['final']:.2f}")

    print("\n" + "=" * 75)
    print("最终对比结论：")
    print("=" * 75)
    if best_a['total_final'] < best_b['total_final']:
        diff = best_b['total_final'] - best_a['total_final']
        print(f"\n✅ 推荐方案A（选蓝盒子床垫），比方案B便宜 {diff:.2f} 元！")
        print("\n最佳订单拆分（方案A）：")
        for i, order in enumerate(best_a['orders']):
            print(f"\n  【订单{i + 1}】")
            for item in order['products']:
                print(f"    • {item}")
            print(f"    实付：{order['final']:.2f} 元")
    else:
        diff = best_a['total_final'] - best_b['total_final']
        print(f"\n✅ 推荐方案B（选椰棕床垫），比方案A便宜 {diff:.2f} 元！")
        print("\n最佳订单拆分（方案B）：")
        for i, order in enumerate(best_b['orders']):
            print(f"\n  【订单{i + 1}】")
            for item in order['products']:
                print(f"    • {item}")
            print(f"    实付：{order['final']:.2f} 元")


if __name__ == "__main__":
    solve()
