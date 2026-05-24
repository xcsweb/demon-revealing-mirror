"""
淘宝618购物车最优购买方案计算器 v6

优化方案B的分组，确保订单组合
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
        group = [products_map[name] for name in group_names
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
    print("淘宝618购物车最优购买方案（最终确定版）")
    print("=" * 75)
    print("\n需求：2张含床垫的床 + 1张床架 + 1张单独床垫 + 1沙发 + 1餐桌\n")

    print("=" * 75)
    print("✅ 最优推荐方案：单独床垫选【林氏椰棕床垫】")
    print("=" * 75)

    products = [
        '林氏实木儿童床(含床垫)',
        '林氏奶油风实木床(高配,含床垫)',
        '林氏实木床1.8m标配(仅床架)',
        '林氏椰棕床垫',
        '林氏奶油风沙发',
        '林氏原木风餐桌'
    ]

    # 尝试优化后的分组策略（我手动设计）
    groupings = [
        # 优化分组1：高配床 + 椰棕床垫 + 沙发 + 餐桌凑最大的单，剩下的床架单独或者其他组合
        [
            ['林氏奶油风实木床(高配,含床垫)', '林氏椰棕床垫', '林氏原木风餐桌', '林氏奶油风沙发'],
            ['林氏实木儿童床(含床垫)', '林氏实木床1.8m标配(仅床架)']
        ],

        # 优化分组2：高配床 + 椰棕床垫 + 儿童床 + 沙发 + 餐桌
        [
            ['林氏奶油风实木床(高配,含床垫)', '林氏椰棕床垫', '林氏实木儿童床(含床垫)'],
            ['林氏奶油风沙发', '林氏原木风餐桌', '林氏实木床1.8m标配(仅床架)']
        ],

        # 优化分组3：椰棕床垫 + 标配床架 + 儿童床，其他的拼
        [
            ['林氏椰棕床垫', '林氏实木床1.8m标配(仅床架)', '林氏实木儿童床(含床垫)'],
            ['林氏奶油风实木床(高配,含床垫)', '林氏奶油风沙发', '林氏原木风餐桌']
        ],

        # 优化分组4：沙发 + 儿童床 + 高配床 + 椰棕床垫
        [
            ['林氏奶油风沙发', '林氏实木儿童床(含床垫)', '林氏奶油风实木床(高配,含床垫)'],
            ['林氏椰棕床垫', '林氏原木风餐桌', '林氏实木床1.8m标配(仅床架)']
        ]
    ]

    best = None
    best_price = float('inf')
    for grouping in groupings:
        result = evaluate_grouping(grouping, all_products)
        if result['total_final'] < best_price:
            best_price = result['total_final']
            best = result

    print(f"\n原始总价：{best['total_original']:.2f} 元")
    print(f"\n最佳订单拆分：")
    print("-" * 75)

    for i, order in enumerate(best['orders']):
        print(f"\n  【订单{i + 1}】")
        for item in order['products']:
            print(f"    • {item}")
        print(f"    ─────────────────────────────")
        print(f"    订单金额：{order['total']:.2f} 元")
        print(f"    跨店满减：-{order['discount1']:.0f} 元")
        if order['coupon'] > 0:
            print(f"    88VIP消费券：  -{order['coupon']} 元 (满{order['coupon_threshold']}减{order['coupon']})")
        if order['vip_discount'] > 0:
            print(f"    88VIP额外折扣：  -{order['vip_discount']:.2f} 元")
        print(f"    ★ 此单实付：  {order['final']:.2f} 元")

    print(f"\n" + "=" * 75)
    print(f"  ★ 最终总支付：  {best['total_final']:.2f} 元")
    print(f"  ★ 总节省：  {best['savings']:.2f} 元（{best['savings_rate'] * 100:.1f}%折扣")
    print("=" * 75)

    print(f"\n  88VIP消费券使用情况：")
    for i, order in enumerate(best['orders']):
        if order['coupon'] > 0:
            print(f"    订单{i + 1}：满{order['coupon_threshold']}减{order['coupon']}")

    print(f"\n  额外提醒：")
    print(f"    1. 每天淘宝搜索红包口令领券（每天约5-20元，累计可省100-300元）")
    print(f"    2. 下单时间：5月31日晚8点（开门红）或6月15-18日（终极高潮）")


if __name__ == "__main__":
    solve()
