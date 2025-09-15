'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calculator,
  Upload,
  Save,
  Send,
  AlertCircle,
  FileText,
  DollarSign,
  Truck,
  Shield,
  Brain,
  Target,
  CheckCircle,
  Info
} from 'lucide-react'
import { useFurnitureOrg } from '@/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import { universalApi } from '@/lib/universal-api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface BidFormData {
  // Basic Details
  bidAmount: string
  validityPeriod: string
  deliveryPeriod: string
  paymentTerms: string

  // Technical Details
  technicalCapability: string
  pastExperience: string
  qualityAssurance: string

  // Commercial Details
  priceBreakdown: {
    materialCost: string
    transportCost: string
    laborCost: string
    overheads: string
    profit: string
  }

  // Compliance
  documentsChecked: string[]
  declarations: string[]
}

const requiredDocuments = [
  { id: 'pan', label: 'PAN Card' },
  { id: 'gst', label: 'GST Registration' },
  { id: 'trade_license', label: 'Trade License' },
  { id: 'bank_statement', label: 'Bank Statement (Last 3 months)' },
  { id: 'experience_cert', label: 'Experience Certificate' },
  { id: 'quality_cert', label: 'Quality Certification' },
  { id: 'emd_receipt', label: 'EMD Receipt' },
  { id: 'tender_fee', label: 'Tender Fee Receipt' }
]

const declarations = [
  { id: 'accuracy', label: 'All information provided is accurate and true' },
  { id: 'terms', label: 'Accept all tender terms and conditions' },
  { id: 'validity', label: 'Bid valid for specified period' },
  { id: 'no_cartel', label: 'Not involved in any cartel or price fixing' },
  { id: 'blacklist', label: 'Not blacklisted by any government department' }
]

export default function NewBidPage() {
  const { code } = useParams()
  const router = useRouter()
  const { organizationId } = useFurnitureOrg()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const [formData, setFormData] = useState<BidFormData>({
    bidAmount: '',
    validityPeriod: '90',
    deliveryPeriod: '30',
    paymentTerms: 'As per tender terms',
    technicalCapability: '',
    pastExperience: '',
    qualityAssurance: '',
    priceBreakdown: {
      materialCost: '',
      transportCost: '',
      laborCost: '',
      overheads: '',
      profit: ''
    },
    documentsChecked: [],
    declarations: []
  })

  const [bidStrategy, setBidStrategy] = useState('moderate')
  const [showAiInsights, setShowAiInsights] = useState(true)

  const calculateTotalBid = () => {
    const breakdown = formData.priceBreakdown
    const total =
      parseFloat(breakdown.materialCost || '0') +
      parseFloat(breakdown.transportCost || '0') +
      parseFloat(breakdown.laborCost || '0') +
      parseFloat(breakdown.overheads || '0') +
      parseFloat(breakdown.profit || '0')
    return total
  }

  const handleSubmitDraft = async () => {
    setLoading(true)
    try {
      const bidData = {
        entity_type: 'HERA.FURNITURE.TENDER.BID.v1',
        entity_code: `BID/KFW/${new Date().getFullYear()}/${Date.now()}`,
        entity_name: `Bid for ${code}`,
        smart_code: 'HERA.FURNITURE.TENDER.BID.DRAFTED.v1',
        metadata: {
          tender_code: code,
          bid_amount: parseFloat(formData.bidAmount),
          validity_period_days: parseInt(formData.validityPeriod),
          delivery_period_days: parseInt(formData.deliveryPeriod),
          payment_terms: formData.paymentTerms,
          bid_strategy: bidStrategy,
          technical_details: {
            capability: formData.technicalCapability,
            experience: formData.pastExperience,
            quality: formData.qualityAssurance
          },
          price_breakdown: formData.priceBreakdown,
          documents_attached: formData.documentsChecked,
          declarations_accepted: formData.declarations,
          status: 'draft'
        }
      }

      const result = await universalApi.createEntity(bidData)

      toast({
        title: 'Bid Draft Saved',
        description: 'Your bid has been saved as draft.'
      })

      router.push(`/furniture/tender/${code}`)
    } catch (error) {
      console.error('Error saving bid:', error)
      toast({
        title: 'Error',
        description: 'Failed to save bid draft.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitBid = async () => {
    // Validate all required fields
    if (!formData.bidAmount || formData.documentsChecked.length < requiredDocuments.length) {
      toast({
        title: 'Incomplete Bid',
        description: 'Please complete all required fields and upload all documents.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const bidData = {
        entity_type: 'HERA.FURNITURE.TENDER.BID.v1',
        entity_code: `BID/KFW/${new Date().getFullYear()}/${Date.now()}`,
        entity_name: `Bid for ${code}`,
        smart_code: 'HERA.FURNITURE.TENDER.BID.SUBMITTED.v1',
        metadata: {
          tender_code: code,
          bid_amount: parseFloat(formData.bidAmount),
          validity_period_days: parseInt(formData.validityPeriod),
          delivery_period_days: parseInt(formData.deliveryPeriod),
          payment_terms: formData.paymentTerms,
          bid_strategy: bidStrategy,
          technical_details: {
            capability: formData.technicalCapability,
            experience: formData.pastExperience,
            quality: formData.qualityAssurance
          },
          price_breakdown: formData.priceBreakdown,
          documents_attached: formData.documentsChecked,
          declarations_accepted: formData.declarations,
          submission_time: new Date().toISOString(),
          status: 'submitted'
        }
      }

      const result = await universalApi.createEntity(bidData)

      // Create transaction for bid submission
      await universalApi.createTransaction({
        transaction_type: 'bid_submission',
        transaction_code: `BID-SUB-${Date.now()}`,
        smart_code: 'HERA.FURNITURE.TENDER.BID.SUBMISSION.v1',
        total_amount: parseFloat(formData.bidAmount),
        metadata: {
          bid_id: result.id,
          tender_code: code
        }
      })

      toast({
        title: 'Bid Submitted Successfully',
        description: 'Your bid has been submitted and locked.'
      })

      router.push(`/furniture/tender/${code}`)
    } catch (error) {
      console.error('Error submitting bid:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit bid.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <FurniturePageHeader
        title={`Prepare Bid for ${code}`}
        subtitle="Complete all sections to submit your bid"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="commercial">Commercial</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="bidAmount">Bid Amount (₹)</Label>
                  <Input
                    id="bidAmount"
                    type="number"
                    value={formData.bidAmount}
                    onChange={e => setFormData({ ...formData, bidAmount: e.target.value })}
                    placeholder="Enter total bid amount"
                    className="text-lg font-semibold"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Calculated total: ₹{calculateTotalBid().toLocaleString('en-IN')}
                  </p>
                </div>

                <div>
                  <Label>Bid Strategy</Label>
                  <RadioGroup value={bidStrategy} onValueChange={setBidStrategy}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="aggressive" id="aggressive" />
                      <Label htmlFor="aggressive">Aggressive (Low margin, high win chance)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moderate" id="moderate" />
                      <Label htmlFor="moderate">Moderate (Balanced approach)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="conservative" id="conservative" />
                      <Label htmlFor="conservative">Conservative (High margin, low risk)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="validityPeriod">Bid Validity (Days)</Label>
                    <Input
                      id="validityPeriod"
                      type="number"
                      value={formData.validityPeriod}
                      onChange={e => setFormData({ ...formData, validityPeriod: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryPeriod">Delivery Period (Days)</Label>
                    <Input
                      id="deliveryPeriod"
                      type="number"
                      value={formData.deliveryPeriod}
                      onChange={e => setFormData({ ...formData, deliveryPeriod: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Textarea
                    id="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="technical" className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="technicalCapability">Technical Capability</Label>
                  <Textarea
                    id="technicalCapability"
                    value={formData.technicalCapability}
                    onChange={e =>
                      setFormData({ ...formData, technicalCapability: e.target.value })
                    }
                    placeholder="Describe your technical capabilities, machinery, workforce..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="pastExperience">Past Experience</Label>
                  <Textarea
                    id="pastExperience"
                    value={formData.pastExperience}
                    onChange={e => setFormData({ ...formData, pastExperience: e.target.value })}
                    placeholder="List similar projects completed, client references..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="qualityAssurance">Quality Assurance</Label>
                  <Textarea
                    id="qualityAssurance"
                    value={formData.qualityAssurance}
                    onChange={e => setFormData({ ...formData, qualityAssurance: e.target.value })}
                    placeholder="Quality control measures, certifications..."
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="commercial" className="space-y-4 mt-6">
                <h3 className="font-semibold mb-4">Price Breakdown</h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="materialCost">Material Cost (₹)</Label>
                    <Input
                      id="materialCost"
                      type="number"
                      value={formData.priceBreakdown.materialCost}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          priceBreakdown: {
                            ...formData.priceBreakdown,
                            materialCost: e.target.value
                          }
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="transportCost">Transport Cost (₹)</Label>
                    <Input
                      id="transportCost"
                      type="number"
                      value={formData.priceBreakdown.transportCost}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          priceBreakdown: {
                            ...formData.priceBreakdown,
                            transportCost: e.target.value
                          }
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="laborCost">Labor Cost (₹)</Label>
                    <Input
                      id="laborCost"
                      type="number"
                      value={formData.priceBreakdown.laborCost}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          priceBreakdown: { ...formData.priceBreakdown, laborCost: e.target.value }
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="overheads">Overheads (₹)</Label>
                    <Input
                      id="overheads"
                      type="number"
                      value={formData.priceBreakdown.overheads}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          priceBreakdown: { ...formData.priceBreakdown, overheads: e.target.value }
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="profit">Profit Margin (₹)</Label>
                    <Input
                      id="profit"
                      type="number"
                      value={formData.priceBreakdown.profit}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          priceBreakdown: { ...formData.priceBreakdown, profit: e.target.value }
                        })
                      }
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">
                        ₹{calculateTotalBid().toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-6">
                <div>
                  <h3 className="font-semibold mb-4">Required Documents</h3>
                  <div className="space-y-3">
                    {requiredDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={doc.id}
                          checked={formData.documentsChecked.includes(doc.id)}
                          onCheckedChange={checked => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                documentsChecked: [...formData.documentsChecked, doc.id]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                documentsChecked: formData.documentsChecked.filter(
                                  d => d !== doc.id
                                )
                              })
                            }
                          }}
                        />
                        <Label htmlFor={doc.id} className="font-normal cursor-pointer">
                          {doc.label}
                        </Label>
                        <Button size="sm" variant="ghost">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="font-semibold mb-4">Declarations</h3>
                  <div className="space-y-3">
                    {declarations.map(dec => (
                      <div key={dec.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={dec.id}
                          checked={formData.declarations.includes(dec.id)}
                          onCheckedChange={checked => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                declarations: [...formData.declarations, dec.id]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                declarations: formData.declarations.filter(d => d !== dec.id)
                              })
                            }
                          }}
                        />
                        <Label htmlFor={dec.id} className="font-normal cursor-pointer">
                          {dec.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => router.push(`/furniture/tender/${code}`)}>
                Cancel
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={handleSubmitDraft} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={handleSubmitBid}
                  disabled={loading || formData.documentsChecked.length < requiredDocuments.length}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Bid
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Tender Summary */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Tender Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Tender Code</p>
                <p className="font-medium">{code}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estimated Value</p>
                <p className="font-medium">₹45,00,000</p>
              </div>
              <div>
                <p className="text-muted-foreground">EMD Amount</p>
                <p className="font-medium">₹90,000</p>
              </div>
              <div>
                <p className="text-muted-foreground">Closing Date</p>
                <p className="font-medium">25 Jan 2025</p>
              </div>
            </div>
          </Card>

          {/* AI Insights */}
          {showAiInsights && (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
              <h3 className="font-semibold mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI Bid Insights
              </h3>
              <div className="space-y-3">
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Optimal Bid Range:</strong> ₹42,00,000 - ₹44,50,000
                    <br />
                    Based on historical data and market conditions
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Competition:</strong> Expect 8-10 bidders
                    <br />
                    Key competitor: Nilambur Wood Products
                  </AlertDescription>
                </Alert>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Success Factors:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Emphasize quality certifications</li>
                      <li>Highlight local presence</li>
                      <li>Show quick delivery capability</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          )}

          {/* Progress Indicator */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Bid Completion</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Basic Details</span>
                <span className="text-green-600">Complete</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Technical Details</span>
                <span
                  className={formData.technicalCapability ? 'text-green-600' : 'text-orange-600'}
                >
                  {formData.technicalCapability ? 'Complete' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Commercial Details</span>
                <span className={calculateTotalBid() > 0 ? 'text-green-600' : 'text-orange-600'}>
                  {calculateTotalBid() > 0 ? 'Complete' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>
                  Documents ({formData.documentsChecked.length}/{requiredDocuments.length})
                </span>
                <span
                  className={
                    formData.documentsChecked.length === requiredDocuments.length
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }
                >
                  {formData.documentsChecked.length === requiredDocuments.length
                    ? 'Complete'
                    : 'Pending'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
