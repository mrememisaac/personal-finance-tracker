import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountForm } from '../AccountForm';
import { AppProvider } from '../../../../shared/context/AppContext';
import type { Account as IAccount } from '../../../../shared/types';

// Mock the AccountService
vi.mock('../../services/AccountService', () => ({
  AccountService: vi.fn().mockImplementation(() => ({
    addAccount: vi.fn().mockReturnValue({ isValid: true, account: { toJSON: () => mockAccount } }),
    updateAccount: vi.fn().mockReturnValue({ isValid: true, account: { toJSON: () => mockAccount } }),
  }))
}));

const mockAccount: IAccount = {
  id: 'test-account-1',
  name: 'Test Account',
  type: 'checking',
  balance: 1000,
  currency: 'USD',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

const renderWithProvider = (props = {}) => {
  return render(
    <AppProvider>
      <AccountForm {...defaultProps} {...props} />
    </AppProvider>
  );
};

describe('AccountForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form when open', () => {
      renderWithProvider();

      expect(screen.getByText('Add Account')).toBeInTheDocument();
      expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/initial balance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderWithProvider({ isOpen: false });

      expect(screen.queryByText('Add Account')).not.toBeInTheDocument();
    });

    it('should show edit mode when account is provided', () => {
      renderWithProvider({ account: mockAccount });

      expect(screen.getByText('Edit Account')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Account')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty account name', async () => {
      renderWithProvider();

      const nameInput = screen.getByLabelText(/account name/i);
      const submitButton = screen.getByText('Create Account');

      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('should show error for invalid balance', async () => {
      renderWithProvider();

      const balanceInput = screen.getByLabelText(/initial balance/i);
      const submitButton = screen.getByText('Create Account');

      fireEvent.change(balanceInput, { target: { value: 'invalid' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid balance')).toBeInTheDocument();
      });
    });

    it('should validate savings account cannot have negative balance', async () => {
      renderWithProvider();

      // Select savings account type
      const savingsButton = screen.getByText('Savings Account');
      fireEvent.click(savingsButton);

      const balanceInput = screen.getByLabelText(/initial balance/i);
      fireEvent.change(balanceInput, { target: { value: '-100' } });

      await waitFor(() => {
        expect(screen.getByText('Savings accounts cannot have negative balance')).toBeInTheDocument();
      });
    });

    it('should validate credit card should have zero or negative balance', async () => {
      renderWithProvider();

      // Select credit card type
      const creditButton = screen.getByText('Credit Card');
      fireEvent.click(creditButton);

      const balanceInput = screen.getByLabelText(/initial balance/i);
      fireEvent.change(balanceInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.getByText('Credit card accounts should start with zero or negative balance')).toBeInTheDocument();
      });
    });
  });

  describe('Account Type Selection', () => {
    it('should allow selecting different account types', () => {
      renderWithProvider();

      const checkingButton = screen.getByText('Checking Account');
      const savingsButton = screen.getByText('Savings Account');
      const creditButton = screen.getByText('Credit Card');
      const investmentButton = screen.getByText('Investment Account');

      expect(checkingButton).toBeInTheDocument();
      expect(savingsButton).toBeInTheDocument();
      expect(creditButton).toBeInTheDocument();
      expect(investmentButton).toBeInTheDocument();

      // Test selecting savings
      fireEvent.click(savingsButton);
      expect(savingsButton).toHaveClass('bg-blue-50');
    });

    it('should show appropriate help text for each account type', () => {
      renderWithProvider();

      // Test credit card help text
      const creditButton = screen.getByText('Credit Card');
      fireEvent.click(creditButton);
      expect(screen.getByText(/credit cards should start with zero or negative balance/i)).toBeInTheDocument();

      // Test savings help text
      const savingsButton = screen.getByText('Savings Account');
      fireEvent.click(savingsButton);
      expect(screen.getByText(/savings accounts cannot have negative balance/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data for new account', async () => {
      const onSuccess = vi.fn();
      renderWithProvider({ onSuccess });

      // Fill form
      fireEvent.change(screen.getByLabelText(/account name/i), { 
        target: { value: 'New Account' } 
      });
      fireEvent.change(screen.getByLabelText(/initial balance/i), { 
        target: { value: '500' } 
      });

      // Submit form
      fireEvent.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should submit form with valid data for existing account', async () => {
      const onSuccess = vi.fn();
      renderWithProvider({ account: mockAccount, onSuccess });

      // Modify form
      fireEvent.change(screen.getByLabelText(/account name/i), { 
        target: { value: 'Updated Account' } 
      });

      // Submit form
      fireEvent.click(screen.getByText('Update Account'));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      renderWithProvider();

      // Fill form
      fireEvent.change(screen.getByLabelText(/account name/i), { 
        target: { value: 'New Account' } 
      });
      fireEvent.change(screen.getByLabelText(/initial balance/i), { 
        target: { value: '500' } 
      });

      // Submit form
      fireEvent.click(screen.getByText('Create Account'));

      // Should show loading state briefly
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  describe('Preview', () => {
    it('should show preview when name and balance are filled', () => {
      renderWithProvider();

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/account name/i), { 
        target: { value: 'Preview Account' } 
      });
      fireEvent.change(screen.getByLabelText(/initial balance/i), { 
        target: { value: '1500' } 
      });

      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Preview Account')).toBeInTheDocument();
      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    });

    it('should update preview when account type changes', () => {
      renderWithProvider();

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/account name/i), { 
        target: { value: 'Preview Account' } 
      });
      fireEvent.change(screen.getByLabelText(/initial balance/i), { 
        target: { value: '1500' } 
      });

      // Change to savings
      const savingsButton = screen.getByText('Savings Account');
      fireEvent.click(savingsButton);

      expect(screen.getByText('Savings Account')).toBeInTheDocument();
    });
  });

  describe('Character Limits', () => {
    it('should show character count for account name', () => {
      renderWithProvider();

      const nameInput = screen.getByLabelText(/account name/i);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      expect(screen.getByText('4/50')).toBeInTheDocument();
    });

    it('should prevent exceeding character limit', async () => {
      renderWithProvider();

      const nameInput = screen.getByLabelText(/account name/i);
      const longName = 'a'.repeat(51);
      
      fireEvent.change(nameInput, { target: { value: longName } });

      await waitFor(() => {
        expect(screen.getByText('Account name must be 50 characters or less')).toBeInTheDocument();
      });
    });
  });

  describe('Currency Selection', () => {
    it('should show all supported currencies', () => {
      renderWithProvider();

      const currencySelect = screen.getByLabelText(/currency/i);
      
      // Check that USD is selected by default
      expect(currencySelect).toHaveValue('USD');
      
      // Check that other currencies are available
      expect(screen.getByText(/USD - US Dollar/)).toBeInTheDocument();
      expect(screen.getByText(/EUR - Euro/)).toBeInTheDocument();
    });

    it('should update preview when currency changes', () => {
      renderWithProvider();

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/account name/i), { 
        target: { value: 'Preview Account' } 
      });
      fireEvent.change(screen.getByLabelText(/initial balance/i), { 
        target: { value: '1000' } 
      });

      // Change currency to EUR
      fireEvent.change(screen.getByLabelText(/currency/i), { 
        target: { value: 'EUR' } 
      });

      expect(screen.getByText('€1,000.00')).toBeInTheDocument();
    });
  });

  describe('Form Actions', () => {
    it('should call onClose when cancel button is clicked', () => {
      const onClose = vi.fn();
      renderWithProvider({ onClose });

      fireEvent.click(screen.getByText('Cancel'));

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when X button is clicked', () => {
      const onClose = vi.fn();
      renderWithProvider({ onClose });

      const closeButton = screen.getByRole('button', { name: '' }); // X button
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });
});