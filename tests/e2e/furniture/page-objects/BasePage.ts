/**
 * Base Page Object for common functionality across all Furniture Module pages
 */

import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly navSidebar: Locator;
  readonly orgSwitcher: Locator;
  readonly profileMenu: Locator;
  readonly notificationBell: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navSidebar = page.locator('[data-testid="furniture-sidebar"]');
    this.orgSwitcher = page.locator('[data-testid="org-switcher"]');
    this.profileMenu = page.locator('[data-testid="profile-menu"]');
    this.notificationBell = page.locator('[data-testid="notification-bell"]');
    this.loadingSpinner = page.locator('.loading-spinner');
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.loadingSpinner.waitFor({ state: 'detached', timeout: 30000 });
  }

  /**
   * Navigate to a specific section via sidebar
   */
  async navigateViaFurnitureSidebar(section: string) {
    await this.navSidebar.locator(`[data-testid="nav-${section}"]`).click();
    await this.waitForPageLoad();
  }

  /**
   * Get the current page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.locator('h1').first().textContent() || '';
  }

  /**
   * Check if there are any error messages on the page
   */
  async hasErrors(): Promise<boolean> {
    return await this.page.locator('[data-testid="error-message"]').isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.page.locator('[data-testid="error-message"]').textContent() || '';
  }

  /**
   * Click the Save button (common across many pages)
   */
  async clickSave() {
    await this.page.click('[data-testid="save-button"]');
    await this.waitForPageLoad();
  }

  /**
   * Click the Cancel button (common across many pages)
   */
  async clickCancel() {
    await this.page.click('[data-testid="cancel-button"]');
  }

  /**
   * Wait for Universal API response
   */
  async waitForUniversalApiResponse(action: string) {
    await this.page.waitForResponse(
      response => response.url().includes('/api/v1/universal') && 
                 response.url().includes(`action=${action}`),
      { timeout: 30000 }
    );
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(message?: string) {
    const toast = this.page.locator('[role="alert"]');
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    
    if (message) {
      await this.page.waitForFunction(
        (expectedMessage) => {
          const toastElement = document.querySelector('[role="alert"]');
          return toastElement?.textContent?.includes(expectedMessage);
        },
        message
      );
    }
  }

  /**
   * Get current organization ID from context
   */
  async getCurrentOrganizationId(): Promise<string> {
    return await this.page.evaluate(() => {
      return localStorage.getItem('current_organization_id') || '';
    });
  }
}