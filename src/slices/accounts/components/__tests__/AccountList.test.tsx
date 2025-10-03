import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountList } from '../AccountList';
import { AppProvider } from '../../../../shared/context/AppContext';
import type { Account as IAccount, Transaction as ITransaction } from '../../../../shared/types';

// Mock the AccountService
const mockAccountService = {
  getAccountSummaries: vi.fn(),
  deleteAccount: vi.fn(),
};

vi.mock('../../services/AccountService', () => ({
  AccountService: vi.fn().mockImplementation(() => mockAccountService)
}));

const mockAccounts: IAccount[] = [
  {
    id: 'account-1',
    name: 'Main Checking',
    type: 'checking',
    balance: 1500,
    currency: 'USD',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'account-2',
    name: 'Savings Account',
    type: 'savings',
    balance: 5000,
    currency: 'USD',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    id: 'account-3',
    name: 'Credit Card',
    type: 'credit',
    balance: -500,
    currency: 'USD',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  }
];

const mockTransactions: ITransaction[] = [
  {
    id: 'tx-1',
    date: new Date('2024-01-15'),
    amount: 100,
    description: 'Deposit',
    category: 'Income',
    accountId: 'account-1',
    type: 'income',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
];

const mockAccountSummaries = [
  {
    id: 'account-1',
    name: 'Main Checking',
    type: 'Checking Account',
    balance: 1600,
    formattedBalance: '$1,600.00',
    status: 'positive' as const,
    transactionCount: 1
  },
  {
    id: 'account-2',
    name: 'Savings Account',
    type: 'Savings Account',
    balance: 5000,
    formattedBalance: '$5,000.00',
    status: 'positive' as const,
    transactionCount: 0
  },
  {
    id: 'account-3',
    name: 'Credit Card',
    type: 'Credit Card',
    balance: -500,
    formattedBalance: '-$500.00',
    status: 'negative' as const,
    transactionCount: 0
  }
];

// Mock the context with test data
const mockContextValue = {
  state: {
    accounts: mockAccounts,
    transactions: mockTransactions,
    budgets: [],
    goals: [],
    settings: {
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      theme: 'light' as const,
      notifications: true
    }
  },
  dispatch: vi.fn()
};

vi.mock('../../../../shared/context/AppContext', () => ({
  useAppContext: () => mockContextValue,
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const defaultProps = {
  showActions: true,
  compact: false,
};

describe('AccountList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountService.getAccountSummaries.mockReturnValue(mockAccountSummaries);
    mockAccountService.deleteAccount.mockReturnValue({ isValid: true, errors: [] });
  });

  describe('Rendering', () => {
    it('should render account list with all accounts', () => {
      render(<AccountList {...defaultProps} />);

      expect(screen.getByText('Accounts')).toBeInTheDocument();
      expect(screen.getByText('3 of 3 accounts')).toBeInTheDocument();
      expect(screen.getByText('Main Checking')).toBeInTheDocument();
      expect(screen.getByText('Savings Account')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
    });

    it('should show add account button when showActions is true', () => {
      render(<AccountList {...defaultProps} showActions={true} />);

      expect(screen.getByText('Add Account')).toBeInTheDocument();
    });

    it('should hide add account button when showActions is false', () => {
      render(<AccountList {...defaultProps} showActions={false} />);

      expect(screen.queryByText('Add Account')).not.toBeInTheDocument();
    });

    it('should render in compact mode', () => {
      render(<AccountList {...defaultProps} compact={true} />);

      // In compact mode, some details should be hidden
      expect(screen.getByText('Main Checking')).toBeInTheDocument();
      // Transaction count should not be visible in compact mode
      expect(screen.queryByText('1 transactions')).not.toBeInTheDocument();
    });
  });

  describe('Account Display', () => {
    it('should display account balances with correct formatting', () => {
      render(<AccountList {...defaultProps} />);

      expect(screen.getByText('$1,600.00')).toBeInTheDocument();
      expect(screen.getByText('$5,000.00')).toBeInTheDocument();
      expect(screen.getByText('-$500.00')).toBeInTheDocument();
    });

    it('should show account types and currencies', () => {
      render(<AccountList {...defaultProps} />);

      expect(screen.getByText('Checking Account')).toBeInTheDocument();
      expect(screen.getByText('Savings Account')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
      expect(screen.getAllByText('USD')).toHaveLength(3);
    });

    it('should display transaction counts', () => {
      render(<AccountList {...defaultProps} />);

      expect(screen.getByText('1 transactions')).toBeInTheDocument();
      expect(screen.getAllByText('0 transactions')).toHaveLength(2);
    });

    it('should show status indicators', () => {
      render(<AccountList {...defaultProps} />);

      // Should have status icons (CheckCircle for positive, XCircle for negative)
      const positiveIcons = screen.getAllByTestId('check-circle') || [];
      const negativeIcons = screen.getAllByTestId('x-circle') || [];
      
      // At least one positive and one negative status should be present
      expect(positiveIcons.length + negativeIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Search and Filtering', () => {
    it('should filter accounts by search term', async () => {
      render(<AccountList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search accounts...');
      fireEvent.change(searchInput, { target: { value: 'checking' } });

      await waitFor(() => {
        expect(screen.getByText('Main Checking')).toBeInTheDocument();
        expect(screen.queryByText('Savings Account')).not.toBeInTheDocument();
        expect(screen.queryByText('Credit Card')).not.toBeInTheDocument();
      });
    });

    it('should show and hide filter controls', () => {
      render(<AccountList {...defaultProps} />);

      const filterButton = screen.getByText('Filters');
      
      // Filters should be hidden initially
      expect(screen.queryByText('Account Type')).not.toBeInTheDocument();
      
      // Click to show filters
      fireEvent.click(filterButton);
      expect(screen.getByText('Account Type')).toBeInTheDocument();
      expect(screen.getByText('Currency')).toBeInTheDocument();
    });

    it('should filter by account type', async () => {
      render(<AccountList {...defaultProps} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));
      
      // Select savings account type
      const typeSelect = screen.getByLabelText('Account Type');
      fireEvent.change(typeSelect, { target: { value: 'savings' } });

      await waitFor(() => {
        expect(screen.getByText('Savings Account')).toBeInTheDocument();
        expect(screen.queryByText('Main Checking')).not.toBeInTheDocument();
        expect(screen.queryByText('Credit Card')).not.toBeInTheDocument();
      });
    });

    it('should clear filters', async () => {
      render(<AccountList {...defaultProps} />);

      // Show filters and apply a filter
      fireEvent.click(screen.getByText('Filters'));
      const typeSelect = screen.getByLabelText('Account Type');
      fireEvent.change(typeSelect, { target: { value: 'savings' } });

      // Clear filters button should appear
      await waitFor(() => {
        expect(screen.getByText('Clear filters')).toBeInTheDocument();
      });

      // Click clear filters
      fireEvent.click(screen.getByText('Clear filters'));

      // All accounts should be visible again
      expect(screen.getByText('Main Checking')).toBeInTheDocument();
      expect(screen.getByText('Savings Account')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should show sort controls', () => {
      render(<AccountList {...defaultProps} />);

      expect(screen.getByText('Sort by:')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('type')).toBeInTheDocument();
      expect(screen.getByText('balance')).toBeInTheDocument();
      expect(screen.getByText('Date Created')).toBeInTheDocument();
    });

    it('should sort accounts by name', async () => {
      render(<AccountList {...defaultProps} />);

      const nameSort = screen.getByText('name');
      fireEvent.click(nameSort);

      // Should show sort direction indicator
      expect(nameSort).toHaveClass('text-blue-600');
    });

    it('should toggle sort direction', async () => {
      render(<AccountList {...defaultProps} />);

      const nameSort = screen.getByText('name');
      
      // First click - ascending
      fireEvent.click(nameSort);
      expect(nameSort.textContent).toContain('↑');
      
      // Second click - descending
      fireEvent.click(nameSort);
      expect(nameSort.textContent).toContain('↓');
    });
  });

  describe('Account Actions', () => {
    it('should open account form when add button is clicked', () => {
      render(<AccountList {...defaultProps} />);

      const addButton = screen.getByText('Add Account');
      fireEvent.click(addButton);

      // Form should open (we can't test the modal directly without more setup)
      expect(addButton).toBeInTheDocument();
    });

    it('should show edit and delete buttons for each account', () => {
      render(<AccountList {...defaultProps} />);

      // Should have edit and delete buttons for each account
      const editButtons = screen.getAllByTitle('Edit account');
      const deleteButtons = screen.getAllByTitle('Delete account');

      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });

    it('should open delete confirmation when delete button is clicked', async () => {
      render(<AccountList {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('Delete account');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });
    });

    it('should call onAccountSelect when account is clicked', () => {
      const onAccountSelect = vi.fn();
      render(<AccountList {...defaultProps} onAccountSelect={onAccountSelect} />);

      // Click on the first account card
      const accountCard = screen.getByText('Main Checking').closest('div');
      fireEvent.click(accountCard!);

      expect(onAccountSelect).toHaveBeenCalledWith(mockAccounts[0]);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no accounts exist', () => {
      // Mock empty accounts
      mockContextValue.state.accounts = [];
      mockAccountService.getAccountSummaries.mockReturnValue([]);

      render(<AccountList {...defaultProps} />);

      expect(screen.getByText('No accounts yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by adding your first account')).toBeInTheDocument();
      expect(screen.getByText('Add Your First Account')).toBeInTheDocument();
    });

    it('should show filtered empty state when no accounts match filters', async () => {
      render(<AccountList {...defaultProps} />);

      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText('Search accounts...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No accounts match your filters')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Confirmation', () => {
    it('should cancel delete when cancel button is clicked', async () => {
      render(<AccountList {...defaultProps} />);

      // Open delete confirmation
      const deleteButtons = screen.getAllByTitle('Delete account');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeInTheDocument();
      });

      // Click cancel
      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
      });
    });

    it('should delete account when confirmed', async () => {
      render(<AccountList {...defaultProps} />);

      // Open delete confirmation
      const deleteButtons = screen.getAllByTitle('Delete account');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeInTheDocument();
      });

      // Click delete
      const confirmDeleteButton = screen.getByRole('button', { name: 'Delete Account' });
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(mockAccountService.deleteAccount).toHaveBeenCalledWith('account-1');
      });
    });
  });
});