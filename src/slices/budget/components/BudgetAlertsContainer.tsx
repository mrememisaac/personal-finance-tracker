
import { useAppContext } from '../../../shared/context/AppContext';
import { BudgetAlerts } from './BudgetAlerts';

export function BudgetAlertsContainer() {
  const { state } = useAppContext();

  // Generate mock alerts based on budget data
  const alerts = state.budgets
    .filter(budget => budget.isActive)
    .map(budget => {
      // Mock calculation - in real app this would come from transactions
      const spent = 0;
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

      if (percentage >= 100) {
        return {
          budgetId: budget.id,
          category: budget.category,
          message: `Budget exceeded for ${budget.category}`,
          severity: 'danger' as const,
        };
      } else if (percentage >= 80) {
        return {
          budgetId: budget.id,
          category: budget.category,
          message: `Budget warning for ${budget.category} (${percentage.toFixed(1)}% used)`,
          severity: 'warning' as const,
        };
      }
      return null;
    })
    .filter(Boolean);

  return <BudgetAlerts alerts={alerts.filter(alert => alert !== null)} />;
}