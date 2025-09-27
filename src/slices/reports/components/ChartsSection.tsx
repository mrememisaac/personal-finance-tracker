import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { TrendingUp, BarChart3, PieChart, Calendar } from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { ReportService } from '../services/ReportService';
import { getDateFilter } from '../../../shared/utils';
import type { DatePeriod, ChartType } from '../../../shared/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartsSectionProps {
  selectedPeriod?: DatePeriod;
  onPeriodChange?: (period: DatePeriod) => void;
}

export function ChartsSection({ 
  selectedPeriod = '30days', 
  onPeriodChange 
}: ChartsSectionProps) {
  const { state } = useAppContext();
  const [activeChart, setActiveChart] = useState<ChartType>('line');

  // Initialize ReportService
  const reportService = useMemo(() => {
    return new ReportService(
      () => state.transactions,
      () => state.accounts,
      () => state.budgets
    );
  }, [state.transactions, state.accounts, state.budgets]);

  // Get date range for selected period
  const dateRange = useMemo(() => {
    return getDateFilter(selectedPeriod);
  }, [selectedPeriod]);

  // Chart data
  const monthlyTrendsData = useMemo(() => {
    return reportService.getMonthlyTrendsChartData(12);
  }, [reportService]);

  const expenseDistributionData = useMemo(() => {
    return reportService.getExpenseDistributionChartData(dateRange);
  }, [reportService, dateRange]);

  const incomeVsExpensesData = useMemo(() => {
    return reportService.getIncomeVsExpensesChartData(dateRange);
  }, [reportService, dateRange]);

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Income vs Expenses Trend',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(context.parsed.y);
            return `${label}: ${value}`;
          }
        }
      },
    },
    hover: {
      mode: 'nearest' as const,
      intersect: true,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Amount ($)'
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Expense Distribution by Category',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(context.parsed);
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Income vs Expenses Comparison',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(context.parsed.y);
            return `${context.dataset.label}: ${value}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)'
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          }
        }
      }
    },
  };

  const periods: { value: DatePeriod; label: string }[] = [
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '90days', label: '90 Days' },
    { value: '1year', label: '1 Year' },
    { value: 'all', label: 'All Time' },
  ];

  const chartTypes: { value: ChartType; label: string; icon: React.ReactNode }[] = [
    { value: 'line', label: 'Trends', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'pie', label: 'Distribution', icon: <PieChart className="w-4 h-4" /> },
    { value: 'bar', label: 'Comparison', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const renderChart = () => {
    const chartContainerClass = "h-80 w-full";
    
    switch (activeChart) {
      case 'line':
        return (
          <div className={chartContainerClass}>
            <Line data={monthlyTrendsData} options={lineChartOptions} />
          </div>
        );
      case 'pie':
        return (
          <div className={chartContainerClass}>
            <Pie data={expenseDistributionData} options={pieChartOptions} />
          </div>
        );
      case 'bar':
        return (
          <div className={chartContainerClass}>
            <Bar data={incomeVsExpensesData} options={barChartOptions} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-xl font-bold text-gray-800">Financial Charts</h2>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Period selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange?.(e.target.value as DatePeriod)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          {/* Chart type selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {chartTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setActiveChart(type.value)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeChart === type.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {type.icon}
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="relative">
        {state.transactions.length === 0 ? (
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <BarChart3 className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 text-lg font-medium">No Data Available</p>
              <p className="text-gray-400 text-sm">Add some transactions to see charts</p>
            </div>
          </div>
        ) : (
          renderChart()
        )}
      </div>

      {/* Chart description */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          {activeChart === 'line' && (
            <p>
              <strong>Monthly Trends:</strong> Track your income and expenses over the last 12 months. 
              Green line shows income, red line shows expenses. Hover over points for detailed amounts.
            </p>
          )}
          {activeChart === 'pie' && (
            <p>
              <strong>Expense Distribution:</strong> See how your spending is distributed across different categories 
              for the selected time period. Hover over segments for detailed breakdown.
            </p>
          )}
          {activeChart === 'bar' && (
            <p>
              <strong>Income vs Expenses:</strong> Compare your total income against total expenses 
              for the selected period. Green represents income, red represents expenses.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}