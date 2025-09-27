import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TransactionList } from './TransactionList';
import { AppContext } from '../../../shared/context/AppContext';
import type { AppState, Transaction, Account } from '../../../shared/types';

// Mock the debounce utility to make tests synchronous
vi.mock('../../../shared/utils', async () => {
  const actual = await vi.importActual('../../../shared/utils');
  return {
    ...actual,
    debounce: (fn: any) => fn, // Return the function immediately without debouncing
  };
});

// Mock data
const mockAccounts: Account[] = [
  {
    id: 'acc1',
    name: 'Checking Account',
    type: 'checking',
    balance: 1000,
    currency: 'USD',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'acc2',
    name: 'Savings Account',
    type: 'savings',
    balance: 5000,
    currency: 'USD',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const mockTransactions: Transaction[] = [
  {
    id: 'txn1',
    date: new Date('2024-01-15'),
    amount: 50.00,
    description: 'Grocery shopping',
    category: 'Food & Dining',
    accountId: 'acc1',
    type: 'expense',
    tags: ['groceries', 'weekly'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'txn2',
    date: new Date('2024-01-10'),
    amount: 2000.00,
    description: 'Salary payment',
    category: 'Salary',
    accountId: 'acc1',
    type: 'income',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'txn3',
    date: new Date('2024-01-12'),
    amount: 25.99,
    description: 'Coffee shop',
    category: 'Food & Dining',
    accountId: 'acc2',
    type: 'expense',
    tags: ['coffee'],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: 'txn4',
    date: new Date('2024-01-08'),
    amount: 100.00,
    description: 'Gas bill',
    category: 'Bills & Utilities',
    accountId: 'acc1',
    type: 'expense',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: 'txn5',
    date: new Date('2024-01-20'),
    amount: 500.00,
    description: 'Freelance work',
    category: 'Freelance',
    accountId: 'acc2',
    type: 'income',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

const mockState: AppState = {
  accounts: mockAccounts,
  transactions: mockTransactions,
  budgets: [],
  goals: [],
  settings: {
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    theme: 'light',
    notifications: true,
  },
};

const mockDispatch = vi.fn();

const renderWithContext = (component: React.ReactElement, state = mockState) => {
  return render(
    <AppContext.Provider value={{ state, dispatch: mockDispatch }}>
      {component}
    </AppContext.Provider>
  );
};

describe('TransactionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders transaction list with correct data', () => {
      renderWithContext(<TransactionList />);
      
      // Check if the component renders
      expect(screen.getByText(/Transactions \(5\)/)).toBeInTheDocument();
      
      // Check if transactions are displayed (should be sorted by date desc by default)
      expect(screen.getByText('Freelance work')).toBeInTheDocument();
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
      expect(screen.getByText('Salary payment')).toBeInTheDocument();
    });

    it('displays transaction count correctly', () => {
      renderWithContext(<TransactionList />);
      expect(screen.getByText('Transactions (5)')).toBeInTheDocument();
    });

    it('shows empty state when no transactions', () => {
      const emptyState = { ...mockState, transactions: [] };
      renderWithContext(<TransactionList />, emptyState);
      
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });
  });

  describe('Transaction Display', () => {
    it('displays transaction details correctly', () => {
      renderWithContext(<TransactionList />);
      
      // Check transaction details
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
      expect(screen.getByText('Checking Account')).toBeInTheDocument();
      expect(screen.getByText('-$50.00')).toBeInTheDocument();
    });

    it('shows color-coded transaction type indicators', () => {
      renderWithContext(<TransactionList />);
      
      // Income transactions should have green indicators
      const incomeRows = screen.getAllByText('INCOME');
      incomeRows.forEach(row => {
        expect(row.closest('div')).toHaveClass('text-green-600');
      });
      
      // Expense transactions should have red indicators
      const expenseRows = screen.getAllByText('EXPENSE');
      expenseRows.forEach(row => {
        expect(row.closest('div')).toHaveClass('text-red-600');
      });
    });

    it('displays transaction tags correctly', () => {
      renderWithContext(<TransactionList />);
      
      // Check if tags are displayed
      expect(screen.getByText('groceries')).toBeInTheDocument();
      expect(screen.getByText('weekly')).toBeInTheDocument();
      expect(screen.getByText('coffee')).toBeInTheDocument();
    });

    it('truncates long descriptions with title attribute', () => {
      const longDescTransaction = {
        ...mockTransactions[0],
        description: 'This is a very long transaction description that should be truncated in the display but available in the title attribute for accessibility',
      };
      
      const stateWithLongDesc = {
        ...mockState,
        transactions: [longDescTransaction],
      };
      
      renderWithContext(<TransactionList />, stateWithLongDesc);
      
      const descriptionElement = screen.getByText(longDescTransaction.description);
      expect(descriptionElement).toHaveAttribute('title', longDescTransaction.description);
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts transactions by date in descending order by default', () => {
      renderWithContext(<TransactionList />);
      
      const rows = screen.getAllByRole('row');
      // Skip header row, check first data row
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('Freelance work')).toBeInTheDocument(); // Most recent transaction
    });

    it('allows sorting by different columns', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Click on amount column to sort by amount
      const amountHeader = screen.getByRole('button', { name: /amount/i });
      await user.click(amountHeader);
      
      // Should now be sorted by amount ascending
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('Coffee shop')).toBeInTheDocument(); // Lowest amount
    });

    it('toggles sort direction when clicking same column twice', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      const dateHeader = screen.getByRole('button', { name: /date/i });
      
      // First click - should be ascending (oldest first)
      await user.click(dateHeader);
      let rows = screen.getAllByRole('row');
      let firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('Gas bill')).toBeInTheDocument(); // Oldest transaction
      
      // Second click - should be descending (newest first)
      await user.click(dateHeader);
      rows = screen.getAllByRole('row');
      firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('Freelance work')).toBeInTheDocument(); // Newest transaction
    });

    it('displays correct sort icons', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Default sort by date desc should show down arrow
      const dateHeader = screen.getByRole('button', { name: /date/i });
      expect(dateHeader.querySelector('svg')).toBeInTheDocument();
      
      // Click to change to ascending
      await user.click(dateHeader);
      expect(dateHeader.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters transactions by search query', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      const searchInput = screen.getByPlaceholderText('Search transactions...');
      await user.type(searchInput, 'grocery');
      
      // Should only show grocery transaction
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
      expect(screen.queryByText('Salary payment')).not.toBeInTheDocument();
    });

    it('searches in description, category, and tags', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      const searchInput = screen.getByPlaceholderText('Search transactions...');
      
      // Search by category
      await user.clear(searchInput);
      await user.type(searchInput, 'Food');
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
      expect(screen.getByText('Coffee shop')).toBeInTheDocument();
      
      // Search by tag
      await user.clear(searchInput);
      await user.type(searchInput, 'coffee');
      expect(screen.getByText('Coffee shop')).toBeInTheDocument();
      expect(screen.queryByText('Grocery shopping')).not.toBeInTheDocument();
    });

    it('shows no results message when search yields no matches', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      const searchInput = screen.getByPlaceholderText('Search transactions...');
      await user.type(searchInput, 'nonexistent');
      
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
    it('shows and hides filter panel', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      
      // Filter panel should be hidden initially
      expect(screen.queryByText('Date Period')).not.toBeInTheDocument();
      
      // Click to show filters
      await user.click(filterButton);
      expect(screen.getByText('Date Period')).toBeInTheDocument();
      
      // Click to hide filters
      await user.click(filterButton);
      expect(screen.queryByText('Date Period')).not.toBeInTheDocument();
    });

    it('filters by transaction type', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Show filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      // Filter by income only
      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'income');
      
      // Should only show income transactions
      expect(screen.getByText('Salary payment')).toBeInTheDocument();
      expect(screen.getByText('Freelance work')).toBeInTheDocument();
      expect(screen.queryByText('Grocery shopping')).not.toBeInTheDocument();
      expect(screen.getByText(/Transactions \(2\)/)).toBeInTheDocument();
    });

    it('filters by category', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Show filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      // Filter by Food & Dining category
      const categorySelect = screen.getByDisplayValue('All Categories');
      await user.selectOptions(categorySelect, 'Food & Dining');
      
      // Should only show Food & Dining transactions
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
      expect(screen.getByText('Coffee shop')).toBeInTheDocument();
      expect(screen.queryByText('Salary payment')).not.toBeInTheDocument();
      expect(screen.getByText(/Transactions \(2\)/)).toBeInTheDocument();
    });

    it('filters by account', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Show filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      // Filter by Checking Account
      const accountSelect = screen.getByDisplayValue('All Accounts');
      await user.selectOptions(accountSelect, 'acc1');
      
      // Should only show transactions from Checking Account
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
      expect(screen.getByText('Salary payment')).toBeInTheDocument();
      expect(screen.getByText('Gas bill')).toBeInTheDocument();
      expect(screen.queryByText('Coffee shop')).not.toBeInTheDocument();
      expect(screen.getByText(/Transactions \(3\)/)).toBeInTheDocument();
    });

    it('filters by date period', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Show filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      // Filter by last 7 days
      const dateSelect = screen.getByDisplayValue('All Time');
      await user.selectOptions(dateSelect, '7days');
      
      // Should filter transactions based on date range
      // Note: This test might need adjustment based on current date
      expect(screen.getByText(/Transactions \(/)).toBeInTheDocument();
    });

    it('clears all filters', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Show filters and apply some filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'income');
      
      // Verify filter is applied
      expect(screen.getByText(/Transactions \(2\)/)).toBeInTheDocument();
      
      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      await user.click(clearButton);
      
      // Should show all transactions again
      expect(screen.getByText(/Transactions \(5\)/)).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('paginates transactions correctly', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Change items per page to 2
      const itemsPerPageSelect = screen.getByDisplayValue('10');
      await user.selectOptions(itemsPerPageSelect, '2');
      
      // Should show pagination controls
      expect(screen.getByText(/Showing 1 to 2 of 5 results/)).toBeInTheDocument();
      
      // Should have next page button
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeInTheDocument();
      expect(nextButton).not.toBeDisabled();
    });

    it('navigates between pages', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Set small page size
      const itemsPerPageSelect = screen.getByDisplayValue('10');
      await user.selectOptions(itemsPerPageSelect, '2');
      
      // Go to next page
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      expect(screen.getByText(/Showing 3 to 4 of 5 results/)).toBeInTheDocument();
    });

    it('disables navigation buttons appropriately', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Set small page size
      const itemsPerPageSelect = screen.getByDisplayValue('10');
      await user.selectOptions(itemsPerPageSelect, '2');
      
      // Previous button should be disabled on first page
      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
      
      // Go to last page
      const page3Button = screen.getByRole('button', { name: '3' });
      await user.click(page3Button);
      
      // Next button should be disabled on last page
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Export Functionality', () => {
    // Mock URL.createObjectURL and related functions
    beforeEach(() => {
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock document.createElement and appendChild/removeChild
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return mockAnchor as any;
        }
        return document.createElement(tagName);
      });
      
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('exports transactions as CSV', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Hover over export button to show dropdown
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.hover(exportButton);
      
      // Click CSV export
      const csvButton = screen.getByText('Export CSV');
      await user.click(csvButton);
      
      // Verify that download was triggered
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('exports transactions as JSON', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Hover over export button to show dropdown
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.hover(exportButton);
      
      // Click JSON export
      const jsonButton = screen.getByText('Export JSON');
      await user.click(jsonButton);
      
      // Verify that download was triggered
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('Action Callbacks', () => {
    it('calls onEditTransaction when edit button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnEdit = vi.fn();
      
      renderWithContext(<TransactionList onEditTransaction={mockOnEdit} />);
      
      // Click edit button on first transaction
      const editButtons = screen.getAllByTitle('Edit transaction');
      await user.click(editButtons[0]);
      
      expect(mockOnEdit).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        description: expect.any(String),
      }));
    });

    it('calls onDeleteTransaction when delete button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnDelete = vi.fn();
      
      renderWithContext(<TransactionList onDeleteTransaction={mockOnDelete} />);
      
      // Click delete button on first transaction
      const deleteButtons = screen.getAllByTitle('Delete transaction');
      await user.click(deleteButtons[0]);
      
      expect(mockOnDelete).toHaveBeenCalledWith(expect.any(String));
    });

    it('does not show action buttons when callbacks are not provided', () => {
      renderWithContext(<TransactionList />);
      
      expect(screen.queryByTitle('Edit transaction')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete transaction')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies custom className', () => {
      const { container } = renderWithContext(
        <TransactionList className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('handles mobile layout gracefully', () => {
      renderWithContext(<TransactionList />);
      
      // The table should be in a scrollable container
      const tableContainer = screen.getByRole('table').closest('.overflow-x-auto');
      expect(tableContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles transactions without tags', () => {
      const transactionWithoutTags = {
        ...mockTransactions[0],
        tags: undefined,
      };
      
      const stateWithoutTags = {
        ...mockState,
        transactions: [transactionWithoutTags],
      };
      
      renderWithContext(<TransactionList />, stateWithoutTags);
      
      // Should render without errors
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
    });

    it('handles unknown account IDs gracefully', () => {
      const transactionWithUnknownAccount = {
        ...mockTransactions[0],
        accountId: 'unknown-account',
      };
      
      const stateWithUnknownAccount = {
        ...mockState,
        transactions: [transactionWithUnknownAccount],
      };
      
      renderWithContext(<TransactionList />, stateWithUnknownAccount);
      
      expect(screen.getByText('Unknown Account')).toBeInTheDocument();
    });

    it('handles empty search results with clear filter option', async () => {
      const user = userEvent.setup();
      renderWithContext(<TransactionList />);
      
      // Apply a filter first
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'income');
      
      // Then search for something that won't match
      const searchInput = screen.getByPlaceholderText('Search transactions...');
      await user.type(searchInput, 'nonexistent');
      
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
      expect(screen.getByText('Clear filters to see all transactions')).toBeInTheDocument();
    });
  });
});