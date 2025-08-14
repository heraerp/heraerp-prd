#!/usr/bin/env node

/**
 * HERA Universal CRUD Fixer
 * Automatically fixes CRUD functionality and missing API endpoints for modules
 * 
 * Usage: node scripts/universal-crud-fixer.js [module-path]
 * Example: node scripts/universal-crud-fixer.js financial/budgets
 */

const fs = require('fs');
const path = require('path');
const { UniversalQualityChecker } = require('./universal-quality-checker');

class UniversalCRUDFixer {
  constructor() {
    this.srcPath = path.join(__dirname, '../src');
    this.appPath = path.join(this.srcPath, 'app');
    this.apiPath = path.join(this.appPath, 'api', 'v1');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async fixModule(modulePath) {
    this.log(`🔧 Fixing CRUD functionality for: ${modulePath}`, 'info');
    
    const fullPath = path.join(this.appPath, modulePath);
    
    // Check if module exists
    if (!fs.existsSync(fullPath)) {
      this.log(`❌ Module path does not exist: ${fullPath}`, 'error');
      return false;
    }

    const fixes = [];
    
    try {
      // Fix API endpoints
      const apiFixed = await this.fixAPIEndpoints(modulePath);
      if (apiFixed) fixes.push('API endpoints');
      
      // Fix CRUD operations in component
      const crudFixed = await this.fixCRUDOperations(fullPath, modulePath);
      if (crudFixed) fixes.push('CRUD operations');
      
      // Fix navigation integration
      const navFixed = await this.fixNavigationIntegration(modulePath);
      if (navFixed) fixes.push('Navigation integration');
      
      // Fix form handling
      const formFixed = await this.fixFormHandling(fullPath);
      if (formFixed) fixes.push('Form handling');
      
      this.log(`✅ Successfully applied ${fixes.length} fixes: ${fixes.join(', ')}`, 'success');
      
      // Run quality check to verify fixes
      this.log('🔍 Running post-fix quality check...', 'info');
      const checker = new UniversalQualityChecker();
      const result = await checker.checkModule(modulePath);
      
      this.log(`📊 Post-fix quality grade: ${result.grade} (${result.successRate}%)`, 
        result.grade.includes('A') ? 'success' : result.grade.includes('B') ? 'warning' : 'error');
      
      return fixes.length > 0;
      
    } catch (error) {
      this.log(`❌ Error fixing module: ${error.message}`, 'error');
      return false;
    }
  }

  async fixAPIEndpoints(modulePath) {
    this.log('🌐 Fixing API endpoints...', 'info');
    
    const moduleNameParts = modulePath.split('/');
    const moduleName = moduleNameParts[moduleNameParts.length - 1];
    const category = moduleNameParts.length > 1 ? moduleNameParts[0] : 'general';
    
    // Create API route path
    const apiRoutePath = path.join(this.apiPath, modulePath, 'route.ts');
    const apiRouteDir = path.dirname(apiRoutePath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(apiRouteDir)) {
      fs.mkdirSync(apiRouteDir, { recursive: true });
      this.log(`📁 Created API directory: ${apiRouteDir}`, 'success');
    }
    
    // Check if API route already exists
    if (fs.existsSync(apiRoutePath)) {
      this.log(`ℹ️ API route already exists: ${apiRoutePath}`, 'info');
      return false;
    }
    
    // Generate API route content
    const apiContent = this.generateAPIRouteContent(moduleName, category);
    
    try {
      fs.writeFileSync(apiRoutePath, apiContent, 'utf8');
      this.log(`✅ Created API route: ${apiRoutePath}`, 'success');
      return true;
    } catch (error) {
      this.log(`❌ Failed to create API route: ${error.message}`, 'error');
      return false;
    }
  }

  generateAPIRouteContent(moduleName, category) {
    return `import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const organizationId = searchParams.get('organization_id')
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    switch (action) {
      case 'list':
        const entities = await universalApi.getEntities({
          entity_type: '${moduleName}',
          limit: parseInt(searchParams.get('limit') || '50'),
          offset: parseInt(searchParams.get('offset') || '0')
        })
        return NextResponse.json({ success: true, data: entities })

      case 'get':
        const entityId = searchParams.get('id')
        if (!entityId) {
          return NextResponse.json({ error: 'Entity ID is required' }, { status: 400 })
        }
        
        const entity = await universalApi.getEntity(entityId)
        return NextResponse.json({ success: true, data: entity })

      case 'stats':
        const stats = await this.calculateStats(organizationId)
        return NextResponse.json({ success: true, data: stats })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('${moduleName.toUpperCase()} API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data, organizationId } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    switch (action) {
      case 'create':
        if (!data) {
          return NextResponse.json({ error: 'Data is required' }, { status: 400 })
        }

        const newEntity = await universalApi.createEntity({
          entity_type: '${moduleName}',
          entity_name: data.name || data.title || \`New \${moduleName}\`,
          entity_code: data.code || \`\${moduleName.toUpperCase()}-\${Date.now()}\`,
          organization_id: organizationId,
          status: 'active',
          ...data
        })

        // Add dynamic data fields
        if (data.customFields) {
          for (const [key, value] of Object.entries(data.customFields)) {
            await universalApi.setDynamicField(newEntity.id, key, value)
          }
        }

        return NextResponse.json({ success: true, data: newEntity })

      case 'validate':
        const validation = await this.validateData(data)
        return NextResponse.json({ success: true, data: validation })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('${moduleName.toUpperCase()} API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, data, organizationId } = body

    if (!id || !data || !organizationId) {
      return NextResponse.json({ error: 'ID, data, and organization ID are required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    const updatedEntity = await universalApi.updateEntity(id, {
      ...data,
      updated_at: new Date().toISOString()
    })

    // Update dynamic data fields
    if (data.customFields) {
      for (const [key, value] of Object.entries(data.customFields)) {
        await universalApi.setDynamicField(id, key, value)
      }
    }

    return NextResponse.json({ success: true, data: updatedEntity })
  } catch (error) {
    console.error('${moduleName.toUpperCase()} API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const organizationId = searchParams.get('organization_id')

    if (!id || !organizationId) {
      return NextResponse.json({ error: 'ID and organization ID are required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    // Soft delete by updating status
    const deletedEntity = await universalApi.updateEntity(id, {
      status: 'deleted',
      deleted_at: new Date().toISOString()
    })

    return NextResponse.json({ success: true, data: deletedEntity })
  } catch (error) {
    console.error('${moduleName.toUpperCase()} API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

async function calculateStats(organizationId: string) {
  try {
    universalApi.setOrganizationId(organizationId)
    
    const entities = await universalApi.getEntities({
      entity_type: '${moduleName}',
      limit: 1000
    })

    const stats = {
      total: entities.length,
      active: entities.filter(e => e.status === 'active').length,
      inactive: entities.filter(e => e.status === 'inactive').length,
      recent: entities.filter(e => {
        const createdAt = new Date(e.created_at)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return createdAt > weekAgo
      }).length
    }

    return stats
  } catch (error) {
    console.error('Stats calculation error:', error)
    return { total: 0, active: 0, inactive: 0, recent: 0 }
  }
}

async function validateData(data: any) {
  const errors: string[] = []
  
  if (!data.name && !data.title) {
    errors.push('Name or title is required')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}`
  }

  async fixCRUDOperations(fullPath, modulePath) {
    this.log('🔧 Fixing CRUD operations...', 'info');
    
    const pagePath = path.join(fullPath, 'page.tsx');
    if (!fs.existsSync(pagePath)) {
      this.log(`❌ Page component not found: ${pagePath}`, 'error');
      return false;
    }

    let content = fs.readFileSync(pagePath, 'utf8');
    let modified = false;

    // Add missing CRUD functions if not present
    const crudFunctions = this.generateCRUDFunctions(modulePath);
    
    // Check if CRUD functions already exist
    if (!content.includes('loadData') || !content.includes('handleCreate') || !content.includes('handleUpdate') || !content.includes('handleDelete')) {
      // Find the component function and add CRUD functions before the return statement
      const componentFunctionMatch = content.match(/(export default function \w+\(\)[^{]*{)/);
      if (componentFunctionMatch) {
        const insertPosition = content.indexOf(componentFunctionMatch[1]) + componentFunctionMatch[1].length;
        
        // Insert CRUD functions after component function declaration
        const beforeReturn = content.substring(0, insertPosition);
        const afterReturn = content.substring(insertPosition);
        
        content = beforeReturn + '\n' + crudFunctions + '\n' + afterReturn;
        modified = true;
        this.log('✅ Added CRUD functions to component', 'success');
      }
    }

    // Add form handling if missing
    if (!content.includes('onSubmit') && !content.includes('handleSubmit')) {
      const formHandling = this.generateFormHandling();
      
      // Find the return statement and add form before it
      const returnMatch = content.match(/(return \()/);
      if (returnMatch) {
        const insertPosition = content.indexOf(returnMatch[1]);
        const beforeReturn = content.substring(0, insertPosition);
        const afterReturn = content.substring(insertPosition);
        
        content = beforeReturn + formHandling + '\n  ' + afterReturn;
        modified = true;
        this.log('✅ Added form handling to component', 'success');
      }
    }

    if (modified) {
      try {
        fs.writeFileSync(pagePath, content, 'utf8');
        this.log(`✅ Updated component: ${pagePath}`, 'success');
        return true;
      } catch (error) {
        this.log(`❌ Failed to update component: ${error.message}`, 'error');
        return false;
      }
    }

    return false;
  }

  generateCRUDFunctions(modulePath) {
    const moduleName = modulePath.split('/').pop();
    
    return `
  // CRUD Operations - Auto-generated by Universal CRUD Fixer
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(\`/api/v1/\${modulePath}?action=list&organization_id=\${organizationId}\`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        console.error('Failed to load data:', result.error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      const response = await fetch(\`/api/v1/\${modulePath}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: formData,
          organizationId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadData(); // Refresh data
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Create error:', error);
      throw error;
    }
  };

  const handleUpdate = async (id: string, formData: any) => {
    try {
      const response = await fetch(\`/api/v1/\${modulePath}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          data: formData,
          organizationId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadData(); // Refresh data
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(\`/api/v1/\${modulePath}?id=\${id}&organization_id=\${organizationId}\`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadData(); // Refresh data
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  };

  // Auto-load data on component mount
  useEffect(() => {
    if (organizationId) {
      loadData();
    }
  }, [organizationId]);`;
  }

  generateFormHandling() {
    return `
  // Form Handling - Auto-generated by Universal CRUD Fixer
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (selectedItem?.id) {
        await handleUpdate(selectedItem.id, formData);
      } else {
        await handleCreate(formData);
      }
      
      setFormData({});
      setSelectedItem(null);
      setShowDialog(false);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };`;
  }

  async fixNavigationIntegration(modulePath) {
    this.log('🧭 Fixing navigation integration...', 'info');
    
    // Find the appropriate layout file to update
    const layoutFiles = [
      path.join(this.appPath, 'financial', 'layout.tsx'),
      path.join(this.srcPath, 'components', 'layout', 'AppSidebar.tsx')
    ];
    
    let fixed = false;
    
    for (const layoutFile of layoutFiles) {
      if (fs.existsSync(layoutFile)) {
        let content = fs.readFileSync(layoutFile, 'utf8');
        
        // Check if navigation already exists
        if (content.includes(`/${modulePath}`) || content.includes(modulePath)) {
          continue;
        }
        
        // Add navigation link
        const navigationLink = this.generateNavigationLink(modulePath);
        
        // Try to find existing navigation section and add to it
        if (content.includes('<nav') || content.includes('navigation')) {
          // Find a good insertion point
          const linkPattern = /<Link[^>]*href="\/financial\/[^"]*"[^>]*>/;
          const match = content.match(linkPattern);
          
          if (match) {
            const insertPosition = content.indexOf(match[0]) + match[0].length;
            const beforeInsert = content.substring(0, insertPosition);
            const afterInsert = content.substring(insertPosition);
            
            // Find the end of the current link and insert after it
            const endOfLink = afterInsert.indexOf('</Link>') + '</Link>'.length;
            const newContent = beforeInsert + afterInsert.substring(0, endOfLink) + '\n' + navigationLink + afterInsert.substring(endOfLink);
            
            try {
              fs.writeFileSync(layoutFile, newContent, 'utf8');
              this.log(`✅ Added navigation link to: ${layoutFile}`, 'success');
              fixed = true;
              break;
            } catch (error) {
              this.log(`❌ Failed to update navigation: ${error.message}`, 'error');
            }
          }
        }
      }
    }
    
    return fixed;
  }

  generateNavigationLink(modulePath) {
    const parts = modulePath.split('/');
    const displayName = parts[parts.length - 1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return `          <Link
            href="/${modulePath}"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900"
          >
            <Calculator className="h-4 w-4" />
            ${displayName}
          </Link>`;
  }

  async fixFormHandling(fullPath) {
    this.log('📝 Fixing form handling...', 'info');
    // Form handling fixes are included in the CRUD operations fix
    return false; // Already handled in fixCRUDOperations
  }

  // Static method to fix all financial modules
  static async fixAllFinancialModules() {
    const fixer = new UniversalCRUDFixer();
    const financialModules = [
      'financial/gl',
      'financial/ap', 
      'financial/ar',
      'financial/fixed-assets',
      'financial/banks',
      'financial/budgets'
    ];
    
    const results = [];
    
    for (const module of financialModules) {
      fixer.log(`\n🔧 Fixing ${module}...`, 'info');
      const result = await fixer.fixModule(module);
      results.push({ module, fixed: result });
    }
    
    // Generate summary
    fixer.log('\n📊 CRUD FIXING RESULTS', 'info');
    fixer.log('═════════════════════════════════════', 'info');
    
    results.forEach(result => {
      const status = result.fixed ? '✅' : '➖';
      fixer.log(`${status} ${result.module}: ${result.fixed ? 'FIXED' : 'NO CHANGES NEEDED'}`, 
        result.fixed ? 'success' : 'info');
    });
    
    const totalFixed = results.filter(r => r.fixed).length;
    fixer.log(`\n🎯 Summary: ${totalFixed}/${results.length} modules had fixes applied`, 
      totalFixed > 0 ? 'success' : 'info');
    
    return results;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const fixer = new UniversalCRUDFixer();
  
  if (args[0] === '--all-financial') {
    UniversalCRUDFixer.fixAllFinancialModules()
      .then(results => {
        const totalFixed = results.filter(r => r.fixed).length;
        process.exit(totalFixed > 0 ? 0 : 1);
      })
      .catch(error => {
        fixer.log(`Error: ${error.message}`, 'error');
        process.exit(1);
      });
  } else if (args[0]) {
    fixer.fixModule(args[0])
      .then(result => {
        process.exit(result ? 0 : 1);
      })
      .catch(error => {
        fixer.log(`Error: ${error.message}`, 'error');
        process.exit(1);
      });
  } else {
    fixer.log('Usage: node scripts/universal-crud-fixer.js <module-path>', 'info');
    fixer.log('       node scripts/universal-crud-fixer.js --all-financial', 'info');
    fixer.log('Example: node scripts/universal-crud-fixer.js financial/budgets', 'info');
  }
}

module.exports = { UniversalCRUDFixer };