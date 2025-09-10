/**
 * Dynamic field helpers for Furniture Module tests
 */

import { Page } from '@playwright/test';

export interface DynamicFieldValue {
  field_name: string;
  field_value_text?: string;
  field_value_number?: number;
  field_value_date?: string;
  field_value_boolean?: boolean;
}

export class DynamicFieldHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Fill dynamic field based on its type
   */
  async fillDynamicField(fieldName: string, value: any) {
    const fieldLocator = this.page.locator(`[data-dynamic-field="${fieldName}"]`);
    const fieldType = await fieldLocator.getAttribute('data-field-type');

    switch (fieldType) {
      case 'text':
        await fieldLocator.fill(String(value));
        break;
      
      case 'number':
        await fieldLocator.fill(String(value));
        break;
      
      case 'date':
        await fieldLocator.fill(value);
        break;
      
      case 'boolean':
      case 'checkbox':
        if (value) {
          await fieldLocator.check();
        } else {
          await fieldLocator.uncheck();
        }
        break;
      
      case 'select':
        await fieldLocator.selectOption(value);
        break;
      
      case 'textarea':
        await fieldLocator.fill(String(value));
        break;
      
      default:
        throw new Error(`Unknown field type: ${fieldType}`);
    }
  }

  /**
   * Get dynamic field value
   */
  async getDynamicFieldValue(fieldName: string): Promise<any> {
    const fieldLocator = this.page.locator(`[data-dynamic-field="${fieldName}"]`);
    const fieldType = await fieldLocator.getAttribute('data-field-type');

    switch (fieldType) {
      case 'text':
      case 'textarea':
        return await fieldLocator.inputValue();
      
      case 'number':
        const numValue = await fieldLocator.inputValue();
        return parseFloat(numValue);
      
      case 'date':
        return await fieldLocator.inputValue();
      
      case 'boolean':
      case 'checkbox':
        return await fieldLocator.isChecked();
      
      case 'select':
        return await fieldLocator.inputValue();
      
      default:
        throw new Error(`Unknown field type: ${fieldType}`);
    }
  }

  /**
   * Fill multiple dynamic fields
   */
  async fillDynamicFields(fields: Record<string, any>) {
    for (const [fieldName, value] of Object.entries(fields)) {
      await this.fillDynamicField(fieldName, value);
    }
  }

  /**
   * Get all dynamic field values
   */
  async getAllDynamicFieldValues(): Promise<Record<string, any>> {
    const fields = await this.page.locator('[data-dynamic-field]').all();
    const values: Record<string, any> = {};

    for (const field of fields) {
      const fieldName = await field.getAttribute('data-dynamic-field');
      if (fieldName) {
        values[fieldName] = await this.getDynamicFieldValue(fieldName);
      }
    }

    return values;
  }

  /**
   * Add new dynamic field
   */
  async addDynamicField(field: {
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea';
    label?: string;
    required?: boolean;
    defaultValue?: any;
    options?: string[]; // For select fields
  }) {
    // Click add field button
    await this.page.click('[data-testid="add-dynamic-field-button"]');
    
    // Fill field configuration
    await this.page.fill('[data-testid="field-name-input"]', field.name);
    await this.page.selectOption('[data-testid="field-type-select"]', field.type);
    
    if (field.label) {
      await this.page.fill('[data-testid="field-label-input"]', field.label);
    }
    
    if (field.required) {
      await this.page.check('[data-testid="field-required-checkbox"]');
    }
    
    if (field.defaultValue !== undefined) {
      await this.page.fill('[data-testid="field-default-value-input"]', String(field.defaultValue));
    }
    
    if (field.type === 'select' && field.options) {
      for (let i = 0; i < field.options.length; i++) {
        if (i > 0) {
          await this.page.click('[data-testid="add-option-button"]');
        }
        await this.page.fill(`[data-testid="option-${i}-input"]`, field.options[i]);
      }
    }
    
    // Save field
    await this.page.click('[data-testid="save-field-button"]');
    await this.page.waitForTimeout(500);
  }

  /**
   * Remove dynamic field
   */
  async removeDynamicField(fieldName: string) {
    const fieldRow = this.page.locator(`[data-field-row="${fieldName}"]`);
    await fieldRow.locator('[data-testid="remove-field-button"]').click();
    
    // Confirm removal
    await this.page.click('[data-testid="confirm-remove-field"]');
    await this.page.waitForTimeout(500);
  }

  /**
   * Validate dynamic field
   */
  async validateDynamicField(fieldName: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    const fieldLocator = this.page.locator(`[data-dynamic-field="${fieldName}"]`);
    const errorLocator = fieldLocator.locator('~ [data-field-error]');
    
    // Trigger validation
    await fieldLocator.blur();
    await this.page.waitForTimeout(200);
    
    const hasError = await errorLocator.isVisible();
    
    if (hasError) {
      const errorText = await errorLocator.textContent();
      return {
        valid: false,
        error: errorText || 'Validation error'
      };
    }
    
    return { valid: true };
  }

  /**
   * Check if dynamic field exists
   */
  async fieldExists(fieldName: string): Promise<boolean> {
    return await this.page.locator(`[data-dynamic-field="${fieldName}"]`).isVisible();
  }

  /**
   * Get field metadata
   */
  async getFieldMetadata(fieldName: string): Promise<{
    type: string;
    label: string;
    required: boolean;
    disabled: boolean;
  }> {
    const fieldLocator = this.page.locator(`[data-dynamic-field="${fieldName}"]`);
    const labelLocator = this.page.locator(`label[for="${fieldName}"]`);
    
    return {
      type: await fieldLocator.getAttribute('data-field-type') || '',
      label: await labelLocator.textContent() || '',
      required: await fieldLocator.getAttribute('required') !== null,
      disabled: await fieldLocator.isDisabled()
    };
  }

  /**
   * Toggle field visibility
   */
  async toggleFieldVisibility(fieldName: string, visible: boolean) {
    const toggleButton = this.page.locator(`[data-field-visibility-toggle="${fieldName}"]`);
    const currentState = await toggleButton.isChecked();
    
    if (currentState !== visible) {
      await toggleButton.click();
    }
  }

  /**
   * Export dynamic fields configuration
   */
  async exportFieldsConfig(): Promise<any[]> {
    await this.page.click('[data-testid="export-fields-config-button"]');
    
    // Wait for export data to be generated
    await this.page.waitForTimeout(500);
    
    // Get export data from page context
    return await this.page.evaluate(() => {
      return (window as any).__exportedFieldsConfig || [];
    });
  }

  /**
   * Import dynamic fields configuration
   */
  async importFieldsConfig(config: any[]) {
    await this.page.click('[data-testid="import-fields-config-button"]');
    
    // Set config data in page context
    await this.page.evaluate((configData) => {
      (window as any).__importFieldsConfig = configData;
    }, config);
    
    // Trigger import
    await this.page.click('[data-testid="confirm-import-button"]');
    await this.page.waitForTimeout(1000);
  }
}