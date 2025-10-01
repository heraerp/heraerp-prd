'use client'
import React from 'react'
import { useRecord, useUpsert } from '@/lib/ui-binder'
import { RecordPage } from '@/components/uikit/RecordPage'
import { DetailTabs } from '@/components/uikit/DetailTabs'
import { useOrgId } from '@/lib/runtime/useOrgId'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Gem, Scale, Shield, GitBranch, Calendar, Code, Sparkles, Diamond } from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

export default function JewelryRecordPage({ params }: { params: { id: string } }) {
  const orgId = useOrgId()
  const { data: rec, isLoading } = useRecord(orgId, params.id)
  const { upsert } = useUpsert()

  const dd: any = rec?.dynamic_data ?? {}
  
  const metadata = rec ? [
    { label: 'Entity ID', value: rec.entity_id },
    { label: 'Smart Code', value: rec.smart_code },
    { label: 'Created', value: new Date(rec.created_at).toLocaleDateString() },
    { label: 'Updated', value: new Date(rec.updated_at).toLocaleDateString() }
  ] : []

  const tabs = [
    {
      key: 'overview',
      label: 'Overview',
      icon: Gem,
      component: ({ data }: { data: any }) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Item Image */}
            <div className="space-y-4">
              <div className="jewelry-crown-glow aspect-square rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/20 flex items-center justify-center relative overflow-hidden">
                <Gem className="h-24 w-24 jewelry-icon-gold" />
                <div className="absolute top-4 right-4">
                  <button className="jewelry-btn-secondary p-2">
                    <Calendar className="jewelry-icon-gold" size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="jewelry-glass-card aspect-square rounded-lg bg-gradient-to-br from-yellow-500/5 to-yellow-600/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 jewelry-icon-gold" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Item Details */}
            <div className="space-y-6">
              <div>
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-4">Description</h3>
                <p className="jewelry-text-high-contrast leading-relaxed">
                  {data.description || 'Premium jewelry item with exceptional craftsmanship and attention to detail.'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="jewelry-glass-card p-4">
                  <h4 className="jewelry-text-luxury font-medium mb-2">Metal Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="jewelry-text-muted">Type:</span>
                      <span className="jewelry-text-high-contrast">{data.metal_type || 'Gold'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="jewelry-text-muted">Purity:</span>
                      <span className="jewelry-text-high-contrast">{data.purity_karat || 18}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="jewelry-text-muted">Net Weight:</span>
                      <span className="jewelry-text-high-contrast">{data.net_weight || 0}g</span>
                    </div>
                  </div>
                </div>
                
                <div className="jewelry-glass-card p-4">
                  <h4 className="jewelry-text-luxury font-medium mb-2">Stone Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="jewelry-text-muted">Type:</span>
                      <span className="jewelry-text-high-contrast">{data.stone_type || 'Diamond'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="jewelry-text-muted">Weight:</span>
                      <span className="jewelry-text-high-contrast">{data.stone_weight || 0}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="jewelry-text-muted">Quality:</span>
                      <span className="jewelry-text-high-contrast">{data.stone_quality || 'VVS'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ),
      props: { data: dd }
    },
    {
      key: 'weights',
      label: 'Specifications',
      icon: Scale,
      component: ({ data }: { data: any }) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="jewelry-text-luxury text-xl font-semibold">Technical Specifications</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="jewelry-glass-card p-6">
              <h4 className="jewelry-text-luxury font-semibold mb-4 flex items-center gap-2">
                <Scale className="jewelry-icon-gold" size={20} />
                Physical Properties
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Gross Weight:</span>
                  <span className="jewelry-text-high-contrast">{data.gross_weight || 0}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Net Weight:</span>
                  <span className="jewelry-text-high-contrast">{data.net_weight || 0}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Stone Weight:</span>
                  <span className="jewelry-text-high-contrast">{data.stone_weight || 0}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Dimensions:</span>
                  <span className="jewelry-text-high-contrast">
                    {data.length || 0} × {data.width || 0} × {data.height || 0}mm
                  </span>
                </div>
              </div>
            </div>
            
            <div className="jewelry-glass-card p-6">
              <h4 className="jewelry-text-luxury font-semibold mb-4 flex items-center gap-2">
                <Diamond className="jewelry-icon-gold" size={20} />
                Stone Details
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Type:</span>
                  <span className="jewelry-text-high-contrast">{data.stone_type || 'Diamond'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Weight:</span>
                  <span className="jewelry-text-high-contrast">{data.stone_weight || 0}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Color:</span>
                  <span className="jewelry-text-high-contrast">{data.stone_color || 'D'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Clarity:</span>
                  <span className="jewelry-text-high-contrast">{data.stone_clarity || 'VVS1'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Cut:</span>
                  <span className="jewelry-text-high-contrast">{data.stone_cut || 'Excellent'}</span>
                </div>
              </div>
            </div>
            
            <div className="jewelry-glass-card p-6">
              <h4 className="jewelry-text-luxury font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="jewelry-icon-gold" size={20} />
                Metal & Purity
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Purity:</span>
                  <span className="jewelry-text-high-contrast">{data.purity_karat || 18}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">HSN Code:</span>
                  <span className="jewelry-text-high-contrast">{data.hsn_code || '71131930'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">GST Rate:</span>
                  <span className="jewelry-text-high-contrast">{data.gst_slab || 3}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Metal Type:</span>
                  <span className="jewelry-text-high-contrast">{data.metal_type || 'Gold'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ),
      props: { data: dd }
    },
    {
      key: 'financial',
      label: 'Financial',
      icon: Shield,
      component: ({ data }: { data: any }) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="jewelry-text-luxury text-xl font-semibold">Financial Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="jewelry-glass-card p-6 text-center">
              <Shield className="mx-auto mb-3 jewelry-icon-gold" size={24} />
              <h4 className="jewelry-text-high-contrast text-2xl font-bold">₹{(data.cost_price || 0).toLocaleString()}</h4>
              <p className="jewelry-text-muted text-sm">Cost Price</p>
            </div>
            
            <div className="jewelry-glass-card p-6 text-center">
              <Sparkles className="mx-auto mb-3 jewelry-icon-gold" size={24} />
              <h4 className="jewelry-text-high-contrast text-2xl font-bold">₹{(data.selling_price || 0).toLocaleString()}</h4>
              <p className="jewelry-text-muted text-sm">Selling Price</p>
            </div>
            
            <div className="jewelry-glass-card p-6 text-center">
              <Diamond className="mx-auto mb-3 jewelry-icon-gold" size={24} />
              <h4 className="jewelry-text-high-contrast text-2xl font-bold">₹{(data.market_value || 0).toLocaleString()}</h4>
              <p className="jewelry-text-muted text-sm">Market Value</p>
            </div>
            
            <div className="jewelry-glass-card p-6 text-center">
              <Scale className="mx-auto mb-3 jewelry-icon-gold" size={24} />
              <h4 className="jewelry-text-high-contrast text-2xl font-bold">
                {data.cost_price && data.selling_price ? 
                  Math.round(((data.selling_price - data.cost_price) / data.cost_price) * 100) : 0}%
              </h4>
              <p className="jewelry-text-muted text-sm">Margin</p>
            </div>
          </div>
          
          <div className="jewelry-glass-card p-6">
            <h4 className="jewelry-text-luxury font-semibold mb-4">Pricing Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="jewelry-text-muted">Metal Cost:</span>
                <p className="jewelry-text-high-contrast font-semibold">₹{(data.metal_cost || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="jewelry-text-muted">Stone Cost:</span>
                <p className="jewelry-text-high-contrast font-semibold">₹{(data.stone_cost || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="jewelry-text-muted">Making Charges:</span>
                <p className="jewelry-text-high-contrast font-semibold">₹{(data.making_charges || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="jewelry-text-muted">GST Amount:</span>
                <p className="jewelry-text-high-contrast font-semibold">₹{(data.gst_amount || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </motion.div>
      ),
      props: { data: dd }
    },
    { 
      key: 'trace', 
      label: 'Traceability',
      icon: Shield,
      component: ({ data }: { data: any }) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="jewelry-text-luxury text-xl font-semibold">Provenance & Certification</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="jewelry-glass-card p-6">
              <h4 className="jewelry-text-luxury font-semibold mb-4 flex items-center gap-2">
                <Shield className="jewelry-icon-gold" size={20} />
                Certificates & Documents
              </h4>
              <div className="space-y-3">
                {(['GIA Certificate', 'Insurance Appraisal', 'Origin Certificate']).map((cert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 jewelry-glass-card-subtle rounded-lg">
                    <div className="flex items-center gap-3">
                      <Sparkles className="jewelry-icon-gold" size={16} />
                      <span className="jewelry-text-high-contrast">{cert}</span>
                    </div>
                    <button className="jewelry-btn-secondary p-1">
                      <Code className="jewelry-icon-gold" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="jewelry-glass-card p-6">
              <h4 className="jewelry-text-luxury font-semibold mb-4 flex items-center gap-2">
                <GitBranch className="jewelry-icon-gold" size={20} />
                Supply Chain
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Supplier:</span>
                  <span className="jewelry-text-high-contrast">{data.supplier || 'Premium Diamonds Ltd.'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Origin:</span>
                  <span className="jewelry-text-high-contrast">{data.origin || 'India'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Purchase Date:</span>
                  <span className="jewelry-text-high-contrast">{data.purchase_date || '2024-01-15'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="jewelry-text-muted">Batch Number:</span>
                  <span className="jewelry-text-high-contrast">{data.batch_number || 'B2024001'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ),
      props: { data: dd }
    },
    { 
      key: 'bom', 
      label: 'Relationships',
      icon: GitBranch,
      component: ({ data }: { data: any }) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="jewelry-text-luxury text-xl font-semibold">Component Relationships</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="jewelry-glass-card p-6">
              <h4 className="jewelry-text-luxury font-semibold mb-4 flex items-center gap-2">
                <GitBranch className="jewelry-icon-gold" size={20} />
                Bill of Materials
              </h4>
              <div className="space-y-3">
                {[
                  { component: 'Main Stone', quantity: '1 pc', weight: `${data.stone_weight || 0}g` },
                  { component: 'Metal Base', quantity: '1 pc', weight: `${data.net_weight || 0}g` },
                  { component: 'Setting', quantity: '1 pc', weight: '0.5g' },
                  { component: 'Polish', quantity: '1 service', weight: '-' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 jewelry-glass-card-subtle rounded-lg">
                    <div>
                      <p className="jewelry-text-high-contrast font-medium">{item.component}</p>
                      <p className="jewelry-text-muted text-sm">{item.quantity} • {item.weight}</p>
                    </div>
                    <Gem className="jewelry-icon-gold" size={16} />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="jewelry-glass-card p-6">
              <h4 className="jewelry-text-luxury font-semibold mb-4 flex items-center gap-2">
                <Calendar className="jewelry-icon-gold" size={20} />
                Assembly Process
              </h4>
              <div className="space-y-3">
                {[
                  { step: 'Stone Selection', status: 'completed', date: '2024-01-10' },
                  { step: 'Metal Preparation', status: 'completed', date: '2024-01-11' },
                  { step: 'Setting Process', status: 'completed', date: '2024-01-12' },
                  { step: 'Final Polish', status: 'completed', date: '2024-01-13' }
                ].map((step, index) => (
                  <div key={index} className="flex items-center justify-between p-3 jewelry-glass-card-subtle rounded-lg">
                    <div>
                      <p className="jewelry-text-high-contrast font-medium">{step.step}</p>
                      <p className="jewelry-text-muted text-sm">{step.date}</p>
                    </div>
                    <div className="jewelry-status-active px-2 py-1 rounded text-xs">
                      {step.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ),
      props: { data: dd }
    }
  ]

  const actions = [
    {
      key: 'save',
      label: 'Save',
      onClick: async () => {
        if (!rec) return
        await upsert(rec)
        alert('Saved')
      }
    }
  ]

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="container mx-auto p-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.history.back()}
                className="jewelry-btn-secondary p-3"
              >
                <ArrowLeft size={20} />
              </motion.button>
              
              <div>
                <h1 className="jewelry-heading text-2xl md:text-3xl">
                  {rec?.entity_name ?? 'Loading...'}
                </h1>
                <p className="jewelry-text-luxury text-sm">
                  Luxury Jewelry Item Details
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                if (!rec) return
                await upsert(rec)
                alert('Saved successfully!')
              }}
              className="jewelry-btn-primary flex items-center space-x-2"
            >
              <Save size={18} />
              <span>Save Changes</span>
            </motion.button>
          </motion.div>

          {/* Metadata Cards */}
          {rec && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              <div className="jewelry-glass-card p-4 text-center">
                <Code className="mx-auto mb-2 jewelry-icon-gold" size={20} />
                <h3 className="jewelry-text-luxury text-sm font-medium">Entity ID</h3>
                <p className="jewelry-text-muted text-xs font-mono">{rec.entity_id}</p>
              </div>
              
              <div className="jewelry-glass-card p-4 text-center">
                <Sparkles className="mx-auto mb-2 jewelry-icon-gold" size={20} />
                <h3 className="jewelry-text-luxury text-sm font-medium">Smart Code</h3>
                <p className="jewelry-text-muted text-xs font-mono">{rec.smart_code}</p>
              </div>
              
              <div className="jewelry-glass-card p-4 text-center">
                <Calendar className="mx-auto mb-2 jewelry-icon-gold" size={20} />
                <h3 className="jewelry-text-luxury text-sm font-medium">Created</h3>
                <p className="jewelry-text-muted text-xs">{new Date(rec.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="jewelry-glass-card p-4 text-center">
                <Calendar className="mx-auto mb-2 jewelry-icon-gold" size={20} />
                <h3 className="jewelry-text-luxury text-sm font-medium">Updated</h3>
                <p className="jewelry-text-muted text-xs">{new Date(rec.updated_at).toLocaleDateString()}</p>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="jewelry-glass-panel text-center p-12"
            >
              <div className="jewelry-spinner mx-auto mb-4"></div>
              <p className="jewelry-text-luxury">Loading jewelry details...</p>
            </motion.div>
          )}

          {/* Detail Tabs */}
          {!isLoading && rec && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="jewelry-glass-panel-strong"
            >
              <DetailTabs tabs={tabs} className="jewelry-detail-tabs" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="jewelry-glass-card p-4 text-center"
    >
      {Icon && <Icon className="mx-auto mb-2 jewelry-icon-gold" size={20} />}
      <div className="jewelry-text-luxury text-sm font-medium mb-1">{label}</div>
      <div className="jewelry-text-high-contrast font-bold text-lg">{String(value ?? '—')}</div>
    </motion.div>
  )
}