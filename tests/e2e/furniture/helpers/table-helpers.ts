/**
 * Table interaction helpers for Furniture Module tests
 */

import { Page, Locator } from '@playwright/test';

export interface TableColumn {
  key: string;
  header: string;
  index: number;
}

export class TableHelper {
  private page: Page;
  private tableLocator: Locator;
  private columns: Map<string, TableColumn>;

  constructor(page: Page, tableSelector: string) {
    this.page = page;
    this.tableLocator = page.locator(tableSelector);
    this.columns = new Map();
  }

  /**
   * Initialize table columns
   */
  async initialize() {
    const headers = await this.tableLocator.locator('thead th').allTextContents();
    
    headers.forEach((header, index) => {
      const key = header.toLowerCase().replace(/\s+/g, '_');
      this.columns.set(key, {
        key,
        header,
        index
      });
    });
  }

  /**
   * Get all rows data
   */
  async getAllRows(): Promise<any[]> {
    const rows = await this.tableLocator.locator('tbody tr').all();
    const data = [];

    for (const row of rows) {
      const rowData: any = {};
      const cells = await row.locator('td').all();

      for (const [key, column] of this.columns) {
        if (cells[column.index]) {
          rowData[key] = await cells[column.index].textContent() || '';
        }
      }

      data.push(rowData);
    }

    return data;
  }

  /**
   * Find row by column value
   */
  async findRow(columnKey: string, value: string): Promise<Locator | null> {
    const column = this.columns.get(columnKey);
    if (!column) {
      throw new Error(`Column ${columnKey} not found`);
    }

    const rows = await this.tableLocator.locator('tbody tr').all();
    
    for (const row of rows) {
      const cells = await row.locator('td').all();
      const cellText = await cells[column.index]?.textContent();
      
      if (cellText?.includes(value)) {
        return row;
      }
    }

    return null;
  }

  /**
   * Click action button in row
   */
  async clickRowAction(columnKey: string, value: string, action: string) {
    const row = await this.findRow(columnKey, value);
    if (!row) {
      throw new Error(`Row with ${columnKey}="${value}" not found`);
    }

    await row.locator(`[data-testid="${action}-button"]`).click();
  }

  /**
   * Get cell value
   */
  async getCellValue(rowIndex: number, columnKey: string): Promise<string> {
    const column = this.columns.get(columnKey);
    if (!column) {
      throw new Error(`Column ${columnKey} not found`);
    }

    const cell = this.tableLocator
      .locator('tbody tr')
      .nth(rowIndex)
      .locator('td')
      .nth(column.index);

    return await cell.textContent() || '';
  }

  /**
   * Sort by column
   */
  async sortByColumn(columnKey: string, direction: 'asc' | 'desc' = 'asc') {
    const column = this.columns.get(columnKey);
    if (!column) {
      throw new Error(`Column ${columnKey} not found`);
    }

    const header = this.tableLocator
      .locator('thead th')
      .nth(column.index);

    // Click to sort
    await header.click();
    
    // Check current sort direction and click again if needed
    const currentSort = await header.getAttribute('data-sort');
    if (currentSort !== direction) {
      await header.click();
    }

    // Wait for table to re-render
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter table
   */
  async applyFilter(filterSelector: string, value: string) {
    const filterInput = this.page.locator(filterSelector);
    await filterInput.fill(value);
    await filterInput.press('Enter');
    
    // Wait for filtered results
    await this.page.waitForTimeout(1000);
  }

  /**
   * Select rows with checkbox
   */
  async selectRows(indices: number[]) {
    for (const index of indices) {
      const checkbox = this.tableLocator
        .locator('tbody tr')
        .nth(index)
        .locator('input[type="checkbox"]');
      
      await checkbox.check();
    }
  }

  /**
   * Get row count
   */
  async getRowCount(): Promise<number> {
    return await this.tableLocator.locator('tbody tr').count();
  }

  /**
   * Check if table is empty
   */
  async isEmpty(): Promise<boolean> {
    const emptyMessage = await this.tableLocator.locator('[data-testid="empty-table-message"]').isVisible();
    return emptyMessage || (await this.getRowCount()) === 0;
  }

  /**
   * Wait for table to load
   */
  async waitForLoad() {
    // Wait for loading indicator to disappear
    await this.page.waitForSelector('[data-testid="table-loading"]', { state: 'detached' });
    
    // Wait for at least one row or empty message
    await this.page.waitForSelector(
      `${this.tableLocator.selector} tbody tr, [data-testid="empty-table-message"]`
    );
  }

  /**
   * Export table data
   */
  async exportData(format: 'csv' | 'excel' | 'pdf') {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click(`[data-testid="export-${format}-button"]`)
    ]);
    
    return download;
  }

  /**
   * Get pagination info
   */
  async getPaginationInfo(): Promise<{
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  }> {
    const paginationText = await this.page.locator('[data-testid="pagination-info"]').textContent() || '';
    
    // Parse "Showing 1-10 of 100 items"
    const match = paginationText.match(/Showing (\d+)-(\d+) of (\d+) items/);
    if (!match) {
      throw new Error('Could not parse pagination info');
    }

    const [, start, end, total] = match.map(Number);
    const pageSize = end - start + 1;
    const currentPage = Math.ceil(start / pageSize);
    const totalPages = Math.ceil(total / pageSize);

    return {
      currentPage,
      totalPages,
      pageSize,
      totalItems: total
    };
  }

  /**
   * Navigate to page
   */
  async goToPage(pageNumber: number) {
    await this.page.click(`[data-testid="page-${pageNumber}"]`);
    await this.waitForLoad();
  }

  /**
   * Go to next page
   */
  async nextPage() {
    await this.page.click('[data-testid="next-page-button"]');
    await this.waitForLoad();
  }

  /**
   * Go to previous page
   */
  async previousPage() {
    await this.page.click('[data-testid="prev-page-button"]');
    await this.waitForLoad();
  }
}