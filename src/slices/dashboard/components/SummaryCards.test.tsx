import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryCards } from './SummaryCards';
import { AppProvider } from '../../../shared/context/AppContext';

// Create a test wrapper that provides mock data
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}

describe('SummaryCards', () => {
  it('renders all three summary cards', () => {
    render(
      <TestWrapper>
        <SummaryCards />
      </TestWrapper>
    );

    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Balance')).toBeInTheDocument();
  });

  it('displays currency formatted amounts', () => {
    render(
      <TestWrapper>
        <SummaryCards />
      </TestWrapper>
    );

    // Should display currency formatted amounts (even if $0.00 with no data)
    const currencyElements = screen.getAllByText(/\$\d+\.\d{2}/);
    expect(currencyElements.length).toBeGreaterThanOrEqual(3);
  });

  it('applies correct CSS classes for styling', () => {
    render(
      <TestWrapper>
        <SummaryCards />
      </TestWrapper>
    );

    // Find the card container by looking for the parent of the title
    const incomeTitle = screen.getByText('Total Income');
    const cardContainer = incomeTitle.closest('[class*="bg-white"]');
    expect(cardContainer).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });

  it('includes hover effects in card styling', () => {
    render(
      <TestWrapper>
        <SummaryCards />
      </TestWrapper>
    );

    // Find all card containers
    const incomeTitle = screen.getByText('Total Income');
    const cardContainer = incomeTitle.closest('[class*="hover:shadow-lg"]');
    expect(cardContainer).toHaveClass('hover:shadow-lg', 'hover:scale-105');
  });

  it('displays appropriate icons for each card', () => {
    render(
      <TestWrapper>
        <SummaryCards />
      </TestWrapper>
    );

    // Check that SVG icons are rendered - look for all SVG elements
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('uses responsive grid layout', () => {
    render(
      <TestWrapper>
        <SummaryCards />
      </TestWrapper>
    );

    // Find the grid container by looking for the grid classes
    const gridContainer = document.querySelector('[class*="grid-cols-1"]');
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3');
  });
});