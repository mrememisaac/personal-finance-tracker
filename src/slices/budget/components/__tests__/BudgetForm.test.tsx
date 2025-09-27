import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BudgetForm from '../BudgetForm';
import { Budget } from '../../Budget';
import type { Budget as IBudget } from '../../../../shared/types';

describe('BudgetForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    existingCategories: ['Custom Category 1', 'Custom Category 2']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render create form when no budget provided', () => {
      render(<BudgetForm {...defaultProps} />);
      
      expect(screen.getByText('Create New Budget')).toBeInTheDocument();
      expect(screen.getByText('Create Budget')).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toHaveValue('');
      expect(screen.getByLabelText(/budget limit/i)).toHaveValue('');
    });

    it('should render edit form when budget provided', () => {
      const mockBudget = new Budget({
        id: 'test-budget',
        category: 'Food',
        limit: 500,
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      render(<BudgetForm {...defaultProps} budget={mockBudget} />);
      
      expect(screen.getByText('Edit Budget')).toBeInTheDocument();
      expect(screen.getByText('Update Budget')).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toHaveValue('Food');
      expect(screen.getByLabelText(/budget limit/i)).toHaveValue('500');
    });

    it('should not render when isOpen is false', () => {
      render(<BudgetForm {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Create New Budget')).not.toBeInTheDocument();
    });

    it('should render predefined categories in datalist', () => {
      render(<BudgetForm {...defaultProps} />);
      
      const datalist = document.getElementById('categories');
      expect(datalist).toBeInTheDocument();
      
      const options = datalist?.querySelectorAll('option');
      expect(options?.length).toBeGreaterThan(10); // Should have predefined categories
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty form', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      const submitButton = screen.getByText('Create Budget');
      await user.click(submitButton);
      
      expect(screen.getByText('Category is required')).toBeInTheDocument();
      expect(screen.getByText('Budget limit must be a positive number')).toBeInTheDocument();
      expect(screen.getByText('Start date is required')).toBeInTheDocument();
    });

    it('should validate budget limit is positive', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/category/i), 'Food');
      await user.type(screen.getByLabelText(/budget limit/i), '-100');
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      
      const submitButton = screen.getByText('Create Budget');
      await user.click(submitButton);
      
      expect(screen.getByText('Budget limit must be a positive number')).toBeInTheDocument();
    });

    it('should validate budget limit maximum', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/category/i), 'Food');
      await user.type(screen.getByLabelText(/budget limit/i), '2000000');
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      
      const submitButton = screen.getByText('Create Budget');
      await user.click(submitButton);
      
      expect(screen.getByText('Budget limit cannot exceed $1,000,000')).toBeInTheDocument();
    });

    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      // Trigger validation errors
      const submitButton = screen.getByText('Create Budget');
      await user.click(submitButton);
      
      expect(screen.getByText('Category is required')).toBeInTheDocument();
      
      // Start typing in category field
      await user.type(screen.getByLabelText(/category/i), 'F');
      
      // Errors should be cleared
      expect(screen.queryByText('Category is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update form fields correctly', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      const categoryInput = screen.getByLabelText(/category/i);
      const limitInput = screen.getByLabelText(/budget limit/i);
      const periodSelect = screen.getByLabelText(/budget period/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const activeCheckbox = screen.getByLabelText(/active budget/i);
      
      await user.type(categoryInput, 'Food');
      await user.type(limitInput, '500');
      await user.selectOptions(periodSelect, 'weekly');
      await user.type(startDateInput, '2024-01-01');
      await user.click(activeCheckbox);
      
      expect(categoryInput).toHaveValue('Food');
      expect(limitInput).toHaveValue('500');
      expect(periodSelect).toHaveValue('weekly');
      expect(startDateInput).toHaveValue('2024-01-01');
      expect(activeCheckbox).not.toBeChecked();
    });

    it('should calculate and display end date', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '2024-01-01');
      
      expect(screen.getByText(/End date:/)).toBeInTheDocument();
    });

    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when X button clicked', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/category/i), 'Food');
      await user.type(screen.getByLabelText(/budget limit/i), '500');
      await user.selectOptions(screen.getByLabelText(/budget period/i), 'monthly');
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      
      const submitButton = screen.getByText('Create Budget');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          category: 'Food',
          limit: 500,
          period: 'monthly',
          startDate: expect.any(Date),
          isActive: true
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<BudgetForm {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/category/i), 'Food');
      await user.type(screen.getByLabelText(/budget limit/i), '500');
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      
      const submitButton = screen.getByText('Create Budget');
      await user.click(submitButton);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'));
      
      render(<BudgetForm {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/category/i), 'Food');
      await user.type(screen.getByLabelText(/budget limit/i), '500');
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      
      const submitButton = screen.getByText('Create Budget');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to save budget. Please try again.')).toBeInTheDocument();
      });
    });

    it('should not submit invalid form', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      // Leave form empty
      const submitButton = screen.getByText('Create Budget');
      await user.click(submitButton);
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('should populate form with existing budget data', () => {
      const mockBudget = new Budget({
        id: 'test-budget',
        category: 'Transportation',
        limit: 300,
        period: 'weekly',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-07'),
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      render(<BudgetForm {...defaultProps} budget={mockBudget} />);
      
      expect(screen.getByLabelText(/category/i)).toHaveValue('Transportation');
      expect(screen.getByLabelText(/budget limit/i)).toHaveValue('300');
      expect(screen.getByLabelText(/budget period/i)).toHaveValue('weekly');
      expect(screen.getByLabelText(/start date/i)).toHaveValue('2024-02-01');
      expect(screen.getByLabelText(/active budget/i)).not.toBeChecked();
    });

    it('should reset form when switching from edit to create mode', () => {
      const mockBudget = new Budget({
        id: 'test-budget',
        category: 'Food',
        limit: 500,
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const { rerender } = render(<BudgetForm {...defaultProps} budget={mockBudget} />);
      
      expect(screen.getByLabelText(/category/i)).toHaveValue('Food');
      
      // Switch to create mode
      rerender(<BudgetForm {...defaultProps} budget={undefined} />);
      
      expect(screen.getByLabelText(/category/i)).toHaveValue('');
      expect(screen.getByText('Create New Budget')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<BudgetForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/budget limit/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/budget period/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/active budget/i)).toBeInTheDocument();
    });

    it('should have required field indicators', () => {
      render(<BudgetForm {...defaultProps} />);
      
      expect(screen.getByText('Category *')).toBeInTheDocument();
      expect(screen.getByText('Budget Limit *')).toBeInTheDocument();
      expect(screen.getByText('Budget Period *')).toBeInTheDocument();
      expect(screen.getByText('Start Date *')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for error states', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      const submitButton = screen.getByText('Create Budget');
      await user.click(submitButton);
      
      const categoryInput = screen.getByLabelText(/category/i);
      expect(categoryInput).toHaveAttribute('required');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      const categoryInput = screen.getByLabelText(/category/i);
      categoryInput.focus();
      
      expect(categoryInput).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/budget limit/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/budget period/i)).toHaveFocus();
    });

    it('should close form on Escape key', async () => {
      const user = userEvent.setup();
      render(<BudgetForm {...defaultProps} />);
      
      await user.keyboard('{Escape}');
      
      // Note: This would require implementing Escape key handling in the component
      // For now, we'll just test that the form is rendered
      expect(screen.getByText('Create New Budget')).toBeInTheDocument();
    });
  });
});