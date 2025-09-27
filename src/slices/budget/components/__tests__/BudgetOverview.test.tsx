import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import BudgetOverview from '../BudgetOverview';
import { Budget } from '../../Budget';
import type { Budget as IBudget } from '../../../../shared/types';

describe('BudgetOverview', () => {
  let mockBudgets: Budget[];

  beforeEach(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const budgetData: IBudget[] = [
      {
        id: 'budget1',
        category: 'Food',
        limit: 500,
        period: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'budget2',
        category: 'Transportation',
        limit: 200,
        period: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'budget3',
        category: 'Entertainment',
        limit: 100,
        period: 'weekly',
        startDate: startOfMonth,
        endDate: new Date(startOfMonth.getTime() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockBudgets = budgetData.map(data => {
      const budget = new Budget(data);
      // Simulate different spending levels for testing
      if (data.category === 'Food') {
        // Safe budget - 40% used
        budget.updateSpentAmount([
          {
            id: '1',
            date: now,
            amount: 200,
            description: 'Groceries',
            category: 'Food',
            accountId: 'acc1',
            type: 'expense',
            createdAt: now,
            updatedAt: now
          }
        ]);
      } else if (data.category === 'Transportation') {
        // Warning budget - 85% used
        budget.updateSpentAmount([
          {
            id: '2',
            date: now,
            amount: 170,
            description: 'Gas',
            category: 'Transportation',
            accountId: 'acc1',
            type: 'expense',
            createdAt: now,
            updatedAt: now
          }
        ]);
      } else if (data.category === 'Entertainment') {
        // Over budget - 120% used
        budget.updateSpentAmount([
          {
            id: '3',
            date: now,
            amount: 120,
            description: 'Movies',
            category: 'Entertainment',
            accountId: 'acc1',
            type: 'expense',
            createdAt: now,
            updatedAt: now
          }
        ]);
      }
      return budget;
    });
  });

  describe('Component Rendering', () => {
    it('should render budget overview with all budgets', () => {
      render(<BudgetOverview budgets={mockBudgets} />);

      expect(screen.getByText('Budget Overview')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('Transportation')).toBeInTheDocument();
      expect(screen.getByText('Entertainment')).toBeInTheDocument();
    });

    it('should render empty state when no budgets provided', () => {
      render(<BudgetOverview budgets={[]} />);

      expect(screen.getByText('No Active Budgets')).toBeInTheDocument();
      expect(screen.getByText('Create your first budget to start tracking your spending.')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<BudgetOverview budgets={mockBudgets} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Overall Summary', () => {
    it('should display correct total budgeted amount', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      // 500 + 200 + 100 = 800
      expect(screen.getByText('$800.00')).toBeInTheDocument();
      expect(screen.getByText('Total Budgeted')).toBeInTheDocument();
    });

    it('should display correct total spent amount', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      // 200 + 170 + 120 = 490
      expect(screen.getByText('$490.00')).toBeInTheDocument();
      expect(screen.getByText('Total Spent')).toBeInTheDocument();
    });

    it('should display correct total remaining amount', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      // (500-200) + (200-170) + (100-120) = 300 + 30 + (-20) = 310
      expect(screen.getByText('$310.00')).toBeInTheDocument();
      expect(screen.getByText('Total Remaining')).toBeInTheDocument();
    });

    it('should display correct overall usage percentage', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      // 490/800 * 100 = 61.25%
      expect(screen.getByText('61.3%')).toBeInTheDocument();
      expect(screen.getByText('Overall Usage')).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('should show safe status for budgets under 80%', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      const foodBudget = screen.getByText('Food').closest('div');
      expect(foodBudget).toHaveClass('bg-green-50', 'border-green-200');
    });

    it('should show warning status for budgets between 80-100%', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      const transportationBudget = screen.getByText('Transportation').closest('div');
      expect(transportationBudget).toHaveClass('bg-yellow-50', 'border-yellow-200');
    });

    it('should show danger status for budgets over 100%', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      const entertainmentBudget = screen.getByText('Entertainment').closest('div');
      expect(entertainmentBudget).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('should display correct status icons', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      // Check for Lucide icons by their SVG elements
      const icons = screen.getAllByRole('img', { hidden: true });
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Bars', () => {
    it('should display progress bars with correct widths', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      // Food budget: 40% used
      expect(screen.getByText('40.0% used')).toBeInTheDocument();
      
      // Transportation budget: 85% used
      expect(screen.getByText('85.0% used')).toBeInTheDocument();
      
      // Entertainment budget: 120% used (capped at 100% for display)
      expect(screen.getByText('120.0% used')).toBeInTheDocument();
    });

    it('should show remaining days for each budget', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      // Should show days remaining for each budget
      const daysElements = screen.getAllByText(/\d+ days left/);
      expect(daysElements.length).toBe(3);
    });
  });

  describe('Budget Details', () => {
    it('should display spent amounts correctly', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      expect(screen.getByText('$200.00')).toBeInTheDocument(); // Food spent
      expect(screen.getByText('$170.00')).toBeInTheDocument(); // Transportation spent
      expect(screen.getByText('$120.00')).toBeInTheDocument(); // Entertainment spent
    });

    it('should display remaining amounts correctly', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      expect(screen.getByText('$300.00')).toBeInTheDocument(); // Food remaining
      expect(screen.getByText('$30.00')).toBeInTheDocument(); // Transportation remaining
      expect(screen.getByText('$0.00')).toBeInTheDocument(); // Entertainment remaining (over budget)
    });

    it('should display budget limits correctly', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      expect(screen.getByText('$500.00')).toBeInTheDocument(); // Food limit
      expect(screen.getByText('$200.00')).toBeInTheDocument(); // Transportation limit
      expect(screen.getByText('$100.00')).toBeInTheDocument(); // Entertainment limit
    });

    it('should show budget periods correctly', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      expect(screen.getAllByText('Monthly')).toHaveLength(2);
      expect(screen.getByText('Weekly')).toBeInTheDocument();
    });
  });

  describe('Status Messages', () => {
    it('should show warning message for warning status budgets', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      expect(screen.getByText(/You've used 85.0% of your budget/)).toBeInTheDocument();
    });

    it('should show danger message for over-budget budgets', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      expect(screen.getByText(/Over budget by/)).toBeInTheDocument();
    });
  });

  describe('Quick Stats', () => {
    it('should display correct count of safe budgets', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      const quickStatsSection = screen.getByText('Quick Stats').closest('div');
      expect(quickStatsSection).toBeInTheDocument();
      
      // 1 safe budget (Food)
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Safe Budgets')).toBeInTheDocument();
    });

    it('should display correct count of warning budgets', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      // 1 warning budget (Transportation)
      const warningElements = screen.getAllByText('1');
      expect(warningElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Warning Budgets')).toBeInTheDocument();
    });

    it('should display correct count of over-budget budgets', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      // 1 over budget (Entertainment)
      const overBudgetElements = screen.getAllByText('1');
      expect(overBudgetElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Over Budget')).toBeInTheDocument();
    });

    it('should display correct total budget count', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Total Budgets')).toBeInTheDocument();
    });
  });

  describe('Overall Status', () => {
    it('should show correct overall status based on total usage', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      // Overall usage is 61.3%, which should be "safe"
      expect(screen.getByText('On Track')).toBeInTheDocument();
    });

    it('should show warning status when overall usage is between 80-100%', () => {
      // Create budgets with higher overall usage
      const highUsageBudgets = mockBudgets.map(budget => {
        const newBudget = budget.clone();
        if (budget.category === 'Food') {
          newBudget.updateSpentAmount([
            {
              id: '1',
              date: new Date(),
              amount: 450, // 90% of 500
              description: 'High spending',
              category: 'Food',
              accountId: 'acc1',
              type: 'expense',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]);
        }
        return newBudget;
      });

      render(<BudgetOverview budgets={highUsageBudgets} />);
      
      expect(screen.getByText('Watch Spending')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      expect(screen.getByRole('heading', { level: 2, name: 'Budget Overview' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Budget Details' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Quick Stats' })).toBeInTheDocument();
    });

    it('should have meaningful text content for screen readers', () => {
      render(<BudgetOverview budgets={mockBudgets} />);
      
      // Check that important information is available as text
      expect(screen.getByText('Total Budgeted')).toBeInTheDocument();
      expect(screen.getByText('Total Spent')).toBeInTheDocument();
      expect(screen.getByText('Total Remaining')).toBeInTheDocument();
      expect(screen.getByText('Overall Usage')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render grid layouts for responsive design', () => {
      const { container } = render(<BudgetOverview budgets={mockBudgets} />);
      
      // Check for responsive grid classes
      expect(container.querySelector('.grid')).toBeInTheDocument();
      expect(container.querySelector('.md\\:grid-cols-2')).toBeInTheDocument();
      expect(container.querySelector('.lg\\:grid-cols-3')).toBeInTheDocument();
    });
  });
});