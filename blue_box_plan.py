"""
淘宝618购物车最优购买方案 - 蓝盒子床垫方案

需求：2张含床垫的床 + 1张床架 + 蓝盒子床垫 + 1沙发 + 1餐桌
优化目标：找出最省钱的订单分组方案
"""

from itertools import combinations


class Product:
    def __init__(self, name, price, category, discount_rate=1.0):
        self.name = name
        self.price = price
        self.category = category
        self.discount_rate = discount_rate


def calc_cross_shop_discount(amount):
    return (int(amount) // 300) * 50


def get_coupon_discount(amount, used_coupons=None):
    if used_coupons is None:
        used_coupons = set()

    coupons = [(5000, 650), (3000, 400), (1500, 180), (480, 60), (200, 25)]

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
        'coupon': coupon_discount,
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
        orders.append({'products': group_names, **calc})
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
    products = {
        '蓝盒子Z1床垫': Product('蓝盒子Z1床垫', 3251.08, 'mattress', discount_rate=0.97),
        '林氏实木儿童床(含床垫)': Product('林氏实木儿童床', 2419.85, 'bed_with_mattress'),
        '林氏奶油风实木床(高配,含床垫)': Product('林氏奶油风实木床(高配)', 2704.40, 'bed_with_mattress'),
        '林氏实木床1.8m标配(仅床架)': Product('林氏实木床1.8m标配', 1727.28, 'bed_frame'),
        '林氏奶油风沙发': Product('林氏奶油风沙发', 2401.59, 'sofa'),
        '林氏原木风餐桌': Product('林氏原木风餐桌1桌4椅', 2139.52, 'table'),
    }

    print("=" * 75)
    print("【蓝盒子床垫方案】最优分组策略")
    print("=" * 75)
    print("\n选择的商品：")
    for name, p in products.items():
        print(f"  • {name}: ￥{p.price:.2f}")
    print(f"  合计：{sum(p.price for p in products.values()):.2f} 元")

    # 所有可能的2-3单分组组合
    all_items = list(products.keys())

    best_solution = None
    best_price = float('inf')
    combo_count = 0

    # 枚举所有可能的分组方式
    for num_orders in [2, 3]:
        # 生成所有可能的分组
        groupings = generate_groupings(all_items, num_orders)

        for grouping in groupings:
            combo_count += 1
            result = evaluate_grouping(grouping, products)
            if result['total_final'] < best_price:
                best_price = result['total_final']
                best_solution = result

    print(f"\n\n枚举了 {combo_count} 种分组方案，找出最优方案：")
    print("=" * 75)

    for i, order in enumerate(best_solution['orders']):
        print(f"\n  【订单{i + 1}】")
        for item in order['products']:
            p = products[item]
            tag = {"bed_with_mattress": "(床+床垫)", "bed_frame": "(仅床架)",
                   "mattress": "(床垫)", "sofa": "(沙发)", "table": "(餐桌)"}[p.category]
            print(f"    • {item} {tag}")

        print(f"    ─────────────────────────────")
        print(f"    金额：{order['total']:.2f} 元")
        print(f"    跨店满减：-{order['discount1']:.0f} 元")
        if order['coupon'] > 0:
            print(f"    消费券：-{order['coupon']} 元 (满{order['coupon_threshold']}减{order['coupon']})")
        if order['vip_discount'] > 0:
            print(f"    88VIP折扣：-{order['vip_discount']:.2f} 元 (蓝盒子97折)")
        print(f"    ★ 实付：{order['final']:.2f} 元")

    print(f"\n" + "=" * 75)
    print(f"  ★ 最终总支付：{best_solution['total_final']:.2f} 元")
    print(f"  ★ 总节省：{best_solution['savings']:.2f} 元 ({best_solution['savings_rate']*100:.1f}%)")
    print("=" * 75)


def generate_groupings(items, num_groups):
    """生成所有可能的分组方式"""
    groupings = []

    if num_groups == 2:
        # 分成2单：尝试不同的分割点（按价格排序后）
        sorted_items = sorted(items, key=lambda x: products_map[x].price, reverse=True)
        for split in range(1, len(sorted_items)):
            groupings.append([sorted_items[:split], sorted_items[split:]])

        # 按原始顺序分割
        for split in range(1, len(items)):
            groupings.append([items[:split], items[split:]])

        # 蓝盒子单独
        others = [i for i in items if i != '蓝盒子Z1床垫']
        groupings.append([['蓝盒子Z1床垫'], others])

        # 床架单独
        groupings.append([['林氏实木床1.8m标配(仅床架)'], [i for i in items if i != '林氏实木床1.8m标配(仅床架)']])

        # 沙发+餐桌单独
        groupings.append([['林氏奶油风沙发', '林氏原木风餐桌'], [i for i in items if i not in ['林氏奶油风沙发', '林氏原木风餐桌']]])

    elif num_groups == 3:
        # 按价格排序后分3单
        sorted_items = sorted(items, key=lambda x: products_map[x].price, reverse=True)
        for split1 in range(1, len(sorted_items) - 1):
            for split2 in range(split1 + 1, len(sorted_items)):
                groupings.append([
                    sorted_items[:split1],
                    sorted_items[split1:split2],
                    sorted_items[split2:]
                ])

        # 蓝盒子单独 + 其他分2单
        others = [i for i in items if i != '蓝盒子Z1床垫']
        others_sorted = sorted(others, key=lambda x: products_map[x].price, reverse=True)
        for split in range(1, len(others_sorted)):
            groupings.append([['蓝盒子Z1床垫'], others_sorted[:split], others_sorted[split:]])

    return groupings


# 全局变量用于generate_groupings
products_map = None


def solve_with_map():
    global products_map

    products_map = {
        '蓝盒子Z1床垫': Product('蓝盒子Z1床垫', 3251.08, 'mattress', discount_rate=0.97),
        '林氏实木儿童床(含床垫)': Product('林氏实木儿童床', 2419.85, 'bed_with_mattress'),
        '林氏奶油风实木床(高配,含床垫)': Product('林氏奶油风实木床(高配)', 2704.40, 'bed_with_mattress'),
        '林氏实木床1.8m标配(仅床架)': Product('林氏实木床1.8m标配', 1727.28, 'bed_frame'),
        '林氏奶油风沙发': Product('林氏奶油风沙发', 2401.59, 'sofa'),
        '林氏原木风餐桌': Product('林氏原木风餐桌1桌4椅', 2139.52, 'table'),
    }

    print("=" * 75)
    print("【蓝盒子床垫方案】最优分组策略")
    print("=" * 75)
    print("\n选择的商品：")
    for name, p in products_map.items():
        print(f"  • {name}: ￥{p.price:.2f}")
    print(f"  合计：{sum(p.price for p in products_map.values()):.2f} 元")

    all_items = list(products_map.keys())

    best_solution = None
    best_price = float('inf')
    combo_count = 0

    for num_groups in [2, 3]:
        groupings = generate_groupings(all_items, num_groups)

        for grouping in groupings:
            combo_count += 1
            result = evaluate_grouping(grouping, products_map)
            if result['total_final'] < best_price:
                best_price = result['total_final']
                best_solution = result

    print(f"\n\n枚举了 {combo_count} 种分组方案，找出最优方案：")
    print("=" * 75)

    for i, order in enumerate(best_solution['orders']):
        print(f"\n  【订单{i + 1}】")
        for item in order['products']:
            p = products_map[item]
            tag = {"bed_with_mattress": "(床+床垫)", "bed_frame": "(仅床架)",
                   "mattress": "(床垫)", "sofa": "(沙发)", "table": "(餐桌)"}[p.category]
            print(f"    • {item} {tag}")

        print(f"    ─────────────────────────────")
        print(f"    金额：{order['total']:.2f} 元")
        print(f"    跨店满减：-{order['discount1']:.0f} 元")
        if order['coupon'] > 0:
            print(f"    消费券：-{order['coupon']} 元 (满{order['coupon_threshold']}减{order['coupon']})")
        if order['vip_discount'] > 0:
            print(f"    88VIP折扣：-{order['vip_discount']:.2f} 元 (蓝盒子97折)")
        print(f"    ★ 实付：{order['final']:.2f} 元")

    print(f"\n" + "=" * 75)
    print(f"  ★ 最终总支付：{best_solution['total_final']:.2f} 元")
    print(f"  ★ 总节省：{best_solution['savings']:.2f} 元 ({best_solution['savings_rate']*100:.1f}%)")
    print("=" * 75)


if __name__ == "__main__":
    solve_with_map()
