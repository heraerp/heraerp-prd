/**
 * Page Object Model for Production Routing page
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductionRoutingPage extends BasePage {
  readonly productSelector: Locator;
  readonly routingTable: Locator;
  readonly operationRows: Locator;
  readonly addOperationButton: Locator;
  readonly totalTimeDisplay: Locator;
  readonly totalCostDisplay: Locator;
  readonly saveRoutingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productSelector = page.locator('[data-testid="routing-product-selector"]');
    this.routingTable = page.locator('[data-testid="routing-table"]');
    this.operationRows = this.routingTable.locator('tbody tr');
    this.addOperationButton = page.locator('[data-testid="add-operation-button"]');
    this.totalTimeDisplay = page.locator('[data-testid="total-time-display"]');
    this.totalCostDisplay = page.locator('[data-testid="total-routing-cost-display"]');
    this.saveRoutingButton = page.locator('[data-testid="save-routing-button"]');
  }

  /**
   * Navigate to Production Routing page
   */
  async goto() {
    await this.page.goto('/furniture/production');
    await this.waitForPageLoad();
  }

  /**
   * Select a product for routing
   */
  async selectProduct(productName: string) {
    await this.productSelector.selectOption({ label: productName });
    await this.waitForUniversalApiResponse('read');
  }

  /**
   * Add an operation to routing
   */
  async addOperation(operation: {
    name: string;
    workstation: string;
    setupTime: number;
    runTime: number;
    laborCost: number;
    overheadCost?: number;
    description?: string;
  }) {
    await this.addOperationButton.click();
    
    // Fill operation form
    await this.page.fill('[data-testid="operation-name-input"]', operation.name);
    await this.page.selectOption('[data-testid="workstation-select"]', operation.workstation);
    await this.page.fill('[data-testid="setup-time-input"]', operation.setupTime.toString());
    await this.page.fill('[data-testid="run-time-input"]', operation.runTime.toString());
    await this.page.fill('[data-testid="labor-cost-input"]', operation.laborCost.toString());
    
    if (operation.overheadCost) {
      await this.page.fill('[data-testid="overhead-cost-input"]', operation.overheadCost.toString());
    }
    
    if (operation.description) {
      await this.page.fill('[data-testid="operation-description-input"]', operation.description);
    }
    
    await this.page.click('[data-testid="add-operation-confirm"]');
    await this.waitForPageLoad();
  }

  /**
   * Remove an operation from routing
   */
  async removeOperation(operationName: string) {
    const row = this.operationRows.filter({ hasText: operationName }).first();
    await row.locator('[data-testid="remove-operation-button"]').click();
    
    // Confirm removal
    await this.page.click('[data-testid="confirm-remove-operation"]');
    await this.waitForPageLoad();
  }

  /**
   * Reorder operations (drag and drop)
   */
  async reorderOperation(operationName: string, newPosition: number) {
    const row = this.operationRows.filter({ hasText: operationName }).first();
    const targetRow = this.operationRows.nth(newPosition - 1);
    
    await row.dragTo(targetRow);
    await this.waitForPageLoad();
  }

  /**
   * Update operation time
   */
  async updateOperationTime(operationName: string, setupTime: number, runTime: number) {
    const row = this.operationRows.filter({ hasText: operationName }).first();
    
    const setupTimeInput = row.locator('[data-testid="setup-time-edit"]');
    await setupTimeInput.clear();
    await setupTimeInput.fill(setupTime.toString());
    
    const runTimeInput = row.locator('[data-testid="run-time-edit"]');
    await runTimeInput.clear();
    await runTimeInput.fill(runTime.toString());
    
    await runTimeInput.press('Enter');
    await this.waitForPageLoad();
  }

  /**
   * Get operation details
   */
  async getOperationDetails(operationName: string): Promise<{
    sequence: number;
    name: string;
    workstation: string;
    setupTime: number;
    runTime: number;
    totalTime: number;
    laborCost: number;
    totalCost: number;
  }> {
    const row = this.operationRows.filter({ hasText: operationName }).first();
    
    return {
      sequence: parseInt(await row.locator('[data-testid="operation-sequence"]').textContent() || '0'),
      name: await row.locator('[data-testid="operation-name"]').textContent() || '',
      workstation: await row.locator('[data-testid="operation-workstation"]').textContent() || '',
      setupTime: parseFloat(await row.locator('[data-testid="operation-setup-time"]').textContent() || '0'),
      runTime: parseFloat(await row.locator('[data-testid="operation-run-time"]').textContent() || '0'),
      totalTime: parseFloat(await row.locator('[data-testid="operation-total-time"]').textContent() || '0'),
      laborCost: parseFloat(await row.locator('[data-testid="operation-labor-cost"]').textContent() || '0'),
      totalCost: parseFloat(await row.locator('[data-testid="operation-total-cost"]').textContent() || '0')
    };
  }

  /**
   * Get total routing time
   */
  async getTotalTime(): Promise<number> {
    const timeText = await this.totalTimeDisplay.textContent() || '0';
    return parseFloat(timeText.replace(/[^0-9.-]+/g, ''));
  }

  /**
   * Get total routing cost
   */
  async getTotalCost(): Promise<number> {
    const costText = await this.totalCostDisplay.textContent() || '0';
    return parseFloat(costText.replace(/[^0-9.-]+/g, ''));
  }

  /**
   * Get number of operations
   */
  async getOperationCount(): Promise<number> {
    return await this.operationRows.count();
  }

  /**
   * Save routing
   */
  async saveRouting() {
    await this.saveRoutingButton.click();
    await this.waitForUniversalApiResponse('create');
    await this.waitForToast('Production routing saved successfully');
  }

  /**
   * Copy routing from another product
   */
  async copyRoutingFrom(sourceProduct: string) {
    await this.page.click('[data-testid="copy-routing-button"]');
    
    // Select source product
    await this.page.selectOption('[data-testid="copy-from-product-select"]', sourceProduct);
    
    await this.page.click('[data-testid="copy-routing-confirm"]');
    await this.waitForUniversalApiResponse('batch_create');
  }

  /**
   * Export routing to PDF
   */
  async exportRoutingToPDF() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click('[data-testid="export-routing-pdf-button"]')
    ]);
    
    return download;
  }

  /**
   * Set operation as quality checkpoint
   */
  async setQualityCheckpoint(operationName: string) {
    const row = this.operationRows.filter({ hasText: operationName }).first();
    await row.locator('[data-testid="quality-checkpoint-toggle"]').click();
    await this.waitForPageLoad();
  }
}