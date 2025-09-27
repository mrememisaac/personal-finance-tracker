import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GoalForm from '../GoalForm';
import { Goal } from '../../Goal';
import type { Account } from '../../../../shared/types';

describe('GoalForm', () => {
  const mockAccounts: Account[] = [
    {
      id: 'account-1',
      name: 'Savings Account',
      type: 'savings',
      balance: 5000,
      currency: 'USD',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'account-2',
      name: 'Investment Account',
      type: 'investment',
      balance: 10000,
      currency: 'USD',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    accounts: mockAccounts
  };

  describe('Create Mode', () => {
    it('should render create form when no goal is provided', () => {
      render(<GoalForm {...defaultProps} />);

      expect(screen.getByText('Create New Goal')).toBeInTheDocument();
      expect(screen.getByLabelText(/goal name/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/target amount/i)).toHaveValue(null);
      expect(screen.getByLabelText(/current amount/i)).toHaveValue(0);
      expect(screen.getByText('Create Goal')).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      render(<GoalForm {...defaultProps} />);

      const form = document.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Goal name is required')).toBeInTheDocument();
        expect(screen.getByText('Target amount must be a positive number')).toBeInTheDocument();
        expect(screen.getByText('Account selection is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate goal name length', async () => {
      render(<GoalForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/goal name/i);
      fireEvent.change(nameInput, { target: { value: 'a'.repeat(101) } });

      const form = document.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Goal name must be 100 characters or less')).toBeInTheDocument();
      });
    });

    it('should validate description length', async () => {
      render(<GoalForm {...defaultProps} />);

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'a'.repeat(501) } });

      const form = document.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Goal description must be 500 characters or less')).toBeInTheDocument();
      });
    });

    it('should validate target amount', async () => {
      render(<GoalForm {...defaultProps} />);

      const targetAmountInput = screen.getByLabelText(/target amount/i);
      
      // Test negative amount
      fireEvent.change(targetAmountInput, { target: { value: '-100' } });
      const form = document.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Target amount must be a positive number')).toBeInTheDocument();
      });

      // Test amount too large
      fireEvent.change(targetAmountInput, { target: { value: '20000000' } });
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Target amount cannot exceed $10,000,000')).toBeInTheDocument();
      });
    });

    it('should validate current amount', async () => {
      render(<GoalForm {...defaultProps} />);

      const currentAmountInput = screen.getByLabelText(/current amount/i);
      
      // Test negative amount
      fireEvent.change(currentAmountInput, { target: { value: '-100' } });
      const form = document.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Current amount must be zero or greater')).toBeInTheDocument();
      });
    });

    it('should validate current amount vs target amount', async () => {
      render(<GoalForm {...defaultProps} />);

      const targetAmountInput = screen.getByLabelText(/target amount/i);
      const currentAmountInput = screen.getByLabelText(/current amount/i);
      
      fireEvent.change(targetAmountInput, { target: { value: '1000' } });
      fireEvent.change(currentAmountInput, { target: { value: '1200' } }); // 20% over target

      const form = document.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Current amount should not exceed target amount by more than 10%')).toBeInTheDocument();
      });
    });

    it('should validate target date', async () => {
      render(<GoalForm {...defaultProps} />);

      const targetDateInput = screen.getByLabelText(/target date/i);
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      
      fireEvent.change(targetDateInput, { target: { value: pastDate.toISOString().split('T')[0] } });
      const form = document.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Target date should be in the future for new goals')).toBeInTheDocument();
      });
    });

    it('should submit valid form data', async () => {
      render(<GoalForm {...defaultProps} />);

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // Fill in valid form data
      fireEvent.change(screen.getByLabelText(/goal name/i), { target: { value: 'Emergency Fund' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Build emergency fund' } });
      fireEvent.change(screen.getByLabelText(/target amount/i), { target: { value: '10000' } });
      fireEvent.change(screen.getByLabelText(/current amount/i), { target: { value: '2000' } });
      fireEvent.change(screen.getByLabelText(/target date/i), { target: { value: futureDate.toISOString().split('T')[0] } });
      fireEvent.change(screen.getByLabelText(/associated account/i), { target: { value: 'account-1' } });

      fireEvent.click(screen.getByText('Create Goal'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Emergency Fund',
          description: 'Build emergency fund',
          targetAmount: 10000,
          currentAmount: 2000,
          targetDate: expect.any(Date),
          accountId: 'account-1'
        });
      });
    });

    it('should show progress preview when amounts are entered', () => {
      render(<GoalForm {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/target amount/i), { target: { value: '1000' } });
      fireEvent.change(screen.getByLabelText(/current amount/i), { target: { value: '250' } });

      expect(screen.getByText('Progress Preview')).toBeInTheDocument();
      expect(screen.getByText('25.0%')).toBeInTheDocument();
      expect(screen.getByText('$250 of $1,000')).toBeInTheDocument();
    });

    it('should show days remaining when target date is set', () => {
      render(<GoalForm {...defaultProps} />);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      fireEvent.change(screen.getByLabelText(/target date/i), { target: { value: futureDate.toISOString().split('T')[0] } });

      expect(screen.getByText(/30 days remaining/)).toBeInTheDocument();
    });

    it('should show account balance when account is selected', () => {
      render(<GoalForm {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/associated account/i), { target: { value: 'account-1' } });

      expect(screen.getByText('Current balance: $5,000.00')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const mockGoal = new Goal({
      id: 'goal-1',
      name: 'Vacation Fund',
      description: 'Save for vacation',
      targetAmount: 5000,
      currentAmount: 2000,
      targetDate: new Date('2025-06-01'),
      accountId: 'account-2',
      isCompleted: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    });

    it('should render edit form with existing goal data', () => {
      render(<GoalForm {...defaultProps} goal={mockGoal} />);

      expect(screen.getByText('Edit Goal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Vacation Fund')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Save for vacation')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-06-01')).toBeInTheDocument();
      const selectElement = screen.getByLabelText(/associated account/i) as HTMLSelectElement;
      expect(selectElement.value).toBe('account-2');
      expect(screen.getByText('Update Goal')).toBeInTheDocument();
    });

    it('should submit updated goal data', async () => {
      render(<GoalForm {...defaultProps} goal={mockGoal} />);

      // Update the goal name
      const nameInput = screen.getByDisplayValue('Vacation Fund');
      fireEvent.change(nameInput, { target: { value: 'Updated Vacation Fund' } });

      fireEvent.click(screen.getByText('Update Goal'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Updated Vacation Fund',
          description: 'Save for vacation',
          targetAmount: 5000,
          currentAmount: 2000,
          targetDate: expect.any(Date),
          accountId: 'account-2'
        });
      });
    });
  });

  describe('Form Interactions', () => {
    it('should clear errors when user starts typing', async () => {
      render(<GoalForm {...defaultProps} />);

      // Trigger validation errors
      const form = document.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Goal name is required')).toBeInTheDocument();
      });

      // Start typing in name field
      fireEvent.change(screen.getByLabelText(/goal name/i), { target: { value: 'Test' } });

      // Errors should be cleared
      expect(screen.queryByText('Goal name is required')).not.toBeInTheDocument();
    });

    it('should call onClose when cancel button is clicked', () => {
      render(<GoalForm {...defaultProps} />);

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when X button is clicked', () => {
      render(<GoalForm {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not render when isOpen is false', () => {
      render(<GoalForm {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Create New Goal')).not.toBeInTheDocument();
    });

    it('should disable form during submission', async () => {
      const slowOnSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<GoalForm {...defaultProps} onSubmit={slowOnSubmit} />);

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // Fill in valid form data
      fireEvent.change(screen.getByLabelText(/goal name/i), { target: { value: 'Test Goal' } });
      fireEvent.change(screen.getByLabelText(/target amount/i), { target: { value: '1000' } });
      fireEvent.change(screen.getByLabelText(/target date/i), { target: { value: futureDate.toISOString().split('T')[0] } });
      fireEvent.change(screen.getByLabelText(/associated account/i), { target: { value: 'account-1' } });

      fireEvent.click(screen.getByText('Create Goal'));

      // Form should be disabled during submission
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByLabelText(/goal name/i)).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });

    it('should show character count for name and description', () => {
      render(<GoalForm {...defaultProps} />);

      expect(screen.getByText('0/100 characters')).toBeInTheDocument();
      expect(screen.getByText('0/500 characters')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/goal name/i), { target: { value: 'Test Goal' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test description' } });

      expect(screen.getByText('9/100 characters')).toBeInTheDocument();
      expect(screen.getByText('16/500 characters')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty accounts array', () => {
      render(<GoalForm {...defaultProps} accounts={[]} />);

      const accountSelect = screen.getByLabelText(/associated account/i);
      expect(accountSelect).toHaveValue('');
      expect(screen.getByText('Select an account')).toBeInTheDocument();
    });

    it('should handle form submission error', async () => {
      const errorOnSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      const localMockOnClose = vi.fn();
      
      render(<GoalForm {...defaultProps} onSubmit={errorOnSubmit} onClose={localMockOnClose} />);

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // Fill in valid form data
      fireEvent.change(screen.getByLabelText(/goal name/i), { target: { value: 'Test Goal' } });
      fireEvent.change(screen.getByLabelText(/target amount/i), { target: { value: '1000' } });
      fireEvent.change(screen.getByLabelText(/target date/i), { target: { value: futureDate.toISOString().split('T')[0] } });
      fireEvent.change(screen.getByLabelText(/associated account/i), { target: { value: 'account-1' } });

      const form = document.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Failed to save goal. Please try again.')).toBeInTheDocument();
      });

      expect(localMockOnClose).not.toHaveBeenCalled();
    });
  });
});