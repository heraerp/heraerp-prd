// Helper script to add new DNA patterns to the system
// Usage: node scripts/add-dna-pattern.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Example: Add a new Glass Card component
async function addGlassCardComponent() {
  console.log('🧬 Adding new Glass Card component to DNA system...\n')
  
  try {
    // Get DNA organization
    const { data: dnaOrg } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('organization_code', 'HERA-DNA-SYS')
      .single()
    
    if (!dnaOrg) throw new Error('DNA organization not found')
    
    // Create component entity
    const { data: component, error: componentError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: dnaOrg.id,
        entity_type: 'ui_component_dna',
        entity_name: 'Glass Card Component',
        entity_description: 'Modern card with glassmorphism effects and hover animations',
        smart_code: 'HERA.UI.GLASS.CARD.v1',
        metadata: {
          component_type: 'container',
          design_system: 'glassmorphism',
          framework: 'react',
          responsive: true,
          accessibility: 'wcag_2.1'
        },
        status: 'active'
      })
      .select()
      .single()
    
    if (componentError) throw componentError
    console.log('✅ Glass Card component entity created')
    
    // Add CSS DNA
    const { error: cssError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: dnaOrg.id,
        entity_id: component.id,
        field_name: 'css_dna',
        field_type: 'json',
        field_value_json: {
          base_styles: {
            background: 'rgba(255, 255, 255, 0.08)',
            backdrop_filter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            border_radius: '20px',
            padding: '2rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          },
          hover_styles: {
            transform: 'translateY(-4px) scale(1.02)',
            box_shadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            background: 'rgba(255, 255, 255, 0.12)'
          },
          click_animation: {
            transform: 'scale(0.98)',
            transition: 'transform 0.1s ease-out'
          }
        },
        smart_code: 'HERA.DNA.CSS.GLASS.CARD.v1'
      })
    
    if (cssError) throw cssError
    console.log('✅ CSS DNA stored')
    
    // Add React component DNA
    const { error: reactError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: dnaOrg.id,
        entity_id: component.id,
        field_name: 'react_component_dna',
        field_type: 'json',
        field_value_json: {
          component_code: `
export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  title, 
  subtitle, 
  icon: Icon, 
  onClick, 
  className = "" 
}) => {
  return (
    <div 
      className={cn("glass-card", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {(title || Icon) && (
        <div className="glass-card-header">
          {Icon && <Icon className="w-5 h-5" />}
          {title && <h3 className="glass-card-title">{title}</h3>}
        </div>
      )}
      {subtitle && <p className="glass-card-subtitle">{subtitle}</p>}
      <div className="glass-card-content">{children}</div>
    </div>
  )
}`,
          props_interface: `
interface GlassCardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  onClick?: () => void
  className?: string
}`,
          usage_examples: [
            '<GlassCard title="Sales Today" subtitle="$5,420">Chart content</GlassCard>',
            '<GlassCard icon={ShoppingCart} onClick={handleClick}>Clickable card</GlassCard>'
          ]
        },
        smart_code: 'HERA.DNA.REACT.GLASS.CARD.v1'
      })
    
    if (reactError) throw reactError
    console.log('✅ React component DNA stored')
    
    // Add business context examples
    const { error: examplesError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: dnaOrg.id,
        entity_id: component.id,
        field_name: 'business_examples',
        field_type: 'json',
        field_value_json: {
          restaurant: '<GlassCard title="Popular Items" icon={TrendingUp}><PopularMenuItems /></GlassCard>',
          healthcare: '<GlassCard title="Patient Queue" subtitle="12 waiting"><PatientList /></GlassCard>',
          retail: '<GlassCard title="Low Stock Alert" icon={AlertCircle}><LowStockItems /></GlassCard>',
          manufacturing: '<GlassCard title="Production Status"><ProductionMetrics /></GlassCard>'
        },
        smart_code: 'HERA.DNA.EXAMPLES.GLASS.CARD.v1'
      })
    
    if (examplesError) throw examplesError
    console.log('✅ Business examples stored')
    
    console.log('\n🎉 Glass Card component successfully added to DNA system!')
    console.log('Smart Code: HERA.UI.GLASS.CARD.v1')
    console.log('\nTo use this component:')
    console.log('SELECT claude_get_component_dna(\'HERA.UI.GLASS.CARD.v1\');')
    
  } catch (error) {
    console.error('❌ Failed to add component:', error.message)
  }
}

// Example: Add a new business pattern
async function addCustomerLoyaltyModule() {
  console.log('\n🧬 Adding Customer Loyalty module to DNA system...\n')
  
  try {
    // Get DNA organization
    const { data: dnaOrg } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('organization_code', 'HERA-DNA-SYS')
      .single()
    
    if (!dnaOrg) throw new Error('DNA organization not found')
    
    // Create loyalty module entity
    const { data: module, error: moduleError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: dnaOrg.id,
        entity_type: 'business_module_dna',
        entity_name: 'Customer Loyalty Module',
        entity_description: 'Universal loyalty program management with points, tiers, and rewards',
        smart_code: 'HERA.LOYALTY.STANDARD.MODULE.v1',
        metadata: {
          module_type: 'customer_loyalty',
          universal: true,
          features: ['points_tracking', 'tier_management', 'reward_redemption', 'analytics']
        },
        status: 'active'
      })
      .select()
      .single()
    
    if (moduleError) throw moduleError
    console.log('✅ Loyalty module entity created')
    
    // Add module patterns
    const { error: patternsError } = await supabase
      .from('core_dynamic_data')
      .insert([
        {
          organization_id: dnaOrg.id,
          entity_id: module.id,
          field_name: 'loyalty_entities',
          field_type: 'json',
          field_value_json: {
            loyalty_program: 'Program configuration with rules and tiers',
            loyalty_member: 'Customer enrollment and status',
            points_balance: 'Current points and history',
            reward_catalog: 'Available rewards and redemption rules',
            tier_configuration: 'Bronze, Silver, Gold, Platinum definitions'
          },
          smart_code: 'HERA.DNA.LOYALTY.ENTITIES.v1'
        },
        {
          organization_id: dnaOrg.id,
          entity_id: module.id,
          field_name: 'loyalty_transactions',
          field_type: 'json',
          field_value_json: {
            points_earned: 'Points awarded for purchases',
            points_redeemed: 'Points used for rewards',
            tier_upgrade: 'Customer tier advancement',
            reward_claim: 'Reward redemption transaction',
            points_adjustment: 'Manual adjustments or corrections'
          },
          smart_code: 'HERA.DNA.LOYALTY.TRANSACTIONS.v1'
        }
      ])
    
    if (patternsError) throw patternsError
    console.log('✅ Loyalty patterns stored')
    
    console.log('\n🎉 Customer Loyalty module successfully added to DNA system!')
    console.log('Smart Code: HERA.LOYALTY.STANDARD.MODULE.v1')
    
  } catch (error) {
    console.error('❌ Failed to add module:', error.message)
  }
}

// Run examples
async function main() {
  console.log('🧬 HERA DNA Pattern Addition Tool\n')
  console.log('This demonstrates how to add new patterns to the DNA system.\n')
  
  await addGlassCardComponent()
  await addCustomerLoyaltyModule()
  
  console.log('\n✨ DNA system has evolved with new patterns!')
}

main()