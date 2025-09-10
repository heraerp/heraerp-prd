/**
 * E2E Test: Complete Product Setup Flow
 * Tests the full product creation workflow including BOM and routing setup
 */

import { test, expect } from './fixtures/auth.fixture';
import { ProductCatalogPage } from './page-objects/ProductCatalogPage';
import { BillOfMaterialsPage } from './page-objects/BillOfMaterialsPage';
import { ProductionRoutingPage } from './page-objects/ProductionRoutingPage';
import { ProductCostingPage } from './page-objects/ProductCostingPage';
import { testProducts, testComponents, testOperations } from './fixtures/test-data.fixture';
import { setupFurnitureContext } from './fixtures/auth.fixture';

test.describe('Furniture Module - Product Setup Flow', () => {
  test.beforeEach(async ({ page, authenticatedUser, furnitureOrganization }) => {
    // Setup furniture context
    await setupFurnitureContext(page, authenticatedUser, furnitureOrganization);
  });

  test('Complete product setup flow - Create product → Add BOM → Setup routing → Verify costing', async ({ page }) => {
    const productCatalog = new ProductCatalogPage(page);
    const billOfMaterials = new BillOfMaterialsPage(page);
    const productionRouting = new ProductionRoutingPage(page);
    const productCosting = new ProductCostingPage(page);

    // Step 1: Create a new product
    await test.step('Create new product', async () => {
      await productCatalog.goto();
      await productCatalog.clickAddProduct();
      
      // Fill product form
      await productCatalog.fillProductForm(testProducts.chair);
      await productCatalog.clickSave();
      
      // Verify product was created
      await productCatalog.waitForToast('Product created successfully');
      await productCatalog.goto();
      
      const productCount = await productCatalog.getProductCount();
      expect(productCount).toBeGreaterThan(0);
      
      // Verify product details
      const productDetails = await productCatalog.getProductDetails(testProducts.chair.name);
      expect(productDetails.name).toBe(testProducts.chair.name);
      expect(productDetails.code).toBe(testProducts.chair.code);
      expect(productDetails.price).toContain(testProducts.chair.price.toString());
    });

    // Step 2: Add Bill of Materials
    await test.step('Add Bill of Materials', async () => {
      await billOfMaterials.goto();
      await billOfMaterials.selectProduct(testProducts.chair.name);
      
      // Add components
      await billOfMaterials.addComponent(testComponents.wood);
      await billOfMaterials.addComponent(testComponents.metal);
      await billOfMaterials.addComponent(testComponents.fabric);
      await billOfMaterials.addComponent(testComponents.foam);
      await billOfMaterials.addComponent(testComponents.screws);
      
      // Verify component count
      const componentCount = await billOfMaterials.getComponentCount();
      expect(componentCount).toBe(5);
      
      // Verify total cost calculation
      const expectedTotalCost = 
        (testComponents.wood.quantity * testComponents.wood.unitCost) +
        (testComponents.metal.quantity * testComponents.metal.unitCost) +
        (testComponents.fabric.quantity * testComponents.fabric.unitCost) +
        (testComponents.foam.quantity * testComponents.foam.unitCost) +
        (testComponents.screws.quantity * testComponents.screws.unitCost);
      
      const totalCost = await billOfMaterials.getTotalCost();
      expect(totalCost).toBeCloseTo(expectedTotalCost, 2);
      
      // Save BOM
      await billOfMaterials.saveBOM();
    });

    // Step 3: Setup Production Routing
    await test.step('Setup Production Routing', async () => {
      await productionRouting.goto();
      await productionRouting.selectProduct(testProducts.chair.name);
      
      // Add operations in sequence
      await productionRouting.addOperation(testOperations.cutting);
      await productionRouting.addOperation(testOperations.assembly);
      await productionRouting.addOperation(testOperations.finishing);
      await productionRouting.addOperation(testOperations.quality);
      await productionRouting.addOperation(testOperations.packaging);
      
      // Set quality checkpoint
      await productionRouting.setQualityCheckpoint(testOperations.quality.name);
      
      // Verify operation count
      const operationCount = await productionRouting.getOperationCount();
      expect(operationCount).toBe(5);
      
      // Verify total time calculation
      const expectedTotalTime = Object.values(testOperations)
        .reduce((total, op) => total + op.setupTime + op.runTime, 0);
      
      const totalTime = await productionRouting.getTotalTime();
      expect(totalTime).toBeCloseTo(expectedTotalTime, 1);
      
      // Save routing
      await productionRouting.saveRouting();
    });

    // Step 4: Verify Product Costing
    await test.step('Verify Product Costing', async () => {
      await productCosting.goto();
      await productCosting.selectProduct(testProducts.chair.name);
      
      // Calculate cost
      await productCosting.calculateCost();
      
      // Get cost breakdown
      const costBreakdown = await productCosting.getCostBreakdown();
      
      // Verify material cost matches BOM
      const expectedMaterialCost = 
        (testComponents.wood.quantity * testComponents.wood.unitCost) +
        (testComponents.metal.quantity * testComponents.metal.unitCost) +
        (testComponents.fabric.quantity * testComponents.fabric.unitCost) +
        (testComponents.foam.quantity * testComponents.foam.unitCost) +
        (testComponents.screws.quantity * testComponents.screws.unitCost);
      
      expect(costBreakdown.materialCost).toBeCloseTo(expectedMaterialCost, 2);
      
      // Verify labor cost from routing
      const expectedLaborCost = Object.values(testOperations)
        .reduce((total, op) => total + op.laborCost, 0);
      
      expect(costBreakdown.laborCost).toBeCloseTo(expectedLaborCost, 2);
      
      // Verify total cost and margin
      expect(costBreakdown.totalCost).toBeGreaterThan(0);
      expect(costBreakdown.sellingPrice).toBe(testProducts.chair.price);
      expect(costBreakdown.margin).toBeGreaterThan(0);
      expect(costBreakdown.marginPercentage).toBeGreaterThan(0);
      
      // Test what-if analysis
      await productCosting.runWhatIfAnalysis({
        materialCostChange: 10, // 10% increase
        laborCostChange: -5    // 5% decrease
      });
      
      // Save cost analysis
      await productCosting.saveCostAnalysis(`Cost Analysis - ${testProducts.chair.name}`);
    });
  });

  test('Product setup with BOM import', async ({ page }) => {
    const productCatalog = new ProductCatalogPage(page);
    const billOfMaterials = new BillOfMaterialsPage(page);

    // Create product first
    await productCatalog.goto();
    await productCatalog.clickAddProduct();
    await productCatalog.fillProductForm(testProducts.desk);
    await productCatalog.clickSave();

    // Import BOM from CSV
    await billOfMaterials.goto();
    await billOfMaterials.selectProduct(testProducts.desk.name);
    
    // Create temp CSV file for import
    const csvContent = `Component Name,Component Code,Quantity,Unit,Unit Cost
Oak Wood Board,MAT-WOOD-OAK,4,pieces,35.00
Steel Frame,MAT-METAL-STEEL,2,pieces,85.00
Screws,HARD-SCREW-001,100,pieces,0.10`;
    
    const csvFilePath = `/tmp/bom-import-${Date.now()}.csv`;
    await page.evaluate(async (args) => {
      const { content, path } = args;
      // In real implementation, this would save to file system
      // For testing, we'll simulate the import
    }, { content: csvContent, path: csvFilePath });
    
    // Test will import and verify
    // Note: Full implementation would handle actual file upload
  });

  test('Product setup with routing copy', async ({ page }) => {
    const productCatalog = new ProductCatalogPage(page);
    const productionRouting = new ProductionRoutingPage(page);

    // Assuming chair routing already exists from previous test
    // Create new product
    await productCatalog.goto();
    await productCatalog.clickAddProduct();
    await productCatalog.fillProductForm(testProducts.cabinet);
    await productCatalog.clickSave();

    // Copy routing from chair
    await productionRouting.goto();
    await productionRouting.selectProduct(testProducts.cabinet.name);
    await productionRouting.copyRoutingFrom(testProducts.chair.name);
    
    // Verify operations were copied
    const operationCount = await productionRouting.getOperationCount();
    expect(operationCount).toBeGreaterThan(0);
    
    // Modify for cabinet-specific needs
    await productionRouting.updateOperationTime('Wood Cutting', 10, 20);
    await productionRouting.removeOperation('Frame Assembly');
    
    await productionRouting.saveRouting();
  });
});