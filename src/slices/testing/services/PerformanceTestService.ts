import { PerformanceMonitor, PerformanceMetrics } from '../../../shared/utils/performance';
import type { Transaction, Budget, Goal, Account } from '../../../shared/types';

export interface PerformanceTestResult {
  testName: string;
  passed: boolean;
  actualTime: number;
  expectedMaxTime: number;
  details: string;
  timestamp: number;
}

export class PerformanceTestService {
  private monitor: PerformanceMonitor;
  private results: PerformanceTestResult[] = [];

  constructor() {
    this.monitor = PerformanceMonitor.getInstance();
  }

  // Test transaction list rendering performance
  testTransactionListPerformance(transactions: Transaction[]): PerformanceTestResult {
    const testName = 'Transaction List Rendering';
    const expectedMaxTime = 50; // 50ms max for rendering 1000 transactions
    
    const startTime = performance.now();
    
    // Simulate heavy transaction processing
    const processedTransactions = transactions.map(transaction => ({
      ...transaction,
      formattedAmount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(Math.abs(transaction.amount)),
      formattedDate: new Date(transaction.date).toLocaleDateString()
    }));
    
    // Simulate filtering and sorting
    const filteredTransactions = processedTransactions
      .filter(t => t.amount !== 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const endTime = performance.now();
    const actualTime = endTime - startTime;
    const passed = actualTime <= expectedMaxTime;

    const result: PerformanceTestResult = {
      testName,
      passed,
      actualTime,
      expectedMaxTime,
      details: `Processed ${transactions.length} transactions in ${actualTime.toFixed(2)}ms`,
      timestamp: Date.now()
    };

    this.results.push(result);
    return result;
  }

  // Test budget calculations performance
  testBudgetCalculationsPerformance(budgets: Budget[], transactions: Transaction[]): PerformanceTestResult {
    const testName = 'Budget Calculations';
    const expectedMaxTime = 30; // 30ms max for budget calculations
    
    const startTime = performance.now();
    
    // Simulate budget progress calculations
    budgets.forEach(budget => {
      const relevantTransactions = transactions.filter(t => 
        t.category === budget.category && 
        t.type === 'expense' &&
        new Date(t.date) >= new Date(budget.startDate) &&
        new Date(t.date) <= new Date(budget.endDate)
      );
      
      const spent = relevantTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const remaining = Math.max(0, budget.limit - spent);
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      
      // Simulate status calculation
      const status = percentage >= 100 ? 'danger' : 
                    percentage >= 80 ? 'warning' : 'safe';
    });
    
    const endTime = performance.now();
    const actualTime = endTime - startTime;
    const passed = actualTime <= expectedMaxTime;

    const result: PerformanceTestResult = {
      testName,
      passed,
      actualTime,
      expectedMaxTime,
      details: `Calculated ${budgets.length} budgets with ${transactions.length} transactions in ${actualTime.toFixed(2)}ms`,
      timestamp: Date.now()
    };

    this.results.push(result);
    return result;
  }

  // Test chart data preparation performance
  testChartDataPerformance(transactions: Transaction[]): PerformanceTestResult {
    const testName = 'Chart Data Preparation';
    const expectedMaxTime = 100; // 100ms max for chart data preparation
    
    const startTime = performance.now();
    
    // Simulate monthly trends calculation
    const monthlyData = new Map<string, { income: number; expenses: number }>();
    
    transactions.forEach(transaction => {
      const monthKey = new Date(transaction.date).toISOString().slice(0, 7); // YYYY-MM
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expenses: 0 });
      }
      
      const data = monthlyData.get(monthKey)!;
      if (transaction.type === 'income') {
        data.income += transaction.amount;
      } else {
        data.expenses += Math.abs(transaction.amount);
      }
    });
    
    // Simulate category breakdown calculation
    const categoryData = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const current = categoryData.get(transaction.category) || 0;
        categoryData.set(transaction.category, current + Math.abs(transaction.amount));
      });
    
    // Convert to chart format
    const chartData = {
      monthlyTrends: {
        labels: Array.from(monthlyData.keys()).sort(),
        datasets: [
          {
            label: 'Income',
            data: Array.from(monthlyData.values()).map(d => d.income),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)'
          },
          {
            label: 'Expenses',
            data: Array.from(monthlyData.values()).map(d => d.expenses),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)'
          }
        ]
      },
      categoryBreakdown: {
        labels: Array.from(categoryData.keys()),
        datasets: [{
          data: Array.from(categoryData.values()),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
          ]
        }]
      }
    };
    
    const endTime = performance.now();
    const actualTime = endTime - startTime;
    const passed = actualTime <= expectedMaxTime;

    const result: PerformanceTestResult = {
      testName,
      passed,
      actualTime,
      expectedMaxTime,
      details: `Prepared chart data for ${transactions.length} transactions in ${actualTime.toFixed(2)}ms`,
      timestamp: Date.now()
    };

    this.results.push(result);
    return result;
  }

  // Test memory usage
  testMemoryUsage(): PerformanceTestResult {
    const testName = 'Memory Usage';
    const expectedMaxMemory = 50 * 1024 * 1024; // 50MB max
    
    const memoryUsage = this.monitor.getMemoryUsage() || 0;
    const passed = memoryUsage <= expectedMaxMemory;

    const result: PerformanceTestResult = {
      testName,
      passed,
      actualTime: memoryUsage,
      expectedMaxTime: expectedMaxMemory,
      details: `Current memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      timestamp: Date.now()
    };

    this.results.push(result);
    return result;
  }

  // Test virtual scrolling performance
  testVirtualScrollingPerformance(itemCount: number): PerformanceTestResult {
    const testName = 'Virtual Scrolling';
    const expectedMaxTime = 20; // 20ms max for virtual scrolling calculations
    
    const startTime = performance.now();
    
    // Simulate virtual scrolling calculations
    const itemHeight = 60;
    const containerHeight = 400;
    const scrollTop = 1000;
    const overscan = 5;
    
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan, itemCount);
    const adjustedStart = Math.max(0, startIndex - overscan);
    
    // Simulate rendering visible items
    const visibleItems = Array.from(
      { length: endIndex - adjustedStart }, 
      (_, i) => adjustedStart + i
    );
    
    const totalHeight = itemCount * itemHeight;
    const offsetY = adjustedStart * itemHeight;
    
    const endTime = performance.now();
    const actualTime = endTime - startTime;
    const passed = actualTime <= expectedMaxTime;

    const result: PerformanceTestResult = {
      testName,
      passed,
      actualTime,
      expectedMaxTime,
      details: `Virtual scrolling for ${itemCount} items calculated in ${actualTime.toFixed(2)}ms`,
      timestamp: Date.now()
    };

    this.results.push(result);
    return result;
  }

  // Run all performance tests
  runAllPerformanceTests(
    transactions: Transaction[],
    budgets: Budget[],
    goals: Goal[],
    accounts: Account[]
  ): PerformanceTestResult[] {
    const results: PerformanceTestResult[] = [];
    
    // Generate test data if needed
    const testTransactions = transactions.length > 0 ? transactions : this.generateTestTransactions(1000);
    const testBudgets = budgets.length > 0 ? budgets : this.generateTestBudgets(10);
    
    results.push(this.testTransactionListPerformance(testTransactions));
    results.push(this.testBudgetCalculationsPerformance(testBudgets, testTransactions));
    results.push(this.testChartDataPerformance(testTransactions));
    results.push(this.testMemoryUsage());
    results.push(this.testVirtualScrollingPerformance(10000));
    
    return results;
  }

  // Generate test transactions for performance testing
  private generateTestTransactions(count: number): Transaction[] {
    const categories = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Healthcare'];
    const descriptions = ['Grocery Store', 'Gas Station', 'Restaurant', 'Movie Theater', 'Online Purchase'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `test-transaction-${i}`,
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      amount: Math.random() * 1000 - 200, // Random amount between -200 and 800
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      accountId: 'test-account',
      type: Math.random() > 0.3 ? 'expense' : 'income',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  // Generate test budgets for performance testing
  private generateTestBudgets(count: number): Budget[] {
    const categories = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Healthcare'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `test-budget-${i}`,
      category: categories[i % categories.length],
      limit: Math.random() * 1000 + 200,
      period: Math.random() > 0.5 ? 'monthly' : 'weekly',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  // Get all performance test results
  getResults(): PerformanceTestResult[] {
    return [...this.results];
  }

  // Clear performance test results
  clearResults(): void {
    this.results = [];
  }

  // Get performance summary
  getPerformanceSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageTime: number;
    worstPerformingTest: PerformanceTestResult | null;
  } {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const averageTime = totalTests > 0 
      ? this.results.reduce((sum, r) => sum + r.actualTime, 0) / totalTests 
      : 0;
    
    const worstPerformingTest = this.results.reduce((worst, current) => {
      if (!worst) return current;
      const worstRatio = worst.actualTime / worst.expectedMaxTime;
      const currentRatio = current.actualTime / current.expectedMaxTime;
      return currentRatio > worstRatio ? current : worst;
    }, null as PerformanceTestResult | null);

    return {
      totalTests,
      passedTests,
      failedTests,
      averageTime,
      worstPerformingTest
    };
  }
}