# Tasks

## Phase 1: Research and Policy Verification
- [ ] Task 1: Research 2026 Taobao 618 actual promotion policies
  - [ ] SubTask 1.1: Verify 跨店满减 (cross-store discount) rules: amounts, thresholds, stacking rules
  - [ ] SubTask 1.2: Verify 88VIP 家装潮电消费券 details: thresholds, discount amounts, applicable products
  - [ ] SubTask 1.3: Verify 政府补贴 (government subsidy) for furniture: coverage, percentage, caps
  - [ ] SubTask 1.4: Verify store-specific rules for 林氏家居, 蓝盒子, and other furniture stores

- [ ] Task 2: Document verified policy data in a configuration file
  - [ ] SubTask 2.1: Create policy_data.json with all verified rules
  - [ ] SubTask 2.2: Include store-specific discount rules
  - [ ] SubTask 2.3: Include government subsidy eligibility by product category

## Phase 2: Calculator Implementation
- [ ] Task 3: Create the optimized shopping calculator
  - [ ] SubTask 3.1: Implement correct discount stacking order (店铺优惠→跨店满减→88VIP消费券→政府补贴→88VIP折扣)
  - [ ] SubTask 3.2: Implement government subsidy calculation based on product category
  - [ ] SubTask 3.3: Implement store-specific discount rules (林氏9.7折, 蓝盒子9.7折, etc.)
  - [ ] SubTask 3.4: Implement 88VIP consumer coupon logic with correct thresholds
  - [ ] SubTask 3.5: Implement cross-store discount calculation
  - [ ] SubTask 3.6: Implement product categorization (含床垫床, 床架, 床垫, 沙发, 餐桌)
  - [ ] SubTask 3.7: Implement grouping strategy enumeration (2-3 order splits)
  - [ ] SubTask 3.8: Find optimal grouping strategy to maximize coupon usage

- [ ] Task 4: Implement output and comparison features
  - [ ] SubTask 4.1: Output detailed order breakdown for optimal solution
  - [ ] SubTask 4.2: Compare multiple product combinations (e.g., 蓝盒子 vs 椰棕)
  - [ ] SubTask 4.3: Show coupon usage summary

## Phase 3: Verification
- [ ] Task 5: Verify calculator against actual screenshots
  - [ ] SubTask 5.1: Test with user's shopping cart items
  - [ ] SubTask 5.2: Compare calculated prices with actual screenshot prices
  - [ ] SubTask 5.3: Fix any discrepancies

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 4
