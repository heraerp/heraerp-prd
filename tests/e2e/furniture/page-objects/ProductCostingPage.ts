/**
 * Page Object Model for Product Costing page
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductCostingPage extends BasePage {
  readonly productSelector: Locator;
  readonly costingSummary: Locator;
  readonly materialCostDisplay: Locator;
  readonly laborCostDisplay: Locator;
  readonly overheadCostDisplay: Locator;
  readonly totalCostDisplay: Locator;
  readonly marginDisplay: Locator;
  readonly costBreakdownTable: Locator;
  readonly calculateCostButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productSelector = page.locator('[data-testid="costing-product-selector"]');
    this.costingSummary = page.locator('[data-testid="costing-summary"]');
    this.materialCostDisplay = page.locator('[data-testid="material-cost-display"]');
    this.laborCostDisplay = page.locator('[data-testid="labor-cost-display"]');
    this.overheadCostDisplay = page.locator('[data-testid="overhead-cost-display"]');
    this.totalCostDisplay = page.locator('[data-testid="total-product-cost-display"]');
    this.marginDisplay = page.locator('[data-testid="profit-margin-display"]');
    this.costBreakdownTable = page.locator('[data-testid="cost-breakdown-table"]');
    this.calculateCostButton = page.locator('[data-testid="calculate-cost-button"]');
  }

  /**
   * Navigate to Product Costing page
   */
  async goto() {
    await this.page.goto('/furniture/products');
    await this.page.click('[data-testid="costing-tab"]');
    await this.waitForPageLoad();
  }

  /**
   * Select a product for costing
   */
  async selectProduct(productName: string) {
    await this.productSelector.selectOption({ label: productName });
    await this.waitForUniversalApiResponse('read');
  }

  /**
   * Calculate product cost
   */
  async calculateCost() {
    await this.calculateCostButton.click();
    await this.waitForUniversalApiResponse('calculate_cost');
    await this.waitForPageLoad();
  }

  /**
   * Get cost breakdown
   */
  async getCostBreakdown(): Promise<{
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    sellingPrice: number;
    margin: number;
    marginPercentage: number;
  }> {
    const parseAmount = (text: string) => parseFloat(text.replace(/[^0-9.-]+/g, '') || '0');
    
    return {
      materialCost: parseAmount(await this.materialCostDisplay.textContent() || '0'),
      laborCost: parseAmount(await this.laborCostDisplay.textContent() || '0'),
      overheadCost: parseAmount(await this.overheadCostDisplay.textContent() || '0'),
      totalCost: parseAmount(await this.totalCostDisplay.textContent() || '0'),
      sellingPrice: parseAmount(await this.page.locator('[data-testid="selling-price-display"]').textContent() || '0'),
      margin: parseAmount(await this.page.locator('[data-testid="profit-margin-amount"]').textContent() || '0'),
      marginPercentage: parseAmount(await this.marginDisplay.textContent() || '0')
    };
  }

  /**
   * Get material cost breakdown
   */
  async getMaterialCostBreakdown(): Promise<Array<{
    component: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>> {
    const rows = this.costBreakdownTable.locator('tbody tr[data-testid="material-cost-row"]');
    const breakdown = [];
    
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      breakdown.push({
        component: await row.locator('[data-testid="component-name"]').textContent() || '',
        quantity: parseFloat(await row.locator('[data-testid="component-quantity"]').textContent() || '0'),
        unitCost: parseFloat(await row.locator('[data-testid="component-unit-cost"]').textContent() || '0'),
        totalCost: parseFloat(await row.locator('[data-testid="component-total-cost"]').textContent() || '0')
      });
    }
    
    return breakdown;
  }

  /**
   * Get labor cost breakdown
   */
  async getLaborCostBreakdown(): Promise<Array<{
    operation: string;
    time: number;
    rate: number;
    totalCost: number;
  }>> {
    const rows = this.costBreakdownTable.locator('tbody tr[data-testid="labor-cost-row"]');
    const breakdown = [];
    
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      breakdown.push({
        operation: await row.locator('[data-testid="operation-name"]').textContent() || '',
        time: parseFloat(await row.locator('[data-testid="operation-time"]').textContent() || '0'),
        rate: parseFloat(await row.locator('[data-testid="labor-rate"]').textContent() || '0'),
        totalCost: parseFloat(await row.locator('[data-testid="labor-total-cost"]').textContent() || '0')
      });
    }
    
    return breakdown;
  }

  /**
   * Update selling price
   */
  async updateSellingPrice(newPrice: number) {
    const priceInput = this.page.locator('[data-testid="selling-price-input"]');
    await priceInput.clear();
    await priceInput.fill(newPrice.toString());
    await priceInput.press('Enter');
    
    await this.waitForPageLoad();
  }

  /**
   * Update overhead allocation
   */
  async updateOverheadAllocation(percentage: number) {
    const overheadInput = this.page.locator('[data-testid="overhead-percentage-input"]');
    await overheadInput.clear();
    await overheadInput.fill(percentage.toString());
    await overheadInput.press('Enter');
    
    await this.waitForPageLoad();
  }

  /**
   * Export costing report
   */
  async exportCostingReport(format: 'pdf' | 'excel' = 'pdf') {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click(`[data-testid="export-costing-${format}"]`)
    ]);
    
    return download;
  }

  /**
   * Compare with historical cost
   */
  async compareWithHistorical(date: string) {
    await this.page.click('[data-testid="compare-historical-button"]');
    await this.page.fill('[data-testid="historical-date-input"]', date);
    await this.page.click('[data-testid="compare-confirm"]');
    
    await this.waitForUniversalApiResponse('historical_cost');
  }

  /**
   * Run what-if analysis
   */
  async runWhatIfAnalysis(scenario: {
    materialCostChange?: number;
    laborCostChange?: number;
    overheadChange?: number;
  }) {
    await this.page.click('[data-testid="what-if-analysis-button"]');
    
    if (scenario.materialCostChange) {
      await this.page.fill('[data-testid="material-cost-change-input"]', scenario.materialCostChange.toString());
    }
    
    if (scenario.laborCostChange) {
      await this.page.fill('[data-testid="labor-cost-change-input"]', scenario.laborCostChange.toString());
    }
    
    if (scenario.overheadChange) {
      await this.page.fill('[data-testid="overhead-change-input"]', scenario.overheadChange.toString());
    }
    
    await this.page.click('[data-testid="run-analysis-button"]');
    await this.waitForPageLoad();
  }

  /**
   * Save cost analysis
   */
  async saveCostAnalysis(name: string) {
    await this.page.click('[data-testid="save-cost-analysis-button"]');
    await this.page.fill('[data-testid="analysis-name-input"]', name);
    await this.page.click('[data-testid="save-analysis-confirm"]');
    
    await this.waitForUniversalApiResponse('create');
    await this.waitForToast('Cost analysis saved successfully');
  }
}