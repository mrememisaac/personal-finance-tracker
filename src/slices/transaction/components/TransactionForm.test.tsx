import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionForm } from './TransactionForm';
import { AppProvider } from '../../../shared/context/AppContext';
import type { Transaction, Account } from '../../../shared/types';

// Mock the TransactionService
vi.mock('../services/TransactionService', () => ({
  TransactionService: vi.fn().mockImplementation(() => ({
    addTransaction: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      transaction: {
        toJSON: () => ({
          id: '1',
          amount: 100,
          description: 'Test transaction',
          category: 'Food & Dining',
          accountId: 'account-1',
          type: 'expense',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    }),
    updateTransaction: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      transaction: {
        toJSON: () => ({
          id: '1',
          amount: 150,
          description: 'Updated transaction',
          category: 'Food & Dining',
          accountId: 'account-1',
          type: 'expense',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    }),
  })),
}));

// Mock data
const mockAccounts: Account[] = [
  {
    id: 'account-1',
    name: 'Checking Account',
    type: 'checking',
    balance: 1000,
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockTransaction: Transaction = {
  id: '1',
  amount: 100,
  description: 'Test transaction',
  category: 'Food & Dining',
  accountId: 'account-1',
  type: 'expense',
  date: new Date('2024-01-15'),
  tags: ['groceries', 'weekly'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Test wrapper component with mock data
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppProvider>
      <div>
        {children}
      </div>
    </AppProvider>
  );
};

describe('TransactionForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <TestWrapper>
          <TransactionForm
            isOpen={false}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Add Transaction')).not.toBeInTheDocument();
    });

    it('should render add transaction form when isOpen is true', () => {
      render(
        <TestWrapper>
          <TransactionForm
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: 'Add Transaction' })).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    });

    it('should render edit transaction form when transaction is provided', () => {
      render(
        <TestWrapper>
          <TransactionForm
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
            transaction={mockTransaction}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test transaction')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TransactionForm
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /add transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount must be greater than zero/i)).toBeInTheDocument();
        expect(screen.getAllByText(/this field is required/i)).toHaveLength(3); // description, category, account
      });
    });

    it('should validate amount field in real-time', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TransactionForm
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const amountInput = screen.getByLabelText(/amount/i);
      
      // Test invalid amount
      await user.type(amountInput, '0');
      await waitFor(() => {
        expect(screen.getByText(/amount must be greater than zero/i)).toBeInTheDocument();
      });

      // Test valid amount
      await user.clear(amountInput);
      await user.type(amountInput, '100');
      await waitFor(() => {
        expect(screen.queryByText(/amount must be greater than zero/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Transaction Type Switching', () => {
    it('should switch between expense and income types', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TransactionForm
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const expenseButton = screen.getByRole('button', { name: /expense/i });
      const incomeButton = screen.getByRole('button', { name: /income/i });

      // Should start with expense selected
      expect(expenseButton).toHaveClass('bg-red-50');
      
      // Switch to income
      await user.click(incomeButton);
      expect(incomeButton).toHaveClass('bg-green-50');
      expect(expenseButton).not.toHaveClass('bg-red-50');
    });
  });

  describe('Form Interactions', () => {
    it('should close form when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TransactionForm
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show character count for description', () => {
      render(
        <TestWrapper>
          <TransactionForm
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      expect(screen.getByText('0/200')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form inputs', () => {
      render(
        <TestWrapper>
          <TransactionForm
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    });
  });
});