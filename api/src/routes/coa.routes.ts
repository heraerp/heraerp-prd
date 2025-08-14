// Universal Chart of Accounts Routes
// Express.js routes for COA management endpoints

import { Router } from 'express';
import { UniversalCOAController } from '../controllers/universal-coa.controller';
import { UniversalCOAService } from '../services/universal-coa.service';
import { DatabaseService } from '../services/database.service';
import { authenticateToken, requireOrganization } from '../middleware/auth.middleware';
import { validateCOABuildRequest, validateAddAccountsRequest } from '../middleware/validation.middleware';
import { rateLimitCOA, rateLimitBuild } from '../middleware/rate-limit.middleware';
import { 
  buildCOASchema, 
  addAccountsSchema, 
  updateAccountSchema 
} from '../validators/coa.validators';

// Initialize services and controller
const databaseService = new DatabaseService();
const coaService = new UniversalCOAService(databaseService);
const coaController = new UniversalCOAController(coaService);

const router = Router();

// Apply authentication middleware to all routes
router.use('/', authenticateToken);
router.use('/', requireOrganization);

// Apply rate limiting
router.use(rateLimitCOA);

/**
 * Template Management Routes
 */

// GET /api/v1/coa/templates/countries
// Get available country templates
router.get('/templates/countries', coaController.getAvailableCountries);

// GET /api/v1/coa/templates/industries  
// Get available industry templates
router.get('/templates/industries', coaController.getAvailableIndustries);

// GET /api/v1/coa/templates/options
// Get all available template options
router.get('/templates/options', coaController.getTemplateOptions);

// GET /api/v1/coa/templates/preview
// Preview COA structure before building
// Query params: ?country=india&industry=restaurant
router.get('/templates/preview', coaController.previewCOAStructure);

/**
 * COA Management Routes
 */

// POST /api/v1/coa/build
// Build customized COA for organization
router.post('/build', 
  validateCOABuildRequest,
  coaController.buildCustomizedCOA
);

// GET /api/v1/coa/structure/:organizationId
// Get COA structure for organization
// Query params: ?include_metadata=true
router.get('/structure/:organizationId', coaController.getCOAStructure);

// POST /api/v1/coa/customize
// Add custom accounts to existing COA
router.post('/customize',
  validateAddAccountsRequest,
  coaController.addCustomAccounts
);

/**
 * Account Management Routes
 */

// GET /api/v1/coa/accounts/layer/:organizationId/:layer
// Get accounts by template layer
router.get('/accounts/layer/:organizationId/:layer', coaController.getAccountsByLayer);

// PUT /api/v1/coa/account/:organizationId/:accountCode/name
// Update account name
router.put('/account/:organizationId/:accountCode/name',
  validateAddAccountsRequest,
  coaController.updateAccountName
);

// DELETE /api/v1/coa/account/:organizationId/:accountCode
// Delete custom account (only custom accounts can be deleted)
router.delete('/account/:organizationId/:accountCode', coaController.deleteCustomAccount);

/**
 * Health Check Route
 */

// GET /api/v1/coa/health
// Health check endpoint for COA service
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await databaseService.query('SELECT 1');
    
    res.json({
      success: true,
      service: 'Universal COA Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'Universal COA Service',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware (must be last)
router.use(coaController.handleError);

export { router as coaRoutes };

// Export individual route handlers for testing
export {
  coaController,
  coaService,
  databaseService
};