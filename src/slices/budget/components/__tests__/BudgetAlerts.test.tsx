import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BudgetAlerts from '../BudgetAlerts';
import type { BudgetAlert } from '../../../../shared/types';

describe('BudgetAlerts', () => {
    const mockOnDismiss = vi.fn();
    const mockOnDismissAll = vi.fn();
    const mockOnToggleNotifications = vi.fn();

    const mockAlerts: BudgetAlert[] = [
        {
            budgetId: 'budget1',
            category: 'Food',
            message: 'You have exceeded your Food budget by $50.00',
            severity: 'danger'
        },
        {
            budgetId: 'budget2',
            category: 'Transportation',
            message: 'You have used 85.0% of your Transportation budget',
            severity: 'warning'
        },
        {
            budgetId: 'budget3',
            category: 'Entertainment',
            message: 'You have used 90.0% of your Entertainment budget',
            severity: 'warning'
        }
    ];

    const defaultProps = {
        alerts: mockAlerts,
        onDismiss: mockOnDismiss,
        onDismissAll: mockOnDismissAll,
        onToggleNotifications: mockOnToggleNotifications,
        showNotifications: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render alerts correctly', () => {
            render(<BudgetAlerts {...defaultProps} />);

            expect(screen.getByText('Budget Alerts (3)')).toBeInTheDocument();
            expect(screen.getByText('Food Budget Alert')).toBeInTheDocument();
            expect(screen.getByText('Transportation Budget Alert')).toBeInTheDocument();
            expect(screen.getByText('Entertainment Budget Alert')).toBeInTheDocument();
        });

        it('should not render when no alerts provided', () => {
            render(<BudgetAlerts {...defaultProps} alerts={[]} />);

            expect(screen.queryByText('Budget Alerts')).not.toBeInTheDocument();
        });

        it('should show critical alert count', () => {
            render(<BudgetAlerts {...defaultProps} />);

            expect(screen.getByText('1 Critical')).toBeInTheDocument();
        });

        it('should render alerts with correct severity styling', () => {
            render(<BudgetAlerts {...defaultProps} />);

            const dangerAlert = screen.getByText('Food Budget Alert').closest('div');
            const warningAlert = screen.getByText('Transportation Budget Alert').closest('div');

            expect(dangerAlert).toHaveClass('bg-red-50', 'border-red-200');
            expect(warningAlert).toHaveClass('bg-yellow-50', 'border-yellow-200');
        });

        it('should show correct severity badges', () => {
            render(<BudgetAlerts {...defaultProps} />);

            expect(screen.getByText('Over Budget')).toBeInTheDocument();
            expect(screen.getAllByText('Warning')).toHaveLength(2);
        });
    });

    describe('Alert Dismissal', () => {
        it('should dismiss individual alert', async () => {
            const user = userEvent.setup();
            render(<BudgetAlerts {...defaultProps} />);

            const dismissButtons = screen.getAllByTitle('Dismiss alert');
            await user.click(dismissButtons[0]);

            await waitFor(() => {
                expect(mockOnDismiss).toHaveBeenCalledWith('budget1');
            });
        });

        it('should dismiss all alerts', async () => {
            const user = userEvent.setup();
            render(<BudgetAlerts {...defaultProps} />);

            const dismissAllButton = screen.getByText('Dismiss All');
            await user.click(dismissAllButton);

            expect(mockOnDismissAll).toHaveBeenCalledTimes(1);
        });

        it('should hide dismissed alerts from view', async () => {
            const user = userEvent.setup();
            render(<BudgetAlerts {...defaultProps} />);

            expect(screen.getByText('Food Budget Alert')).toBeInTheDocument();

            const dismissButtons = screen.getAllByTitle('Dismiss alert');
            await user.click(dismissButtons[0]);

            await waitFor(() => {
                expect(screen.queryByText('Food Budget Alert')).not.toBeInTheDocument();
            });
        });

        it('should not show dismiss all button when only one alert', () => {
            const singleAlert = [mockAlerts[0]];
            render(<BudgetAlerts {...defaultProps} alerts={singleAlert} />);

            expect(screen.queryByText('Dismiss All')).not.toBeInTheDocument();
        });

        it('should work without dismiss handlers', () => {
            render(<BudgetAlerts alerts={mockAlerts} />);

            expect(screen.getByText('Budget Alerts (3)')).toBeInTheDocument();
            expect(screen.queryByTitle('Dismiss alert')).not.toBeInTheDocument();
            expect(screen.queryByText('Dismiss All')).not.toBeInTheDocument();
        });
    });

    describe('Collapse/Expand Functionality', () => {
        it('should collapse and expand alerts', async () => {
            const user = userEvent.setup();
            render(<BudgetAlerts {...defaultProps} />);

            expect(screen.getByText('Food Budget Alert')).toBeInTheDocument();

            const hideButton = screen.getByText('Hide');
            await user.click(hideButton);

            expect(screen.queryByText('Food Budget Alert')).not.toBeInTheDocument();
            expect(screen.getByText('1 critical, 2 warnings')).toBeInTheDocument();
            expect(screen.getByText('Show')).toBeInTheDocument();

            const showButton = screen.getByText('Show');
            await user.click(showButton);

            expect(screen.getByText('Food Budget Alert')).toBeInTheDocument();
        });

        it('should show view details button when collapsed', async () => {
            const user = userEvent.setup();
            render(<BudgetAlerts {...defaultProps} />);

            const hideButton = screen.getByText('Hide');
            await user.click(hideButton);

            const viewDetailsButton = screen.getByText('View Details');
            await user.click(viewDetailsButton);

            expect(screen.getByText('Food Budget Alert')).toBeInTheDocument();
        });
    });

    describe('Notification Toggle', () => {
        it('should toggle notifications on and off', async () => {
            const user = userEvent.setup();
            render(<BudgetAlerts {...defaultProps} />);

            const notificationButton = screen.getByTitle('Disable notifications');
            await user.click(notificationButton);

            expect(mockOnToggleNotifications).toHaveBeenCalledWith(false);
        });

        it('should show disabled notification state', () => {
            render(<BudgetAlerts {...defaultProps} showNotifications={false} />);

            expect(screen.getByText('Budget notifications are disabled')).toBeInTheDocument();
            expect(screen.getByTitle('Enable notifications')).toBeInTheDocument();
        });

        it('should enable notifications from disabled state', async () => {
            const user = userEvent.setup();
            render(<BudgetAlerts {...defaultProps} showNotifications={false} />);

            const enableButton = screen.getByText('Enable');
            await user.click(enableButton);

            expect(mockOnToggleNotifications).toHaveBeenCalledWith(true);
        });

        it('should not show notification toggle when handler not provided', () => {
            const { onToggleNotifications, ...propsWithoutToggle } = defaultProps;
            render(<BudgetAlerts {...propsWithoutToggle} />);

            expect(screen.queryByTitle('Disable notifications')).not.toBeInTheDocument();
        });
    });

    describe('Alert Ordering', () => {
        it('should show danger alerts before warning alerts', () => {
            render(<BudgetAlerts {...defaultProps} />);

            const alerts = screen.getAllByText(/Budget Alert/);
            expect(alerts[0]).toHaveTextContent('Food Budget Alert'); // danger
            expect(alerts[1]).toHaveTextContent('Transportation Budget Alert'); // warning
            expect(alerts[2]).toHaveTextContent('Entertainment Budget Alert'); // warning
        });
    });

    describe('Alert Content', () => {
        it('should display alert messages correctly', () => {
            render(<BudgetAlerts {...defaultProps} />);

            expect(screen.getByText('You have exceeded your Food budget by $50.00')).toBeInTheDocument();
            expect(screen.getByText('You have used 85.0% of your Transportation budget')).toBeInTheDocument();
            expect(screen.getByText('You have used 90.0% of your Entertainment budget')).toBeInTheDocument();
        });

        it('should show correct icons for different severities', () => {
            render(<BudgetAlerts {...defaultProps} />);

            // Check that icons are rendered (they should be SVG elements)
            const svgElements = document.querySelectorAll('svg');
            expect(svgElements.length).toBeGreaterThan(0);
        });
    });

    describe('Animation and Transitions', () => {
        it('should apply transition classes', () => {
            render(<BudgetAlerts {...defaultProps} />);

            const alertElements = screen.getAllByText(/Budget Alert/).map(el => el.closest('div'));
            alertElements.forEach(element => {
                expect(element).toHaveClass('transition-all', 'duration-300');
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', () => {
            render(<BudgetAlerts {...defaultProps} />);

            expect(screen.getByRole('heading', { level: 3, name: /Budget Alerts/ })).toBeInTheDocument();
        });

        it('should have accessible button labels', () => {
            render(<BudgetAlerts {...defaultProps} />);

            expect(screen.getByTitle('Dismiss alert')).toBeInTheDocument();
            expect(screen.getByTitle('Disable notifications')).toBeInTheDocument();
        });

        it('should support keyboard navigation', async () => {
            const user = userEvent.setup();
            render(<BudgetAlerts {...defaultProps} />);

            const dismissButton = screen.getAllByTitle('Dismiss alert')[0];
            dismissButton.focus();

            expect(dismissButton).toHaveFocus();

            await user.keyboard('{Enter}');

            await waitFor(() => {
                expect(mockOnDismiss).toHaveBeenCalledWith('budget1');
            });
        });
    });

    describe('Custom Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(<BudgetAlerts {...defaultProps} className="custom-class" />);

            expect(container.firstChild).toHaveClass('custom-class');
        });
    });

    describe('Edge Cases', () => {
        it('should handle alerts with missing properties gracefully', () => {
            const incompleteAlerts: BudgetAlert[] = [
                {
                    budgetId: 'budget1',
                    category: 'Food',
                    message: 'Alert message',
                    severity: 'warning'
                }
            ];

            render(<BudgetAlerts alerts={incompleteAlerts} />);

            expect(screen.getByText('Food Budget Alert')).toBeInTheDocument();
        });

        it('should reset dismissed alerts when alerts prop changes', () => {
            const { rerender } = render(<BudgetAlerts {...defaultProps} />);

            expect(screen.getByText('Budget Alerts (3)')).toBeInTheDocument();

            const newAlerts = [...mockAlerts, {
                budgetId: 'budget4',
                category: 'Shopping',
                message: 'New alert',
                severity: 'warning' as const
            }];

            rerender(<BudgetAlerts {...defaultProps} alerts={newAlerts} />);

            expect(screen.getByText('Budget Alerts (4)')).toBeInTheDocument();
        });

        it('should handle empty severity gracefully', () => {
            const alertsWithoutSeverity = [{
                budgetId: 'budget1',
                category: 'Food',
                message: 'Alert message',
                severity: undefined as any
            }];

            render(<BudgetAlerts alerts={alertsWithoutSeverity} />);

            // Should still render with default warning styling
            expect(screen.getByText('Food Budget Alert')).toBeInTheDocument();
        });
    });
});