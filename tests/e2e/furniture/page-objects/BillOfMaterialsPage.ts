/**
 * Page Object Model for Bill of Materials page
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class BillOfMaterialsPage extends BasePage {
  readonly productSelector: Locator;
  readonly bomTable: Locator;
  readonly bomRows: Locator;
  readonly addComponentButton: Locator;
  readonly totalCostDisplay: Locator;
  readonly saveButton: Locator;
  readonly versionSelector: Locator;

  constructor(page: Page) {
    super(page);
    this.productSelector = page.locator('[data-testid="product-selector"]');
    this.bomTable = page.locator('[data-testid="bom-table"]');
    this.bomRows = this.bomTable.locator('tbody tr');
    this.addComponentButton = page.locator('[data-testid="add-component-button"]');
    this.totalCostDisplay = page.locator('[data-testid="total-cost-display"]');
    this.saveButton = page.locator('[data-testid="save-bom-button"]');
    this.versionSelector = page.locator('[data-testid="bom-version-selector"]');
  }

  /**
   * Navigate to BOM page
   */
  async goto() {
    await this.page.goto('/furniture/products');
    await this.waitForPageLoad();
  }

  /**
   * Select a product for BOM
   */
  async selectProduct(productName: string) {
    await this.productSelector.selectOption({ label: productName });
    await this.waitForUniversalApiResponse('read');
  }

  /**
   * Add a component to BOM
   */
  async addComponent(component: {
    name: string;
    code: string;
    quantity: number;
    unit: string;
    unitCost?: number;
  }) {
    await this.addComponentButton.click();
    
    // Fill component form in modal
    await this.page.fill('[data-testid="component-name-input"]', component.name);
    await this.page.fill('[data-testid="component-code-input"]', component.code);
    await this.page.fill('[data-testid="component-quantity-input"]', component.quantity.toString());
    await this.page.selectOption('[data-testid="component-unit-select"]', component.unit);
    
    if (component.unitCost) {
      await this.page.fill('[data-testid="component-unit-cost-input"]', component.unitCost.toString());
    }
    
    await this.page.click('[data-testid="add-component-confirm"]');
    await this.waitForPageLoad();
  }

  /**
   * Remove a component from BOM
   */
  async removeComponent(componentName: string) {
    const row = this.bomRows.filter({ hasText: componentName }).first();
    await row.locator('[data-testid="remove-component-button"]').click();
    
    // Confirm removal
    await this.page.click('[data-testid="confirm-remove"]');
    await this.waitForPageLoad();
  }

  /**
   * Update component quantity
   */
  async updateComponentQuantity(componentName: string, newQuantity: number) {
    const row = this.bomRows.filter({ hasText: componentName }).first();
    const quantityInput = row.locator('[data-testid="component-quantity-edit"]');
    
    await quantityInput.clear();
    await quantityInput.fill(newQuantity.toString());
    await quantityInput.press('Enter');
    
    await this.waitForPageLoad();
  }

  /**
   * Get component details from BOM
   */
  async getComponentDetails(componentName: string): Promise<{
    name: string;
    code: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
  }> {
    const row = this.bomRows.filter({ hasText: componentName }).first();
    
    return {
      name: await row.locator('[data-testid="component-name"]').textContent() || '',
      code: await row.locator('[data-testid="component-code"]').textContent() || '',
      quantity: parseFloat(await row.locator('[data-testid="component-quantity"]').textContent() || '0'),
      unit: await row.locator('[data-testid="component-unit"]').textContent() || '',
      unitCost: parseFloat(await row.locator('[data-testid="component-unit-cost"]').textContent() || '0'),
      totalCost: parseFloat(await row.locator('[data-testid="component-total-cost"]').textContent() || '0')
    };
  }

  /**
   * Get total BOM cost
   */
  async getTotalCost(): Promise<number> {
    const costText = await this.totalCostDisplay.textContent() || '0';
    return parseFloat(costText.replace(/[^0-9.-]+/g, ''));
  }

  /**
   * Get number of components in BOM
   */
  async getComponentCount(): Promise<number> {
    return await this.bomRows.count();
  }

  /**
   * Save BOM
   */
  async saveBOM() {
    await this.saveButton.click();
    await this.waitForUniversalApiResponse('create');
    await this.waitForToast('Bill of materials saved successfully');
  }

  /**
   * Select BOM version
   */
  async selectVersion(version: string) {
    await this.versionSelector.selectOption(version);
    await this.waitForUniversalApiResponse('read');
  }

  /**
   * Create new BOM version
   */
  async createNewVersion() {
    await this.page.click('[data-testid="create-version-button"]');
    
    // Fill version details
    const versionName = `v${Date.now()}`;
    await this.page.fill('[data-testid="version-name-input"]', versionName);
    await this.page.fill('[data-testid="version-description-input"]', 'Test version');
    
    await this.page.click('[data-testid="create-version-confirm"]');
    await this.waitForUniversalApiResponse('create');
    
    return versionName;
  }

  /**
   * Import BOM from CSV
   */
  async importBOMFromCSV(filePath: string) {
    await this.page.click('[data-testid="import-bom-button"]');
    
    // Upload file
    const fileInput = this.page.locator('[data-testid="bom-file-input"]');
    await fileInput.setInputFiles(filePath);
    
    await this.page.click('[data-testid="import-confirm"]');
    await this.waitForUniversalApiResponse('batch_create');
  }

  /**
   * Export BOM to CSV
   */
  async exportBOM() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click('[data-testid="export-bom-button"]')
    ]);
    
    return download;
  }
}