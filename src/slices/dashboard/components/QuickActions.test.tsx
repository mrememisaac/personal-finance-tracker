import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuickActions } from './QuickActions';

describe('QuickActions', () => {
  const mockHandlers = {
    onAddTransaction: vi.fn(),
    onAddBudget: vi.fn(),
    onAddGoal: vi.fn(),
    onViewReports: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component title', () => {
    render(<QuickActions {...mockHandlers} />);
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('renders all four action buttons', () => {
    render(<QuickActions {...mockHandlers} />);
    
    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    expect(screen.getByText('Create Budget')).toBeInTheDocument();
    expect(screen.getByText('Add Goal')).toBeInTheDocument();
    expect(screen.getByText('View Reports')).toBeInTheDocument();
  });

  it('displays button descriptions', () => {
    render(<QuickActions {...mockHandlers} />);
    
    expect(screen.getByText('Record income or expense')).toBeInTheDocument();
    expect(screen.getByText('Set spending limits')).toBeInTheDocument();
    expect(screen.getByText('Set financial targets')).toBeInTheDocument();
    expect(screen.getByText('Analyze your finances')).toBeInTheDocument();
  });

  it('calls onAddTransaction when Add Transaction button is clicked', () => {
    render(<QuickActions {...mockHandlers} />);
    
    const addTransactionButton = screen.getByText('Add Transaction').closest('button');
    fireEvent.click(addTransactionButton!);
    
    expect(mockHandlers.onAddTransaction).toHaveBeenCalledTimes(1);
  });

  it('calls onAddBudget when Create Budget button is clicked', () => {
    render(<QuickActions {...mockHandlers} />);
    
    const addBudgetButton = screen.getByText('Create Budget').closest('button');
    fireEvent.click(addBudgetButton!);
    
    expect(mockHandlers.onAddBudget).toHaveBeenCalledTimes(1);
  });

  it('calls onAddGoal when Add Goal button is clicked', () => {
    render(<QuickActions {...mockHandlers} />);
    
    const addGoalButton = screen.getByText('Add Goal').closest('button');
    fireEvent.click(addGoalButton!);
    
    expect(mockHandlers.onAddGoal).toHaveBeenCalledTimes(1);
  });

  it('calls onViewReports when View Reports button is clicked', () => {
    render(<QuickActions {...mockHandlers} />);
    
    const viewReportsButton = screen.getByText('View Reports').closest('button');
    fireEvent.click(viewReportsButton!);
    
    expect(mockHandlers.onViewReports).toHaveBeenCalledTimes(1);
  });

  it('toggles keyboard shortcuts display', () => {
    render(<QuickActions {...mockHandlers} />);
    
    // Initially shortcuts should not be visible
    expect(screen.queryByText('Keyboard Shortcuts:')).not.toBeInTheDocument();
    
    // Click the keyboard icon to show shortcuts
    const keyboardButton = screen.getByTitle('Toggle keyboard shortcuts');
    fireEvent.click(keyboardButton);
    
    // Now shortcuts should be visible
    expect(screen.getByText('Keyboard Shortcuts:')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+T: Add Transaction')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+B: Add Budget')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+G: Add Goal')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+R: View Reports')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<QuickActions {...mockHandlers} />);
    
    const container = document.querySelector('[class*="bg-white"][class*="rounded-lg"][class*="shadow-md"]');
    expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });

  it('displays keyboard shortcuts on buttons', () => {
    render(<QuickActions {...mockHandlers} />);
    
    expect(screen.getByText('Ctrl+T')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+B')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+G')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+R')).toBeInTheDocument();
  });

  it('uses responsive grid layout', () => {
    render(<QuickActions {...mockHandlers} />);
    
    const gridContainer = document.querySelector('[class*="grid-cols-1"][class*="sm:grid-cols-2"]');
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2');
  });

  it('handles keyboard shortcuts', () => {
    render(<QuickActions {...mockHandlers} />);
    
    // Test Ctrl+T for Add Transaction
    fireEvent.keyDown(document, { key: 't', ctrlKey: true });
    expect(mockHandlers.onAddTransaction).toHaveBeenCalledTimes(1);
    
    // Test Ctrl+B for Add Budget
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
    expect(mockHandlers.onAddBudget).toHaveBeenCalledTimes(1);
    
    // Test Ctrl+G for Add Goal
    fireEvent.keyDown(document, { key: 'g', ctrlKey: true });
    expect(mockHandlers.onAddGoal).toHaveBeenCalledTimes(1);
    
    // Test Ctrl+R for View Reports
    fireEvent.keyDown(document, { key: 'r', ctrlKey: true });
    expect(mockHandlers.onViewReports).toHaveBeenCalledTimes(1);
  });

  it('works without handlers provided', () => {
    // Should not throw errors when handlers are not provided
    expect(() => {
      render(<QuickActions />);
    }).not.toThrow();
    
    // Clicking buttons should not cause errors
    const addTransactionButton = screen.getByText('Add Transaction').closest('button');
    expect(() => {
      fireEvent.click(addTransactionButton!);
    }).not.toThrow();
  });
});