import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, X, Bell, BellOff } from 'lucide-react';
import type { BudgetAlert } from '../../../shared/types';

interface BudgetAlertsProps {
  alerts: BudgetAlert[];
  onDismiss?: (alertId: string) => void;
  onDismissAll?: () => void;
  className?: string;
  showNotifications?: boolean;
  onToggleNotifications?: (enabled: boolean) => void;
}

interface AlertItemProps {
  alert: BudgetAlert;
  onDismiss?: (alertId: string) => void;
  isAnimating?: boolean;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onDismiss, isAnimating = false }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.(alert.budgetId);
    }, 300); // Match animation duration
  };

  const getAlertIcon = () => {
    switch (alert.severity) {
      case 'danger':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getAlertStyles = () => {
    const baseStyles = "border rounded-lg p-4 transition-all duration-300 ease-in-out";
    const visibilityStyles = isVisible ? "opacity-100 transform translate-x-0" : "opacity-0 transform translate-x-full";
    
    switch (alert.severity) {
      case 'danger':
        return `${baseStyles} ${visibilityStyles} bg-red-50 border-red-200`;
      case 'warning':
        return `${baseStyles} ${visibilityStyles} bg-yellow-50 border-yellow-200`;
      default:
        return `${baseStyles} ${visibilityStyles} bg-yellow-50 border-yellow-200`;
    }
  };

  const getTextStyles = () => {
    switch (alert.severity) {
      case 'danger':
        return "text-red-800";
      case 'warning':
        return "text-yellow-800";
      default:
        return "text-yellow-800";
    }
  };

  return (
    <div className={getAlertStyles()}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getAlertIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={`text-sm font-medium ${getTextStyles()}`}>
                {alert.category} Budget Alert
              </h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                alert.severity === 'danger' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {alert.severity === 'danger' ? 'Over Budget' : 'Warning'}
              </span>
            </div>
            <p className={`text-sm ${getTextStyles()}`}>
              {alert.message}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 ml-4 p-1 rounded-full hover:bg-opacity-20 transition-colors ${
              alert.severity === 'danger' 
                ? 'hover:bg-red-600 text-red-400 hover:text-red-600' 
                : 'hover:bg-yellow-600 text-yellow-400 hover:text-yellow-600'
            }`}
            title="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const BudgetAlerts: React.FC<BudgetAlertsProps> = ({
  alerts,
  onDismiss,
  onDismissAll,
  className = '',
  showNotifications = true,
  onToggleNotifications
}) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.budgetId));

  // Group alerts by severity
  const dangerAlerts = visibleAlerts.filter(alert => alert.severity === 'danger');
  const warningAlerts = visibleAlerts.filter(alert => alert.severity === 'warning');

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onDismiss?.(alertId);
  };

  const handleDismissAll = () => {
    const allAlertIds = visibleAlerts.map(alert => alert.budgetId);
    setDismissedAlerts(prev => new Set([...prev, ...allAlertIds]));
    onDismissAll?.();
  };

  const handleToggleNotifications = () => {
    onToggleNotifications?.(!showNotifications);
  };

  // Reset dismissed alerts when alerts prop changes
  useEffect(() => {
    setDismissedAlerts(new Set());
  }, [alerts]);

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Budget Alerts ({visibleAlerts.length})
          </h3>
          {dangerAlerts.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {dangerAlerts.length} Critical
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Notification Toggle */}
          {onToggleNotifications && (
            <button
              onClick={handleToggleNotifications}
              className={`p-2 rounded-lg transition-colors ${
                showNotifications
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={showNotifications ? 'Disable notifications' : 'Enable notifications'}
            >
              {showNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
          )}
          
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {isCollapsed ? 'Show' : 'Hide'}
          </button>
          
          {/* Dismiss All */}
          {onDismissAll && visibleAlerts.length > 1 && (
            <button
              onClick={handleDismissAll}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Dismiss All
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      {!isCollapsed && (
        <div className="space-y-3">
          {/* Critical Alerts First */}
          {dangerAlerts.map(alert => (
            <AlertItem
              key={alert.budgetId}
              alert={alert}
              onDismiss={handleDismiss}
            />
          ))}
          
          {/* Warning Alerts */}
          {warningAlerts.map(alert => (
            <AlertItem
              key={alert.budgetId}
              alert={alert}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {/* Summary when collapsed */}
      {isCollapsed && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {dangerAlerts.length > 0 && (
                <span className="text-red-600 font-medium">
                  {dangerAlerts.length} critical
                </span>
              )}
              {dangerAlerts.length > 0 && warningAlerts.length > 0 && ', '}
              {warningAlerts.length > 0 && (
                <span className="text-yellow-600 font-medium">
                  {warningAlerts.length} warning{warningAlerts.length !== 1 ? 's' : ''}
                </span>
              )}
            </span>
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Notification Status */}
      {!showNotifications && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <BellOff className="w-4 h-4" />
            <span>Budget notifications are disabled</span>
            {onToggleNotifications && (
              <button
                onClick={handleToggleNotifications}
                className="text-blue-600 hover:text-blue-800 font-medium ml-2"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { BudgetAlerts };