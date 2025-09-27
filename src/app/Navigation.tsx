import React from 'react';
import { 
  Home, 
  Wallet, 
  TrendingUp, 
  PieChart, 
  Target, 
  BarChart3,
  TestTube
} from 'lucide-react';

export type TabId = 'dashboard' | 'accounts' | 'transactions' | 'budgets' | 'goals' | 'reports' | 'testing';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

interface NavTab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const tabs: NavTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Overview of your finances'
  },
  {
    id: 'accounts',
    label: 'Accounts',
    icon: Wallet,
    description: 'Manage your financial accounts'
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: TrendingUp,
    description: 'Track income and expenses'
  },
  {
    id: 'budgets',
    label: 'Budgets',
    icon: PieChart,
    description: 'Set and monitor spending limits'
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: Target,
    description: 'Track financial objectives'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    description: 'Analytics and insights'
  },
  {
    id: 'testing',
    label: 'Testing',
    icon: TestTube,
    description: 'Verify system functionality'
  }
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                title={tab.description}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <select
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value as TabId)}
            className="block w-full py-3 px-4 border-0 bg-transparent text-gray-900 focus:ring-0"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}