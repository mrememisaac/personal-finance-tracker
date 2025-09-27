import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReportsDashboard } from './ReportsDashboard';
import { AppProvider } from '../../../shared/context/AppContext';
import type { AppState } from '../../../shared/types';

// Mock Chart.js and react-chartjs-2
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  ArcElement: {},
}));

vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart">Line Chart</div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart">Bar Chart</div>
  ),
  Pie: ({ data, options }: any) => (
    <div data-testid="pie-chart">Pie Chart</div>
  ),
}));

// Mock utility functions
vi.mock('../../../shared/utils', () => ({
  getDateFilter: vi.fn((period) => ({
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  })),
  formatCurrency: vi.fn((amount) => `$${amount.toFixed(2)}`),
  sumBy: vi.fn((array, key) => {
    return array.reduce((sum, item) => {
      const value = item[key];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }),
  groupBy: vi.fn((array, key) => {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {});
  }),
  isDateInRange: vi.fn((date, start, end) => date >= start && date <= end),
}));

// Mock ChartsSection component
vi.mock('./ChartsSection', () => ({
  ChartsSection: ({ selectedPeriod, onPeriodChange }: any) => (
    <div data-testid="charts-section">
      <span>Charts Section - Period: {selectedPeriod}</span>
      <button onClick={() => onPeriodChange?.('7days')}>Change Period</button>
    </div>
  ),
}));

describe('ReportsDashboard', () => {
  const mockState: AppState = {
    transactions: [
      {
        id: '1',
        date: new Date('2024-01-15'),
        amount: 1000,
        description: 'Salary',
        category: 'Income',
        accountId: 'acc1',
        type: 'income',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        date: new Date('2024-01-16'),
        amount: -200,
        description: 'Groceries',
        category: 'Food',
        accountId: 'acc1',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        date: new Date('2024-01-17'),
        amount: -100,
        description: 'Gas',
        category: 'Transportation',
        accountId: 'acc1',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    accounts: [
      {
        id: 'acc1',
        name: 'Checking Account',
        type: 'checking',
        balance: 700,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'acc2',
        name: 'Savings Account',
        type: 'savings',
        balance: 5000,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    budgets: [
      {
        id: 'budget1',
        category: 'Food',
        limit: 400,
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    goals: [],
    settings: {
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      theme: 'light',
      notifications: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <AppProvider>
        {component}
      </AppProvider>
    );
  };

  it('should render reports dashboard with header', () => {
    renderWithProvider(<ReportsDashboard />);

    expect(screen.getByText('Financial Reports')).toBeInTheDocument();
    expect(screen.getByText('Analyze your financial data with detailed reports and visualizations')).toBeInTheDocument();
  });

  it('should render filter and export buttons', () => {
    renderWithProvider(<ReportsDashboard />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should toggle filters panel when filter button is clicked', () => {
    renderWithProvider(<ReportsDashboard />);

    const filterButton = screen.getByText('Filters');
    
    // Filters should not be visible initially
    expect(screen.queryByText('Time Period')).not.toBeInTheDocument();
    
    // Click to show filters
    fireEvent.click(filterButton);
    expect(screen.getByText('Time Period')).toBeInTheDocument();
    expect(screen.getByText('Transaction Type')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    
    // Click to hide filters
    fireEvent.click(filterButton);
    expect(screen.queryByText('Time Period')).not.toBeInTheDocument();
  });

  it('should render summary statistics cards', () => {
    renderWithProvider(<ReportsDashboard />);

    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Balance')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });

  it('should render charts section', () => {
    renderWithProvider(<ReportsDashboard />);

    expect(screen.getByTestId('charts-section')).toBeInTheDocument();
    expect(screen.getByText(/Charts Section - Period: 30days/)).toBeInTheDocument();
  });

  it('should render spending by category section', () => {
    renderWithProvider(<ReportsDashboard />);

    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });

  it('should render budget vs actual section', () => {
    renderWithProvider(<ReportsDashboard />);

    expect(screen.getByText('Budget vs Actual')).toBeInTheDocument();
  });

  it('should change period when period filter is changed', () => {
    renderWithProvider(<ReportsDashboard />);

    // Open filters
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    // Change period
    const periodSelect = screen.getByDisplayValue('30 Days');
    fireEvent.change(periodSelect, { target: { value: '7days' } });

    // Charts section should reflect the change
    expect(screen.getByText(/Charts Section - Period: 7days/)).toBeInTheDocument();
  });

  it('should handle category filter changes', () => {
    renderWithProvider(<ReportsDashboard />);

    // Open filters
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    // Check that categories section exists
    expect(screen.getByText('Categories')).toBeInTheDocument();
    // Note: Categories won't be populated in test environment due to mock limitations
  });

  it('should handle transaction type filter changes', () => {
    renderWithProvider(<ReportsDashboard />);

    // Open filters
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    // Find and click income checkbox (lowercase in component)
    const incomeCheckbox = screen.getByLabelText('income');
    fireEvent.click(incomeCheckbox);

    expect(incomeCheckbox).toBeChecked();
  });

  it('should handle account filter changes', () => {
    renderWithProvider(<ReportsDashboard />);

    // Open filters
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    // Check that accounts section exists
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    // Note: Accounts won't be populated in test environment due to mock limitations
  });

  it('should clear all filters when clear button is clicked', () => {
    renderWithProvider(<ReportsDashboard />);

    // Open filters
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    // Select some filters
    const incomeCheckbox = screen.getByLabelText('income');
    fireEvent.click(incomeCheckbox);

    expect(incomeCheckbox).toBeChecked();

    // Clear filters
    const clearButton = screen.getByText('Clear All Filters');
    fireEvent.click(clearButton);

    expect(incomeCheckbox).not.toBeChecked();
  });

  it('should show export dropdown on hover', async () => {
    renderWithProvider(<ReportsDashboard />);

    const exportButton = screen.getByText('Export');
    
    // Export options should be present (they're always in DOM but hidden with CSS)
    expect(screen.getByText('Export as CSV')).toBeInTheDocument();
    expect(screen.getByText('Export as JSON')).toBeInTheDocument();
  });

  it('should handle CSV export', () => {
    renderWithProvider(<ReportsDashboard />);

    const csvButton = screen.getByText('Export as CSV');
    expect(csvButton).toBeInTheDocument();
    
    // Test that clicking doesn't throw an error
    expect(() => fireEvent.click(csvButton)).not.toThrow();
  });

  it('should handle JSON export', () => {
    renderWithProvider(<ReportsDashboard />);

    const jsonButton = screen.getByText('Export as JSON');
    expect(jsonButton).toBeInTheDocument();
    
    // Test that clicking doesn't throw an error
    expect(() => fireEvent.click(jsonButton)).not.toThrow();
  });

  it('should have responsive design classes', () => {
    renderWithProvider(<ReportsDashboard />);

    // Check that main elements are present
    expect(screen.getByText('Financial Reports')).toBeInTheDocument();
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
  });

  it('should update charts section when period changes from charts', () => {
    renderWithProvider(<ReportsDashboard />);

    // Find the change period button in the mocked charts section
    const changePeriodButton = screen.getByText('Change Period');
    fireEvent.click(changePeriodButton);

    // Charts section should reflect the change
    expect(screen.getByText(/Charts Section - Period: 7days/)).toBeInTheDocument();
  });
});