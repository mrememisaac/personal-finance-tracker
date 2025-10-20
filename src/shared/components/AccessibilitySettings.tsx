import React, { useState } from 'react';
import { Settings, Type, Eye, Zap } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilitySettings({ isOpen, onClose }: AccessibilitySettingsProps) {
  const { fontSize, setFontSize, isHighContrast, isReducedMotion, announceMessage } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    announceMessage(`Font size changed to ${size}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        role="dialog"
        aria-labelledby="accessibility-settings-title"
        aria-describedby="accessibility-settings-description"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-blue-600 mr-2" aria-hidden="true" />
            <h2 id="accessibility-settings-title" className="text-xl font-semibold text-gray-900">
              Accessibility Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
            aria-label="Close accessibility settings"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p id="accessibility-settings-description" className="text-sm text-gray-600">
            Customize the application to better suit your accessibility needs.
          </p>

          {/* Font Size */}
          <div>
            <div className="flex items-center mb-3">
              <Type className="h-4 w-4 text-gray-500 mr-2" aria-hidden="true" />
              <label className="text-sm font-medium text-gray-700">
                Font Size
              </label>
            </div>
            <div 
              className="space-y-2"
              role="radiogroup"
              aria-labelledby="font-size-label"
            >
              <span id="font-size-label" className="sr-only">Choose font size</span>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <label key={size} className="flex items-center">
                  <input
                    type="radio"
                    name="fontSize"
                    value={size}
                    checked={fontSize === size}
                    onChange={() => handleFontSizeChange(size)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {size} ({size === 'small' ? '14px' : size === 'medium' ? '16px' : '18px'})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* System Preferences Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Eye className="h-4 w-4 text-gray-500 mr-2" aria-hidden="true" />
              System Preferences
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">High Contrast Mode:</span>
                <span className={`font-medium ${isHighContrast ? 'text-green-600' : 'text-gray-500'}`}>
                  {isHighContrast ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Reduced Motion:</span>
                <span className={`font-medium ${isReducedMotion ? 'text-green-600' : 'text-gray-500'}`}>
                  {isReducedMotion ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              These settings are automatically detected from your system preferences.
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-left"
              aria-expanded={isExpanded}
              aria-controls="keyboard-shortcuts"
            >
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Zap className="h-4 w-4 text-gray-500 mr-2" aria-hidden="true" />
                Keyboard Shortcuts
              </h3>
              <span className="text-gray-400">
                {isExpanded ? '−' : '+'}
              </span>
            </button>
            
            {isExpanded && (
              <div id="keyboard-shortcuts" className="mt-3 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Tab</kbd>
                    <span className="ml-2 text-gray-600">Navigate forward</span>
                  </div>
                  <div>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Shift+Tab</kbd>
                    <span className="ml-2 text-gray-600">Navigate backward</span>
                  </div>
                  <div>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
                    <span className="ml-2 text-gray-600">Activate button</span>
                  </div>
                  <div>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Escape</kbd>
                    <span className="ml-2 text-gray-600">Close modal</span>
                  </div>
                  <div>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd>
                    <span className="ml-2 text-gray-600">Toggle checkbox</span>
                  </div>
                  <div>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Arrow Keys</kbd>
                    <span className="ml-2 text-gray-600">Navigate options</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}