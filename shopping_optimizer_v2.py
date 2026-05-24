"""
淘宝618购物车最优购买方案计算器 v2

根据用户购物车分析：
- 蓝盒子Z1床+床垫 (3251) - 主卧，已含床垫 ✓
- 林氏实木儿童床 (2419) - 儿童房，已含床垫 ✓
- 林氏实木床1.8m高配 (2704) - 次卧，已含床垫 ✓
- 林氏实木床1.8m标配 (1727) - 这张便宜，不含床垫，需另配床垫

需求：3张床 + 3个床垫 + 1个沙发 + 1个餐桌
其中2张床已含床垫，只需再选1张床垫配标配床架
"""

from itertools import combinations


class Product:
    def __init__(self, name, price, shop, category, discount_rate=1.0):
        self.name = name
        self.price = price
        self.shop = shop
        self.category = category  # 'bed_with_mattress', 'bed_frame', 'mattress', 'sofa', 'table'
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

    # 2. 消费券
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

    # 从购物车提取的商品列表（价格取加入购物车后的价）
    all_products = {
        # 已含床垫的床
        '蓝盒子Z1床+床垫': Product('蓝盒子Z1床+床垫', 3251.08, '蓝盒子', 'bed_with_mattress', discount_rate=0.97),
        '林氏实木儿童床': Product('林氏实木儿童床', 2419.85, '林氏', 'bed_with_mattress'),

        # 次卧床（含床垫）
        '林氏实木床1.8m高配': Product('林氏实木床1.8m(高配)', 2704.4, '林氏', 'bed_with_mattress'),

        # 床架（不含床垫，需另配）
        '林氏实木床1.8m标配': Product('林氏实木床1.8m(标配)', 1727.28, '林氏', 'bed_frame'),

        # 床垫选项
        '林氏椰棕床垫': Product('林氏椰棕床垫', 2023.96, '林氏', 'mattress'),

        # 沙发选项
        '林氏奶油风沙发': Product('林氏奶油风沙发', 2401.59, '林氏', 'sofa'),
        '林氏原木风沙发': Product('林氏原木风沙发', 3548.24, '林氏', 'sofa'),

        # 餐桌选项
        '林氏岩板餐桌': Product('林氏岩板餐桌1桌4椅', 2645.68, '林氏', 'table'),
        '林氏原木风餐桌': Product('林氏原木风餐桌1桌4椅', 2139.52, '林氏', 'table'),
        '林氏实木脚岩板餐桌': Product('林氏实木脚岩板餐桌', 2257.84, '林氏', 'table'),
    }

    # 固定必选：2张含床垫的床 + 1张床架
    fixed_products = {
        '蓝盒子Z1床+床垫',
        '林氏实木儿童床',
        '林氏实木床1.8m标配',  # 这张需要配床垫
    }

    print("=" * 75)
    print("淘宝618购物车最优购买方案计算器 v2")
    print("=" * 75)

    # 商品选择范围
    # 次卧床：高配（含床垫）
    bedroom2_beds = ['林氏实木床1.8m高配']

    # 床垫选项（给标配床架配）
    mattress_options = ['林氏椰棕床垫']

    # 沙发选项
    sofa_options = ['林氏奶油风沙发', '林氏原木风沙发']

    # 餐桌选项
    table_options = ['林氏岩板餐桌', '林氏原木风餐桌', '林氏实木脚岩板餐桌']

    # =========================================
    # 枚举所有组合
    # =========================================
    print("\n" + "=" * 75)
    print("枚举所有合法购买方案...")
    print("=" * 75)

    best_solution = None
    best_price = float('inf')
    best_combo = None
    combo_count = 0

    # 枚举：1次卧床 + 1床垫 + 1沙发 + 1餐桌
    for bed2 in bedroom2_beds:
        for mattress in mattress_options:
            for sofa in sofa_options:
                for table in table_options:
                    combo_count += 1

                    # 所有商品
                    product_names = [
                        '蓝盒子Z1床+床垫',      # 主卧（含床垫）
                        '林氏实木儿童床',         # 儿童房（含床垫）
                        '林氏实木床1.8m标配',    # 次卧床架（不含床垫）
                        bed2,                     # 次卧床（含床垫）
                        mattress,                 # 给标配床架配的床垫
                        sofa,                     # 沙发
                        table,                    # 餐桌
                    ]

                    # 尝试多种分组策略
                    groupings = []

                    # 策略1：全部合并为1单
                    groupings.append([product_names])

                    # 策略2：蓝盒子单独 + 其他合并
                    others = [p for p in product_names if p != '蓝盒子Z1床+床垫']
                    groupings.append([['蓝盒子Z1床+床垫'], others])

                    # 策略3：按金额降序分2单
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

                    # 策略5：按品类分组（床+床垫 / 沙发+餐桌）
                    beds_with_mattress = ['蓝盒子Z1床+床垫', '林氏实木儿童床', bed2]
                    beds_without_mattress = ['林氏实木床1.8m标配', mattress]
                    groupings.append([
                        beds_with_mattress + beds_without_mattress,
                        [sofa, table]
                    ])

                    # 策略6：高价值合并（床类）/ 低价值合并（沙发餐桌）
                    groupings.append([
                        beds_with_mattress,
                        beds_without_mattress + [sofa, table]
                    ])

                    # 策略7：按店铺分组
                    groupings.append([
                        ['蓝盒子Z1床+床垫'],
                        [p for p in product_names if p != '蓝盒子Z1床+床垫']
                    ])

                    # 策略8：蓝盒子+床垫 / 床架+次卧床 / 沙发+餐桌
                    groupings.append([
                        ['蓝盒子Z1床+床垫', mattress],
                        ['林氏实木儿童床', '林氏实木床1.8m标配', bed2],
                        [sofa, table]
                    ])

                    # 策略9：主卧+次卧 / 儿童房+床垫 / 沙发+餐桌
                    groupings.append([
                        ['蓝盒子Z1床+床垫', bed2],
                        ['林氏实木儿童床', '林氏实木床1.8m标配', mattress],
                        [sofa, table]
                    ])

                    # 策略10：床架+床垫 / 其他床 / 沙发+餐桌
                    groupings.append([
                        ['林氏实木床1.8m标配', mattress],
                        ['蓝盒子Z1床+床垫', '林氏实木儿童床', bed2],
                        [sofa, table]
                    ])

                    for grouping in groupings:
                        result = evaluate_grouping(grouping, all_products)
                        if result['total_final'] < best_price:
                            best_price = result['total_final']
                            best_solution = result
                            best_combo = product_names

    print(f"\n  枚举组合数：{combo_count} 种商品组合 x 多种分组策略")

    # 打印最优方案
    print(f"\n" + "=" * 75)
    print("★★★ 最优购买方案 ★★★")
    print("=" * 75)

    print(f"\n  选择商品（共7件）：")
    for name in best_combo:
        p = all_products[name]
        tag = ""
        if p.category == 'bed_with_mattress':
            tag = " ✓含床垫"
        elif p.category == 'bed_frame':
            tag = " (需配床垫)"
        elif p.category == 'mattress':
            tag = " (配标配床架)"
        print(f"    - {name} (￥{p.price:.2f}){tag}")

    print(f"\n  原始总价：{best_solution['total_original']:.2f} 元")

    print(f"\n  订单拆分方案（共{len(best_solution['orders'])}笔订单）：")
    print("-" * 75)

    for i, order in enumerate(best_solution['orders']):
        print(f"\n  【订单{i + 1}】")
        for item in order['products']:
            p = all_products[item]
            print(f"    • {item} (￥{p.price:.2f})")
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

    # 消费券使用情况
    print(f"\n  消费券使用情况：")
    for i, order in enumerate(best_solution['orders']):
        if order['coupon'] > 0:
            print(f"    订单{i + 1}：满{order['coupon_threshold']}减{order['coupon']}")

    # 额外提示
    print(f"\n  额外提醒：")
    print(f"    1. 每天淘宝搜索红包口令领券（每天可领约5-20元，累计可省100-300元）")
    print(f"    2. 下单时间：5月31日晚8点（开门红）或6月15-18日（终极高潮）")
    print(f"    3. 蓝盒子商品可能有政府补贴资格，如有可进一步减免")
    print(f"    4. 以上计算已考虑88VIP 97折（蓝盒子）和消费券最优组合")


if __name__ == "__main__":
    solve()
