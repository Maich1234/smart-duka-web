import type { OwnerDashboardData } from '@/services/dashboard';

export type BriefTone = 'positive' | 'neutral' | 'warning';

export type BriefIcon =
  | 'trending-up'
  | 'trending-down'
  | 'flat'
  | 'receipt'
  | 'sun'
  | 'star'
  | 'wallet'
  | 'box'
  | 'check';

export interface BriefBullet {
  id: string;
  icon: BriefIcon;
  text: string;
  tone: BriefTone;
}

const MAX_BULLETS = 4;

/**
 * The daily brief — a rule-based read of the day, built from the dashboard
 * payload the page already has.
 *
 * No network call, no model, no cost: it runs instantly and can't fail
 * separately from the data it summarises. Bullets are ordered by decision
 * value — how the day is going, then what's making money, then what it's
 * costing, then what needs restocking.
 */
export function buildDailyBrief(
  data: OwnerDashboardData | undefined,
  formatMoney: (amount: number) => string
): BriefBullet[] {
  if (!data) return [];

  const bullets: BriefBullet[] = [];
  const {
    todaySalesTotal,
    transactionsToday,
    yesterdaySalesTotal,
    todayProfit,
    todayExpensesTotal,
    topProduct,
    lowStockItems,
  } = data;

  // 1. How is the day going?
  if (todaySalesTotal > 0 && yesterdaySalesTotal != null && yesterdaySalesTotal > 0) {
    const pct = Math.round(((todaySalesTotal - yesterdaySalesTotal) / yesterdaySalesTotal) * 100);
    if (pct >= 5) {
      bullets.push({ id: 'trend', icon: 'trending-up', tone: 'positive', text: `Sales are up ${pct}% on yesterday.` });
    } else if (pct <= -5) {
      bullets.push({ id: 'trend', icon: 'trending-down', tone: 'warning', text: `Sales are ${Math.abs(pct)}% below yesterday so far.` });
    } else {
      bullets.push({ id: 'trend', icon: 'flat', tone: 'neutral', text: 'Sales are level with yesterday.' });
    }
  } else if (transactionsToday > 0) {
    bullets.push({
      id: 'trend',
      icon: 'receipt',
      tone: 'positive',
      text: `${transactionsToday} sale${transactionsToday === 1 ? '' : 's'} recorded so far today.`,
    });
  } else {
    bullets.push({
      id: 'trend',
      icon: 'sun',
      tone: 'neutral',
      text: 'No sales yet today — your counter is ready.',
    });
  }

  // 2. What's selling?
  if (topProduct && topProduct.quantity > 0) {
    bullets.push({
      id: 'top-product',
      icon: 'star',
      tone: 'positive',
      text: `${topProduct.name} is today's best seller (${topProduct.quantity} sold).`,
    });
  }

  // 3. What is it costing?
  if (todayExpensesTotal != null && todayExpensesTotal > 0) {
    const heavy = todaySalesTotal > 0 && todayExpensesTotal > todaySalesTotal * 0.5;
    bullets.push({
      id: 'expenses',
      icon: 'wallet',
      tone: heavy ? 'warning' : 'neutral',
      text: heavy
        ? `Expenses (${formatMoney(todayExpensesTotal)}) are over half of today's sales.`
        : `Expenses remain low — ${formatMoney(todayExpensesTotal)} today.`,
    });
  } else if (todayProfit != null && todayProfit > 0) {
    bullets.push({
      id: 'profit',
      icon: 'trending-up',
      tone: 'positive',
      text: `About ${formatMoney(todayProfit)} gross profit so far.`,
    });
  }

  // 4. What needs attention on the shelf?
  const lowCount = lowStockItems?.length ?? 0;
  if (lowCount > 0) {
    const worst = lowStockItems[0];
    bullets.push({
      id: 'restock',
      icon: 'box',
      tone: 'warning',
      text:
        lowCount === 1
          ? `${worst.name} needs restocking (${worst.quantity} left).`
          : `${lowCount} products need restocking — ${worst.name} is lowest.`,
    });
  } else {
    bullets.push({ id: 'stock-ok', icon: 'check', tone: 'positive', text: 'Stock levels look healthy.' });
  }

  return bullets.slice(0, MAX_BULLETS);
}
