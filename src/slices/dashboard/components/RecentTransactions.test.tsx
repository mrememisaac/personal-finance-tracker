import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RecentTransactions } from './RecentTransactions';
import { AppProvider } from '../../../shared/context/AppContext';

// Create a test wrapper that provides mock data
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}

describe('RecentTransactions', () => {
  it('renders the component title', () => {
    render(
      <TestWrapper>
        <RecentTransactions />
      </TestWrapper>
    );

    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
  });

  it('displays empty state when no transactions exist', () => {
    render(
      <TestWrapper>
        <RecentTransactions />
      </TestWrapper>
    );

    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    expect(screen.getByText('Your recent transactions will appear here')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(
      <TestWrapper>
        <RecentTransactions />
      </TestWrapper>
    );

    // Find the main container with the styling classes
    const container = document.querySelector('[class*="bg-white"][class*="rounded-lg"][class*="shadow-md"]');
    expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });

  it('displays clock icon in header', () => {
    render(
      <TestWrapper>
        <RecentTransactions />
      </TestWrapper>
    );

    // Check that SVG icons are rendered
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('shows empty state icon when no transactions', () => {
    render(
      <TestWrapper>
        <RecentTransactions />
      </TestWrapper>
    );

    // Should have multiple clock icons (header + empty state)
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThanOrEqual(2);
  });
});