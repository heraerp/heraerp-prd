'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/src/components/ui/select'
import { Calendar } from '@/src/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Save, ArrowLeft } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { useFurnitureOrg } from '@/src/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/src/components/furniture/FurniturePageHeader'
import { tenderService } from '@/src/lib/services/tender-service'
import { useToast } from '@/src/hooks/use-toast'


export const dynamic = 'force-dynamic'

export default function NewTenderPage() {
  const router = useRouter()

const { organizationId, orgLoading } = useFurnitureOrg()

const { toast } = useToast()

const [loading, setLoading] = useState(false)

const [formData, setFormData] = useState({ code: '', title: '', department: 'Kerala Forest Department', closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now estimatedValue: '', emdAmount: '', description: '', location: '', lotCount: '1', tenderFee: '5000', processingFee: '1180' })

const handleSubmit = async (e: React.FormEvent) => { e.preventDefault() if (!organizationId) {
  toast({ title: 'Error', description: 'Organization context not found', variant: 'destructive' }) return } try { setLoading(true)

const tenderId = await tenderService.createTender({ code: formData.code, title: formData.title, department: formData.department, closing_date: formData.closingDate.toISOString(), estimated_value: parseFloat(formData.estimatedValue), emd_amount: parseFloat(formData.emdAmount), description: formData.description, location: formData.location }) toast({ title: 'Success', description: 'Tender created successfully' }) router.push(`/furniture/tender/${tenderId}`  ) catch (error) {
  console.error('Error creating tender:', error)

const errorMessage = error?.message || 'Unknown error' if (errorMessage.includes('Failed to fetch') || errorMessage.includes('net::ERR_FAILED')) { // Service worker interference toast({ title: 'Network Error - Service Worker Issue', description: 'Service workers are interfering with requests. Click below to fix.', variant: 'destructive', action: ( <Button size="sm" variant="outline" onClick={() => (window.location.href = '/clear-cache.html')} > Fix Now </Button>   )  ) else if (errorMessage.includes('Supabase not configured')) {
  toast({ title: 'Database Not Configured', description: 'Please configure Supabase credentials in your .env file.', variant: 'destructive' }  ) else { toast({ title: 'Error', description: `Failed to create tender: ${errorMessage}`, variant: 'destructive' }  )   } finally {
    setLoading(false)
  }
}

const calculateEMD = () => {
  const value =parseFloat(formData.estimatedValue) if (!isNaN(value)) {
  const emd = Math.round(value * 0.02)
          // 2% EMD setFormData(prev => ({ ...prev, emdAmount: emd.toString(  ))  ) } if (orgLoading) {
  return (
    <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center"> <div className="text-center"> <div className="inline-flex items-center space-x-2"> <div className="w-8 h-8 border-4 border-[var(--color-accent-indigo)] border-t-transparent rounded-full animate-spin"></div> <p className="text-[var(--color-text-secondary)]">Loading...</p> </div> </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-body)]"> <div className="p-6 space-y-6"> <FurniturePageHeader title="Add New Tender" subtitle="Add a tender to your watchlist for bidding" actions={ <Button variant="outline" size="sm" onClick={() => router.back()} className="bg-[var(--color-body)] gap-2"> <ArrowLeft className="h-4 w-4" /> Back </Button> } /> <form onSubmit={handleSubmit} className="bg-[var(--color-body)] space-y-6"> <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50"> <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-4">Tender Information</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div className="space-y-2"> <Label htmlFor="code">Tender Code *</Label> <Input id="code" value={formData.code} onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))} placeholder="KFD/2025/WOOD/001" required className="bg-muted-foreground/10/50 border-[var(--color-border)]" /> </div> <div className="space-y-2"> <Label htmlFor="department">Department *</Label> <Select value={formData.department} onValueChange={value => setFormData(prev => ({ ...prev, department: value }))} > <SelectTrigger className="bg-muted-foreground/10/50 border-[var(--color-border)]"> <SelectValue /> </SelectTrigger> <SelectContent> <SelectItem value="Kerala Forest Department"> Kerala Forest Department </SelectItem> <SelectItem value="Kerala State Bamboo Corporation"> Kerala State Bamboo Corporation </SelectItem> <SelectItem value="Forest Industries">Forest Industries</SelectItem> </SelectContent> </Select> </div> <div className="space-y-2 md:col-span-2"> <Label htmlFor="title">Tender Title *</Label> <Input id="title" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Teak Wood Supply - Nilambur Range" required className="bg-muted-foreground/10/50 border-[var(--color-border)]" /> </div> <div className="space-y-2"> <Label htmlFor="closingDate">Closing Date *</Label> <Popover> <PopoverTrigger asChild> <Button variant="outline" className={cn( 'w-full justify-start text-left font-normal bg-muted-foreground/10/50 border-[var(--color-border)]', !formData.closingDate && 'text-[var(--color-text-secondary)]' )} > <CalendarIcon className="mr-2 h-4 w-4" /> {formData.closingDate ? ( format(formData.closingDate, 'PPP') )
          : (
            <span>Pick a date</span> )} </Button> </PopoverTrigger> <PopoverContent className="w-auto p-0"> <Calendar mode="single" selected={formData.closingDate} onSelect={date => date && setFormData(prev => ({ ...prev, closingDate: date })  ) initialFocus /> </PopoverContent> </Popover> </div> <div className="space-y-2"> <Label htmlFor="lotCount">Number of Lots</Label> <Input id="lotCount" type="number" value={formData.lotCount} onChange={e => setFormData(prev => ({ ...prev, lotCount: e.target.value }))} min="1" className="bg-muted-foreground/10/50 border-[var(--color-border)]" /> </div> <div className="space-y-2"> <Label htmlFor="location">Location</Label> <Input id="location" value={formData.location} onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} placeholder="Nilambur Forest Division, Malappuram" className="bg-muted-foreground/10/50 border-[var(--color-border)]" /> </div> <div className="space-y-2 md:col-span-2"> <Label htmlFor="description">Description</Label> <Textarea id="description" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Provide a brief description of the tender..." rows={4} className="bg-muted-foreground/10/50 border-[var(--color-border)]" /> </div> </div> </Card> <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50"> <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-4">Financial Details</h3> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <div className="space-y-2"> <Label htmlFor="estimatedValue">Estimated Value (₹) *</Label> <Input id="estimatedValue" type="number" value={formData.estimatedValue} onChange={e => setFormData(prev => ({ ...prev, estimatedValue: e.target.value }))} onBlur={calculateEMD} placeholder="4500000" required className="bg-muted-foreground/10/50 border-[var(--color-border)]" /> </div> <div className="space-y-2"> <Label htmlFor="emdAmount">EMD Amount (₹) *</Label> <Input id="emdAmount" type="number" value={formData.emdAmount} onChange={e => setFormData(prev => ({ ...prev, emdAmount: e.target.value }))} placeholder="90000" required className="bg-muted-foreground/10/50 border-[var(--color-border)]" /> <p className="text-xs text-[var(--color-text-secondary)]">Usually 2% of estimated value</p> </div> <div className="space-y-2"> <Label htmlFor="tenderFee">Tender Fee (₹)</Label> <Input id="tenderFee" type="number" value={formData.tenderFee} onChange={e => setFormData(prev => ({ ...prev, tenderFee: e.target.value }))} className="bg-muted-foreground/10/50 border-[var(--color-border)]" /> </div> </div> </Card> <div className="bg-[var(--color-body)] flex justify-end gap-4"> <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} > Cancel </Button> <Button type="submit" disabled={loading} className="gap-2 bg-gradient-to-r from-[var(--color-accent-indigo)] to-[var(--color-accent-teal)] hover:from-[var(--color-accent-indigo)] hover:to-[var(--color-accent-teal)]" > <Save className="h-4 w-4" /> {loading ? 'Creating...' : 'Create Tender'} </Button> </div> </form> </div>
      </div>
    )
}
