'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Info } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useCreateAudience } from '@/hooks/use-communications'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'

interface CreateAudienceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAudienceModal({ open, onOpenChange }: CreateAudienceModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentTag, setCurrentTag] = useState('')

  const [audienceData, setAudienceData] = useState({
    name: '',
    consent_policy: 'opt_in',
    definition: {
      entity_types: [] as string[],
      tags: [] as string[],
      custom_filter: ''
    },
    tags: [] as string[]
  })

  const createMutation = useCreateAudience()

  const handleAddTag = () => {
    if (currentTag && !audienceData.tags.includes(currentTag)) {
      setAudienceData({
        ...audienceData,
        tags: [...audienceData.tags, currentTag]
      })
      setCurrentTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setAudienceData({
      ...audienceData,
      tags: audienceData.tags.filter(t => t !== tag)
    })
  }

  const toggleEntityType = (type: string) => {
    const types = audienceData.definition.entity_types
    if (types.includes(type)) {
      setAudienceData({
        ...audienceData,
        definition: {
          ...audienceData.definition,
          entity_types: types.filter(t => t !== type)
        }
      })
    } else {
      setAudienceData({
        ...audienceData,
        definition: {
          ...audienceData.definition,
          entity_types: [...types, type]
        }
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!audienceData.name) {
      toast({
        title: 'Missing required fields',
        description: 'Please provide a name for the audience',
        variant: 'destructive'
      })
      return
    }

    if (audienceData.definition.entity_types.length === 0) {
      toast({
        title: 'No entity types selected',
        description: 'Please select at least one entity type to include in the audience',
        variant: 'destructive'
      })
      return
    }

    try {
      const audience = await createMutation.mutateAsync(audienceData)

      toast({
        title: 'Audience created',
        description: 'Your audience has been created successfully'
      })

      onOpenChange(false)
      router.push(`/civicflow/communications/audiences/${audience.id}`)
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] bg-panel border-border overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-text-100">Create Audience</DialogTitle>
            <DialogDescription className="text-text-300">
              Define a new audience for your communication campaigns.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 overflow-y-auto px-1">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-text-200">
                Name
              </Label>
              <Input
                id="name"
                value={audienceData.name}
                onChange={e => setAudienceData({ ...audienceData, name: e.target.value })}
                className="col-span-3 bg-panel-alt border-border text-text-100"
                placeholder="e.g., Active Constituents"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2 text-text-200">Consent Policy</Label>
              <RadioGroup
                className="col-span-3"
                value={audienceData.consent_policy}
                onValueChange={value => setAudienceData({ ...audienceData, consent_policy: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="opt_in" id="opt_in" />
                  <Label htmlFor="opt_in" className="font-normal cursor-pointer">
                    Opt-in (Members must explicitly consent)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="opt_out" id="opt_out" />
                  <Label htmlFor="opt_out" className="font-normal cursor-pointer">
                    Opt-out (Members are included unless they opt out)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2 text-text-200">Entity Types</Label>
              <div className="col-span-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {['constituent', 'organization', 'staff', 'volunteer', 'donor', 'vendor'].map(
                    type => (
                      <Button
                        key={type}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEntityType(type)}
                        className={
                          audienceData.definition.entity_types.includes(type)
                            ? 'bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white border-[rgb(0,166,166)] justify-start'
                            : 'border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10 justify-start'
                        }
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>

            <Accordion type="single" collapsible className="col-span-full">
              <AccordionItem value="advanced">
                <AccordionTrigger>Advanced Filters</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2 text-text-200">Filter Tags</Label>
                      <div className="col-span-3 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={currentTag}
                            onChange={e => setCurrentTag(e.target.value)}
                            placeholder="e.g., newsletter"
                            onKeyPress={e =>
                              e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                            }
                            className="bg-panel-alt border-border text-text-100"
                          />
                          <Button
                            type="button"
                            onClick={handleAddTag}
                            size="icon"
                            className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {audienceData.definition.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {audienceData.definition.tags.map(tag => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAudienceData({
                                      ...audienceData,
                                      definition: {
                                        ...audienceData.definition,
                                        tags: audienceData.definition.tags.filter(t => t !== tag)
                                      }
                                    })
                                  }}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2 text-text-200">Custom Filter</Label>
                      <div className="col-span-3 space-y-2">
                        <Textarea
                          value={audienceData.definition.custom_filter}
                          onChange={e =>
                            setAudienceData({
                              ...audienceData,
                              definition: {
                                ...audienceData.definition,
                                custom_filter: e.target.value
                              }
                            })
                          }
                          placeholder="JSON filter expression (optional)"
                          rows={3}
                          className="bg-panel-alt border-border text-text-100"
                        />
                        <p className="text-xs text-muted-foreground flex items-start gap-1">
                          <Info className="h-3 w-3 mt-0.5" />
                          Advanced: Define custom filters using JSON expressions
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2 text-text-200">Audience Tags</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={e => setCurrentTag(e.target.value)}
                    placeholder="e.g., marketing"
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="bg-panel-alt border-border text-text-100"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    size="icon"
                    className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {audienceData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {audienceData.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Audience'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
