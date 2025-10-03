import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExpenseBreakdown } from './ExpenseBreakdown';
import { AppProvider } from '../../../shared/context/AppContext';

// Create a test wrapper that provides mock data
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}

describe('ExpenseBreakdown', () => {
  it('renders the component title', () => {
    render(
      <TestWrapper>
        <ExpenseBreakdown />
      </TestWrapper>
    );

    expect(screen.getByText('Expense Breakdown')).toBeInTheDocument();
  });

  it('displays empty state when no expenses exist', () => {
    render(
      <TestWrapper>
        <ExpenseBreakdown />
      </TestWrapper>
    );

    expect(screen.getByText('No expenses this month')).toBeInTheDocument();
    expect(screen.getByText('Your expense breakdown will appear here')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(
      <TestWrapper>
        <ExpenseBreakdown />
      </TestWrapper>
    );

    // Find the main container with the styling classes
    const container = document.querySelector('[class*="bg-white"][class*="rounded-lg"][class*="shadow-md"]');
    expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });

  it('displays pie chart icon in header', () => {
    render(
      <TestWrapper>
        <ExpenseBreakdown />
      </TestWrapper>
    );

    // Check that SVG icons are rendered
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('shows empty state when no expenses', () => {
    render(
      <TestWrapper>
        <ExpenseBreakdown />
      </TestWrapper>
    );

    // In empty state, these elements should not be present
    expect(screen.queryByText('This month')).not.toBeInTheDocument();
    expect(screen.queryByText('Total Expenses')).not.toBeInTheDocument();
  });

  it('displays empty state correctly', () => {
    render(
      <TestWrapper>
        <ExpenseBreakdown />
      </TestWrapper>
    );

    expect(screen.getByText('No expenses this month')).toBeInTheDocument();
    expect(screen.getByText('Your expense breakdown will appear here')).toBeInTheDocument();
  });
});