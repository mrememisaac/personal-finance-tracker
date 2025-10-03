import React, { useState, useEffect } from 'react';
import { Plus, Target, Zap, Keyboard } from 'lucide-react';

interface QuickActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  shortcut?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

function QuickActionButton({ 
  icon, 
  title, 
  description, 
  onClick, 
  shortcut,
  color = 'blue' 
}: QuickActionButtonProps) {
  const getColorStyles = () => {
    const colorMap = {
      blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
      green: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
      purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
      orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700'
    };
    return colorMap[color];
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg border-2 transition-all duration-200 
        hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${getColorStyles()}
      `}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{title}</h4>
            {shortcut && (
              <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded font-mono">
                {shortcut}
              </span>
            )}
          </div>
          <p className="text-sm opacity-75 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}

interface QuickActionsProps {
  onAddTransaction?: () => void;
  onAddBudget?: () => void;
  onAddGoal?: () => void;
  onViewReports?: () => void;
}

export function QuickActions({ 
  onAddTransaction, 
  onAddBudget, 
  onAddGoal, 
  onViewReports 
}: QuickActionsProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Ctrl/Cmd is pressed and no input is focused
      if ((event.ctrlKey || event.metaKey) && !isInputFocused()) {
        switch (event.key.toLowerCase()) {
          case 't':
            event.preventDefault();
            onAddTransaction?.();
            break;
          case 'b':
            event.preventDefault();
            onAddBudget?.();
            break;
          case 'g':
            event.preventDefault();
            onAddGoal?.();
            break;
          case 'r':
            event.preventDefault();
            onViewReports?.();
            break;
          default:
            break;
        }
      }
    };

    const isInputFocused = () => {
      const activeElement = document.activeElement;
      return activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onAddTransaction, onAddBudget, onAddGoal, onViewReports]);

  const handleAddTransaction = () => {
    console.log('Add Transaction clicked');
    onAddTransaction?.();
  };

  const handleAddBudget = () => {
    console.log('Add Budget clicked');
    onAddBudget?.();
  };

  const handleAddGoal = () => {
    console.log('Add Goal clicked');
    onAddGoal?.();
  };

  const handleViewReports = () => {
    console.log('View Reports clicked');
    onViewReports?.();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Zap className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          title="Toggle keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      </div>

      {showShortcuts && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2 font-medium">Keyboard Shortcuts:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>Ctrl+T: Add Transaction</div>
            <div>Ctrl+B: Add Budget</div>
            <div>Ctrl+G: Add Goal</div>
            <div>Ctrl+R: View Reports</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickActionButton
          icon={<Plus className="w-6 h-6" />}
          title="Add Transaction"
          description="Record income or expense"
          onClick={handleAddTransaction}
          shortcut="Ctrl+T"
          color="blue"
        />
        
        <QuickActionButton
          icon={<Target className="w-6 h-6" />}
          title="Create Budget"
          description="Set spending limits"
          onClick={handleAddBudget}
          shortcut="Ctrl+B"
          color="green"
        />
        
        <QuickActionButton
          icon={<Target className="w-6 h-6" />}
          title="Add Goal"
          description="Set financial targets"
          onClick={handleAddGoal}
          shortcut="Ctrl+G"
          color="purple"
        />
        
        <QuickActionButton
          icon={<Zap className="w-6 h-6" />}
          title="View Reports"
          description="Analyze your finances"
          onClick={handleViewReports}
          shortcut="Ctrl+R"
          color="orange"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Click any action above or use keyboard shortcuts for quick access
        </p>
      </div>
    </div>
  );
}