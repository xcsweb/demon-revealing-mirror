"""
淘宝618购物车最优购买方案计算器
考虑因素：
1. 跨店满减：每满300减50（上不封顶）
2. 88VIP消费券：满5000减650、满3000减400、满1500减180、满480减60、满200减25
3. 88VIP额外95折（部分商品，如蓝盒子97折）
4. 店铺券（已体现在折后价中）

需求：3张床 + 3个床垫 + 1个沙发 + 1个餐桌椅
约束：蓝盒子床已含床垫，选蓝盒子只需再买2个床垫

优化目标：枚举所有合法组合，找出最便宜的方案
"""

from itertools import combinations
import itertools


class Product:
    def __init__(self, name, price, shop, category, has_mattress=False, discount_rate=1.0):
        self.name = name
        self.price = price
        self.shop = shop
        self.category = category
        self.has_mattress = has_mattress
        self.discount_rate = discount_rate


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


def calc_order_final(products, used_coupons=None):
    """计算单个订单的最终价格"""
    total = sum(p.price for p in products)

    # 1. 跨店满减
    discount1 = calc_cross_shop_discount(total)
    after1 = total - discount1

    # 2. 消费券（每个门槛只能用一次，全局追踪）
    coupon_threshold, coupon_discount = get_coupon_discount(after1, used_coupons)
    after2 = after1 - coupon_discount

    # 3. 88VIP折扣
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
    """评估一种分组方案"""
    orders = []
    total_original = 0
    total_final = 0
    used_coupons = set()  # 全局追踪已用消费券

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

    # 从购物车提取的商品列表（价格取加入购物车后的价）
    all_products = {
        '蓝盒子Z1床+床垫': Product('蓝盒子Z1床+床垫', 3251.08, '蓝盒子', 'bed', has_mattress=True, discount_rate=0.97),
        '林氏岩板餐桌': Product('林氏岩板餐桌1桌4椅', 2645.68, '林氏', 'table'),
        '林氏奶油风沙发': Product('林氏奶油风沙发', 2401.59, '林氏', 'sofa'),
        '林氏原木风沙发': Product('林氏原木风沙发', 3548.24, '林氏', 'sofa'),
        '林氏实木床1.8m高配': Product('林氏实木床1.8m(高配)', 2704.4, '林氏', 'bed'),
        '林氏实木床1.8m标配': Product('林氏实木床1.8m(标配)', 1727.28, '林氏', 'bed'),
        '林氏椰棕床垫': Product('林氏椰棕床垫', 2023.96, '林氏', 'mattress'),
        '林氏原木风餐桌': Product('林氏原木风餐桌1桌4椅', 2139.52, '林氏', 'table'),
        '林氏实木儿童床': Product('林氏实木儿童床', 2419.85, '林氏', 'bed'),
        '简的原木风长方形板床': Product('简的原木风长方形板床', 1428, '简的', 'bed'),
        '简的真皮双人床': Product('简的真皮双人床', 3184.4, '简的', 'bed'),
    }

    print("=" * 75)
    print("淘宝618购物车最优购买方案计算器")
    print("=" * 75)

    # =========================================
    # 场景A：使用蓝盒子（含1床垫）+ 林氏2床垫
    # =========================================
    print("\n" + "=" * 75)
    print("【场景A】使用蓝盒子床+床垫（已含1床垫，需再买2床垫）")
    print("=" * 75)

    # 商品选择范围
    mattress_a = ['林氏椰棕床垫', '林氏椰棕床垫']  # 选2个同款床垫
    beds_a = [
        '林氏实木床1.8m高配',
        '林氏实木床1.8m标配',
        '林氏实木儿童床',
        '简的原木风长方形板床',
        '简的真皮双人床',
    ]
    sofas_a = ['林氏奶油风沙发', '林氏原木风沙发']
    tables_a = ['林氏岩板餐桌', '林氏原木风餐桌']

    best_a = None
    best_a_price = float('inf')
    best_a_grouping = None
    combo_count_a = 0

    # 枚举：选2床垫 + 2床 + 1沙发 + 1餐桌
    for m in combinations(mattress_a, 2):
        for b in combinations(beds_a, 2):
            for s in sofas_a:
                for t in tables_a:
                    combo_count_a += 1
                    product_names = ['蓝盒子Z1床+床垫'] + list(m) + list(b) + [s, t]

                    # 尝试多种分组策略
                    groupings = []

                    # 策略1：全部合并为1单
                    groupings.append([product_names])

                    # 策略2：蓝盒子单独1单 + 其他合并
                    groupings.append([['蓝盒子Z1床+床垫'], list(m) + list(b) + [s, t]])

                    # 策略3：按金额降序分2单（前N个 + 后M个）
                    sorted_by_price = sorted(product_names,
                                             key=lambda x: all_products[x].price,
                                             reverse=True)
                    for split in range(1, len(sorted_by_price)):
                        groupings.append([
                            sorted_by_price[:split],
                            sorted_by_price[split:]
                        ])

                    # 策略4：按金额降序分3单
                    for split1 in range(1, len(sorted_by_price) - 1):
                        for split2 in range(split1 + 1, len(sorted_by_price)):
                            groupings.append([
                                sorted_by_price[:split1],
                                sorted_by_price[split1:split2],
                                sorted_by_price[split2:]
                            ])

                    # 策略5：按品类分组
                    groupings.append([
                        ['蓝盒子Z1床+床垫'] + list(m),
                        list(b),
                        [s, t]
                    ])

                    # 策略6：按店铺分组
                    groupings.append([
                        ['蓝盒子Z1床+床垫'],
                        list(m) + list(b) + [s, t]
                    ])

                    # 策略7：高配床+床垫1单，低配床+床垫1单，沙发+餐桌1单
                    groupings.append([
                        ['蓝盒子Z1床+床垫'] + [list(m)[0]] + [list(b)[0]],
                        [list(m)[1]] + [list(b)[1]],
                        [s, t]
                    ])

                    # 策略8：床和床垫按高低价搭配
                    if len(list(b)) == 2 and len(list(m)) == 2:
                        beds_sorted = sorted(list(b),
                                             key=lambda x: all_products[x].price,
                                             reverse=True)
                        groupings.append([
                            ['蓝盒子Z1床+床垫'] + [beds_sorted[0]] + [list(m)[0]],
                            [beds_sorted[1]] + [list(m)[1]],
                            [s, t]
                        ])

                    for grouping in groupings:
                        result = evaluate_grouping(grouping, all_products)
                        if result['total_final'] < best_a_price:
                            best_a_price = result['total_final']
                            best_a = result
                            best_a_grouping = grouping
                            best_a_combo = product_names

    print(f"  枚举组合数：{combo_count_a} 种商品组合 x 多种分组策略")
    print(f"\n  ★★★ 场景A最优方案：")
    print(f"  选择商品：{', '.join(best_a_combo)}")
    print(f"  原始总价：{best_a['total_original']:.2f} 元")
    for i, order in enumerate(best_a['orders']):
        print(f"  订单{i + 1}：")
        print(f"    商品：{', '.join(order['products'])}")
        print(f"    金额：{order['total']:.2f} → 满减-{order['discount1']:.0f} "
              f"→ 消费券-{order['coupon']:.0f}(满{order['coupon_threshold']}) "
              f"→ 88VIP-{order['vip_discount']:.2f} = {order['final']:.2f}")
    print(f"  ★ 最终支付：{best_a['total_final']:.2f} 元")
    print(f"  节省：{best_a['savings']:.2f} 元 ({best_a['savings_rate'] * 100:.1f}%)")

    # =========================================
    # 场景B：不使用蓝盒子（需买3床垫 + 3床）
    # =========================================
    print("\n\n" + "=" * 75)
    print("【场景B】不使用蓝盒子（需买3床垫 + 3床 + 1沙发 + 1餐桌）")
    print("=" * 75)

    # 3个床垫（只有林氏可选）
    mattress_b = ['林氏椰棕床垫', '林氏椰棕床垫', '林氏椰棕床垫']

    beds_b = [
        '林氏实木床1.8m高配',
        '林氏实木床1.8m标配',
        '林氏实木儿童床',
        '简的原木风长方形板床',
        '简的真皮双人床',
    ]

    best_b = None
    best_b_price = float('inf')
    best_b_grouping = None
    combo_count_b = 0

    for b in combinations(beds_b, 3):
        for s in sofas_a:
            for t in tables_a:
                combo_count_b += 1
                product_names = list(mattress_b) + list(b) + [s, t]

                groupings = []

                # 策略1：全部合并
                groupings.append([product_names])

                # 策略2：按金额降序分2单
                sorted_by_price = sorted(product_names,
                                         key=lambda x: all_products[x].price,
                                         reverse=True)
                for split in range(1, len(sorted_by_price)):
                    groupings.append([
                        sorted_by_price[:split],
                        sorted_by_price[split:]
                    ])

                # 策略3：按金额降序分3单
                for split1 in range(1, len(sorted_by_price) - 1):
                    for split2 in range(split1 + 1, len(sorted_by_price)):
                        groupings.append([
                            sorted_by_price[:split1],
                            sorted_by_price[split1:split2],
                            sorted_by_price[split2:]
                        ])

                # 策略4：按品类分组
                groupings.append([
                    list(mattress_b),
                    list(b),
                    [s, t]
                ])

                # 策略5：床垫+床混搭分3组
                beds_sorted = sorted(list(b),
                                     key=lambda x: all_products[x].price,
                                     reverse=True)
                groupings.append([
                    [list(mattress_b)[0]] + [beds_sorted[0]],
                    [list(mattress_b)[1]] + [beds_sorted[1]],
                    [list(mattress_b)[2]] + [beds_sorted[2]] + [s, t]
                ])

                # 策略6：高价值合并
                groupings.append([
                    sorted_by_price[:3],
                    sorted_by_price[3:]
                ])

                for grouping in groupings:
                    result = evaluate_grouping(grouping, all_products)
                    if result['total_final'] < best_b_price:
                        best_b_price = result['total_final']
                        best_b = result
                        best_b_grouping = grouping
                        best_b_combo = product_names

    print(f"  枚举组合数：{combo_count_b} 种商品组合 x 多种分组策略")
    print(f"\n  ★★★ 场景B最优方案：")
    print(f"  选择商品：{', '.join(best_b_combo)}")
    print(f"  原始总价：{best_b['total_original']:.2f} 元")
    for i, order in enumerate(best_b['orders']):
        print(f"  订单{i + 1}：")
        print(f"    商品：{', '.join(order['products'])}")
        print(f"    金额：{order['total']:.2f} → 满减-{order['discount1']:.0f} "
              f"→ 消费券-{order['coupon']:.0f}(满{order['coupon_threshold']}) "
              f"→ 88VIP-{order['vip_discount']:.2f} = {order['final']:.2f}")
    print(f"  ★ 最终支付：{best_b['total_final']:.2f} 元")
    print(f"  节省：{best_b['savings']:.2f} 元 ({best_b['savings_rate'] * 100:.1f}%)")

    # =========================================
    # 最终对比
    # =========================================
    print("\n" + "=" * 75)
    print("最终对比")
    print("=" * 75)

    print(f"\n  场景A（蓝盒子）最终支付：{best_a['total_final']:.2f} 元")
    print(f"  场景B（纯林氏）最终支付：{best_b['total_final']:.2f} 元")

    if best_a['total_final'] < best_b['total_final']:
        diff = best_b['total_final'] - best_a['total_final']
        print(f"\n  ✅ 推荐：场景A（蓝盒子），比场景B节省 {diff:.2f} 元")
        print(f"\n  推荐购买方案（场景A）：")
        for i, order in enumerate(best_a['orders']):
            print(f"    订单{i + 1}：")
            for item in order['products']:
                print(f"      - {item} (￥{all_products[item].price:.2f})")
            print(f"      支付：{order['final']:.2f} 元")
    else:
        diff = best_a['total_final'] - best_b['total_final']
        print(f"\n  ✅ 推荐：场景B（纯林氏），比场景A节省 {diff:.2f} 元")
        print(f"\n  推荐购买方案（场景B）：")
        for i, order in enumerate(best_b['orders']):
            print(f"    订单{i + 1}：")
            for item in order['products']:
                print(f"      - {item} (￥{all_products[item].price:.2f})")
            print(f"      支付：{order['final']:.2f} 元")

    # 汇总所有订单的消费券使用情况
    print(f"\n  消费券使用情况：")
    if best_a['total_final'] < best_b['total_final']:
        for i, order in enumerate(best_a['orders']):
            if order['coupon'] > 0:
                print(f"    订单{i + 1}：满{order['coupon_threshold']}减{order['coupon']}")
    else:
        for i, order in enumerate(best_b['orders']):
            if order['coupon'] > 0:
                print(f"    订单{i + 1}：满{order['coupon_threshold']}减{order['coupon']}")

    # 额外提示
    print(f"\n  额外提醒：")
    print(f"    1. 每天淘宝搜索红包口令领券（每天可领约5-20元，累计可省100-300元）")
    print(f"    2. 下单时间：5月31日晚8点（开门红）或6月15-18日（终极高潮）")
    print(f"    3. 以上计算未包含政府补贴（如有资格可再减）")


if __name__ == "__main__":
    solve()
