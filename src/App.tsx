import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { AuthProvider, ProtectedRoute, UserMenu } from './slices/auth';
import { AppProvider } from './shared/context/AppContext';
import { ErrorBoundary } from './app/ErrorBoundary';
import { Navigation } from './app/Navigation';
import type { TabId } from './app/Navigation';
import { ServiceProvider } from './app/ServiceIntegration';

// Import all slice components
import {
  SummaryCards,
  RecentTransactions,
  ExpenseBreakdown,
  QuickActions
} from './slices/dashboard';
import { AccountListContainer, AccountFormContainer } from './slices/accounts/components';
import { BudgetOverviewContainer, BudgetFormContainer, BudgetAlertsContainer } from './slices/budget/components';
import { ChartsSection, ReportsDashboard } from './slices/reports/components';
import { TestDashboard } from './slices/testing/components/TestDashboard';

function MainApp() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Financial Dashboard
              </h2>
              <p className="text-gray-600">
                Overview of your financial health and recent activity
              </p>
            </div>
            <SummaryCards />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentTransactions />
              <ExpenseBreakdown />
            </div>
            <QuickActions
              onAddTransaction={() => setActiveTab('transactions')}
              onAddBudget={() => setActiveTab('budgets')}
              onAddGoal={() => setActiveTab('goals')}
              onViewReports={() => setActiveTab('reports')}
            />
          </div>
        );

      case 'accounts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Accounts
                </h2>
                <p className="text-gray-600">
                  Manage your financial accounts and track balances
                </p>
              </div>
              <AccountFormContainer />
            </div>
            <AccountListContainer />
          </div>
        );

      case 'transactions':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Transactions
                </h2>
                <p className="text-gray-600">
                  Track your income and expenses
                </p>
              </div>
              {/* TransactionForm needs isOpen/onClose props */}
              <TransactionFormContainer />
            </div>
            {/* TransactionList component will be handled by container */}
            <TransactionListContainer />
          </div>
        );

      case 'budgets':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Budgets
                </h2>
                <p className="text-gray-600">
                  Set spending limits and track your progress
                </p>
              </div>
              <BudgetFormContainer />
            </div>
            <BudgetAlertsContainer />
            <BudgetOverviewContainer />
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Financial Goals
                </h2>
                <p className="text-gray-600">
                  Set and track your financial objectives
                </p>
              </div>
              {/* GoalForm needs isOpen, onClose, onSubmit, accounts props */}
            </div>
            {/* GoalProgress needs goals and goalProgress props */}
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Reports & Analytics
              </h2>
              <p className="text-gray-600">
                Analyze your financial patterns and trends
              </p>
            </div>
            <ReportsDashboard />
            <ChartsSection />
          </div>
        );

      case 'testing':
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                System Testing
              </h2>
              <p className="text-gray-600">
                Verify the accuracy of calculations and functionality
              </p>
            </div>
            <TestDashboard />
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Page Not Found
            </h2>
            <p className="text-gray-600">
              The requested page could not be found.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">
                Personal Finance Tracker
              </h1>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          {renderTabContent()}
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ServiceProvider>
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          </ServiceProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App