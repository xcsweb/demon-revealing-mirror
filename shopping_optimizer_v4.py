"""
淘宝618购物车最优购买方案计算器 v4

需求：3张床（不含床垫的床架）+ 需配3个床垫 + 1个沙发 + 1个餐桌
床垫选择：1张蓝盒子 + 2张椰棕（为主卧+次卧儿童房的合理组合）
"""

from itertools import combinations


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

        '简的原木风长方形板床': Product('简的原木风长方形板床', 1428, '简的', 'bed_frame'),
        '林氏实木儿童床': Product('林氏实木儿童床', 2419.85, '林氏', 'bed_frame'),
        '林氏奶油风实木床(高配)': Product('林氏奶油风实木床(高配)', 2704.4, '林氏', 'bed_frame'),
        '林氏实木床1.8m标配': Product('林氏实木床1.8m标配', 1727.28, '林氏', 'bed_frame'),
        '简的真皮双人床': Product('简的真皮双人床', 3184.4, '简的', 'bed_frame'),

        '林氏奶油风沙发': Product('林氏奶油风沙发', 2401.59, '林氏', 'sofa'),
        '林氏原木风沙发': Product('林氏原木风沙发', 3548.24, '林氏', 'sofa'),

        '林氏岩板餐桌': Product('林氏岩板餐桌1桌4椅', 2645.68, '林氏', 'table'),
        '林氏原木风餐桌': Product('林氏原木风餐桌1桌4椅', 2139.52, '林氏', 'table'),
        '林氏实木脚岩板餐桌': Product('林氏实木脚岩板餐桌', 2257.84, '林氏', 'table'),
    }

    print("=" * 75)
    print("淘宝618购物车最优购买方案计算器 v4")
    print("=" * 75)

    bed_options = [
        '简的原木风长方形板床',
        '林氏实木儿童床',
        '林氏奶油风实木床(高配)',
        '林氏实木床1.8m标配',
        '简的真皮双人床',
    ]

    sofa_options = ['林氏奶油风沙发', '林氏原木风沙发']
    table_options = ['林氏岩板餐桌', '林氏原木风餐桌', '林氏实木脚岩板餐桌']

    best_solution = None
    best_price = float('inf')
    best_combo = None
    combo_count = 0

    # 固定床垫：1个蓝盒子 + 2个椰棕
    mattresses = ['蓝盒子Z1床垫', '林氏椰棕床垫', '林氏椰棕床垫']

    for beds in combinations(bed_options, 3):
        for sofa in sofa_options:
            for table in table_options:
                combo_count += 1

                product_names = list(beds) + mattresses + [sofa, table]

                groupings = []

                # 策略1：全部合并
                groupings.append([product_names])

                sorted_by_price = sorted(product_names,
                                         key=lambda x: all_products[x].price,
                                         reverse=True)

                # 策略2：分2单
                for split in range(1, len(sorted_by_price)):
                    groupings.append([sorted_by_price[:split], sorted_by_price[split:]])

                # 策略3：分3单
                for split1 in range(1, len(sorted_by_price) - 1):
                    for split2 in range(split1 + 1, len(sorted_by_price)):
                        groupings.append([
                            sorted_by_price[:split1],
                            sorted_by_price[split1:split2],
                            sorted_by_price[split2:]
                        ])

                # 策略4：蓝盒子单独
                others = [p for p in product_names if p != '蓝盒子Z1床垫']
                groupings.append([['蓝盒子Z1床垫'], others])

                # 策略5：按品类
                beds_list = list(beds)
                groupings.append([beds_list + mattresses, [sofa, table]])

                # 策略6：床+床垫配对
                beds_sorted = sorted(beds_list, key=lambda x: all_products[x].price, reverse=True)
                mats_sorted = sorted(mattresses, key=lambda x: all_products[x].price, reverse=True)
                groupings.append([
                    [beds_sorted[0], mats_sorted[0]],
                    [beds_sorted[1], mats_sorted[1]],
                    [beds_sorted[2], mats_sorted[2]],
                    [sofa, table]
                ])

                # 策略7：2单，第一单凑满5000
                groupings.append([sorted_by_price[:4], sorted_by_price[4:]])

                for grouping in groupings:
                    result = evaluate_grouping(grouping, all_products)
                    if result['total_final'] < best_price:
                        best_price = result['total_final']
                        best_solution = result
                        best_combo = {
                            'beds': beds,
                            'mattresses': mattresses,
                            'sofa': sofa,
                            'table': table,
                            'all_names': product_names
                        }

    print(f"\n  枚举组合数：{combo_count} 种组合 x 多种分组策略")

    print(f"\n" + "=" * 75)
    print("★★★ 最优购买方案 ★★★")
    print("=" * 75)

    print(f"\n  选择商品：")
    print(f"  【3张床】：")
    for i, bed_name in enumerate(best_combo['beds']):
        p = all_products[bed_name]
        print(f"    {i + 1}. {bed_name} (￥{p.price:.2f})")
    print(f"  【3张床垫】：")
    for i, mat_name in enumerate(best_combo['mattresses']):
        p = all_products[mat_name]
        print(f"    {i + 1}. {mat_name} (￥{p.price:.2f})")
    p = all_products[best_combo['sofa']]
    print(f"  【1个沙发】：{best_combo['sofa']} (￥{p.price:.2f})")
    p = all_products[best_combo['table']]
    print(f"  【1个餐桌】：{best_combo['table']} (￥{p.price:.2f})")

    print(f"\n  原始总价：{best_solution['total_original']:.2f} 元")
    print(f"\n  订单拆分方案（共{len(best_solution['orders'])}笔订单）：")
    print("-" * 75)

    for i, order in enumerate(best_solution['orders']):
        print(f"\n  【订单{i + 1}】")
        for item in order['products']:
            p = all_products[item]
            tag = ""
            if p.category == 'bed_frame':
                tag = " (床架)"
            elif p.category == 'mattress':
                tag = " (床垫)"
            elif p.category == 'sofa':
                tag = " (沙发)"
            elif p.category == 'table':
                tag = " (餐桌)"
            print(f"    • {item} (￥{p.price:.2f}){tag}")
        print(f"    ─────────────────────────────")
        print(f"    订单金额：{order['total']:.2f} 元")
        print(f"    跨店满减：-{order['discount1']:.0f} 元")
        if order['coupon'] > 0:
            print(f"    消费券：  -{order['coupon']:.0f} 元 (满{order['coupon_threshold']}减)")
        if order['vip_discount'] > 0:
            print(f"    88VIP：   -{order['vip_discount']:.2f} 元")
        print(f"    ★ 实付：  {order['final']:.2f} 元")

    print(f"\n" + "=" * 75)
    print(f"  ★ 最终支付：{best_solution['total_final']:.2f} 元")
    print(f"  ★ 节省金额：{best_solution['savings']:.2f} 元")
    print(f"  ★ 节省比例：{best_solution['savings_rate'] * 100:.1f}%")
    print("=" * 75)

    print(f"\n  消费券使用情况：")
    for i, order in enumerate(best_solution['orders']):
        if order['coupon'] > 0:
            print(f"    订单{i + 1}：满{order['coupon_threshold']}减{order['coupon']}")

    print(f"\n  额外提醒：")
    print(f"    1. 每天淘宝搜索红包口令领券（累计可省100-300元）")
    print(f"    2. 下单时间：5月31日晚8点（开门红）或6月15-18日（终极高潮）")
    print(f"    3. 蓝盒子可能有政府补贴资格，如有可再减")


if __name__ == "__main__":
    solve()
