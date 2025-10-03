
import { useAppContext } from '../../../shared/context/AppContext';
import { BudgetOverview } from './BudgetOverview';
import type { Budget } from '../../../shared/types';

export function BudgetOverviewContainer() {
  const { state } = useAppContext();

  // Transform budget data to include calculated fields
  const budgetsWithProgress = state.budgets.map((budget: Budget) => {
    // Calculate spent amount (this would normally come from transactions)
    const spent = 0; // TODO: Calculate from transactions
    const remaining = Math.max(0, budget.limit - spent);
    const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (percentage >= 100) {
      status = 'danger';
    } else if (percentage >= 80) {
      status = 'warning';
    }

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);

    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((budget.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      ...budget,
      spent,
      remaining,
      percentage,
      status,
      formattedSpent: formatCurrency(spent),
      formattedRemaining: formatCurrency(remaining),
      formattedLimit: formatCurrency(budget.limit),
      daysRemaining,
      isOverBudget: spent > budget.limit,
    };
  });

  return <BudgetOverview budgets={budgetsWithProgress as any} />;
}