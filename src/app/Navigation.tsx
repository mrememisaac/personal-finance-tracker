import React, { useEffect, useRef } from 'react';
import { 
  Home, 
  Wallet, 
  TrendingUp, 
  PieChart, 
  Target, 
  BarChart3,
  TestTube
} from 'lucide-react';
import { useAccessibility } from '../shared/components/AccessibilityProvider';

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
  shortcut?: string;
}

const tabs: NavTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Overview of your finances',
    shortcut: '1'
  },
  {
    id: 'accounts',
    label: 'Accounts',
    icon: Wallet,
    description: 'Manage your financial accounts',
    shortcut: '2'
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: TrendingUp,
    description: 'Track income and expenses',
    shortcut: '3'
  },
  {
    id: 'budgets',
    label: 'Budgets',
    icon: PieChart,
    description: 'Set and monitor spending limits',
    shortcut: '4'
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: Target,
    description: 'Track financial objectives',
    shortcut: '5'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    description: 'Analytics and insights',
    shortcut: '6'
  },
  {
    id: 'testing',
    label: 'Testing',
    icon: TestTube,
    description: 'Verify system functionality',
    shortcut: '7'
  }
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { announceMessage } = useAccessibility();
  const navRef = useRef<HTMLElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Alt + number keys for navigation
      if (event.altKey && event.key >= '1' && event.key <= '7') {
        event.preventDefault();
        const tabIndex = parseInt(event.key) - 1;
        const tab = tabs[tabIndex];
        if (tab) {
          onTabChange(tab.id);
          announceMessage(`Navigated to ${tab.label}`);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange, announceMessage]);

  // Handle arrow key navigation within tabs
  const handleKeyNavigation = (event: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    
    const newTab = tabs[newIndex];
    onTabChange(newTab.id);
    
    // Focus the new tab button
    setTimeout(() => {
      const button = navRef.current?.querySelector(`[data-tab="${newTab.id}"]`) as HTMLButtonElement;
      button?.focus();
    }, 0);
  };

  return (
    <nav 
      ref={navRef}
      className="bg-white border-b border-gray-200"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8" role="tablist">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  announceMessage(`${tab.label} selected`);
                }}
                onKeyDown={(e) => handleKeyNavigation(e, index)}
                className={`
                  flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t-md
                  ${isActive
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                tabIndex={isActive ? 0 : -1}
                title={`${tab.description} (Alt+${tab.shortcut})`}
              >
                <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                <span>{tab.label}</span>
                <span className="sr-only">
                  {isActive ? ' (current page)' : ''}
                  {tab.shortcut ? ` - Press Alt+${tab.shortcut} to navigate here` : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <label htmlFor="mobile-nav-select" className="sr-only">
            Choose a page to navigate to
          </label>
          <select
            id="mobile-nav-select"
            value={activeTab}
            onChange={(e) => {
              const newTab = e.target.value as TabId;
              onTabChange(newTab);
              const selectedTab = tabs.find(tab => tab.id === newTab);
              if (selectedTab) {
                announceMessage(`${selectedTab.label} selected`);
              }
            }}
            className="block w-full py-3 px-4 border-0 bg-transparent text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md"
            aria-label="Navigation menu"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label} - {tab.description}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}