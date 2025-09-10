/**
 * Page Object Model for Product Catalog page
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductCatalogPage extends BasePage {
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly addProductButton: Locator;
  readonly productTable: Locator;
  readonly productRows: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('[data-testid="product-search-input"]');
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
    this.addProductButton = page.locator('[data-testid="add-product-button"]');
    this.productTable = page.locator('[data-testid="products-table"]');
    this.productRows = this.productTable.locator('tbody tr');
  }

  /**
   * Navigate to Product Catalog page
   */
  async goto() {
    await this.page.goto('/furniture/products/catalog');
    await this.waitForPageLoad();
  }

  /**
   * Search for products
   */
  async searchProducts(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForUniversalApiResponse('read');
  }

  /**
   * Filter by category
   */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.waitForUniversalApiResponse('read');
  }

  /**
   * Click Add Product button
   */
  async clickAddProduct() {
    await this.addProductButton.click();
    await this.page.waitForURL('**/furniture/products/new');
  }

  /**
   * Get number of products displayed
   */
  async getProductCount(): Promise<number> {
    return await this.productRows.count();
  }

  /**
   * Click on a specific product by name
   */
  async clickProduct(productName: string) {
    await this.productRows
      .filter({ hasText: productName })
      .first()
      .click();
    await this.waitForPageLoad();
  }

  /**
   * Get product details from table row
   */
  async getProductDetails(productName: string): Promise<{
    name: string;
    code: string;
    category: string;
    price: string;
    status: string;
  }> {
    const row = this.productRows.filter({ hasText: productName }).first();
    
    return {
      name: await row.locator('[data-testid="product-name"]').textContent() || '',
      code: await row.locator('[data-testid="product-code"]').textContent() || '',
      category: await row.locator('[data-testid="product-category"]').textContent() || '',
      price: await row.locator('[data-testid="product-price"]').textContent() || '',
      status: await row.locator('[data-testid="product-status"]').textContent() || ''
    };
  }

  /**
   * Edit a product
   */
  async editProduct(productName: string) {
    const row = this.productRows.filter({ hasText: productName }).first();
    await row.locator('[data-testid="edit-button"]').click();
    await this.waitForPageLoad();
  }

  /**
   * Delete a product
   */
  async deleteProduct(productName: string) {
    const row = this.productRows.filter({ hasText: productName }).first();
    await row.locator('[data-testid="delete-button"]').click();
    
    // Handle confirmation dialog
    await this.page.locator('[data-testid="confirm-delete"]').click();
    await this.waitForUniversalApiResponse('delete');
  }

  /**
   * Fill product form
   */
  async fillProductForm(product: {
    name: string;
    code: string;
    category: string;
    description?: string;
    price: number;
    cost?: number;
    sku?: string;
  }) {
    await this.page.fill('[data-testid="product-name-input"]', product.name);
    await this.page.fill('[data-testid="product-code-input"]', product.code);
    await this.page.selectOption('[data-testid="product-category-select"]', product.category);
    
    if (product.description) {
      await this.page.fill('[data-testid="product-description-input"]', product.description);
    }
    
    await this.page.fill('[data-testid="product-price-input"]', product.price.toString());
    
    if (product.cost) {
      await this.page.fill('[data-testid="product-cost-input"]', product.cost.toString());
    }
    
    if (product.sku) {
      await this.page.fill('[data-testid="product-sku-input"]', product.sku);
    }
  }
}