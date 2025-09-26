'use client'

import { useState } from 'react'
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
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Audience</DialogTitle>
            <DialogDescription>
              Define a new audience for your communication campaigns.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={audienceData.name}
                onChange={e => setAudienceData({ ...audienceData, name: e.target.value })}
                className="col-span-3"
                placeholder="e.g., Active Constituents"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Consent Policy</Label>
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
              <Label className="text-right pt-2">Entity Types</Label>
              <div className="col-span-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {['constituent', 'organization', 'staff', 'volunteer', 'donor', 'vendor'].map(
                    type => (
                      <Button
                        key={type}
                        type="button"
                        variant={
                          audienceData.definition.entity_types.includes(type)
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => toggleEntityType(type)}
                        className="justify-start"
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
                      <Label className="text-right pt-2">Filter Tags</Label>
                      <div className="col-span-3 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={currentTag}
                            onChange={e => setCurrentTag(e.target.value)}
                            placeholder="e.g., newsletter"
                            onKeyPress={e =>
                              e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                            }
                          />
                          <Button type="button" onClick={handleAddTag} size="icon">
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
                      <Label className="text-right pt-2">Custom Filter</Label>
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
              <Label className="text-right pt-2">Audience Tags</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={e => setCurrentTag(e.target.value)}
                    placeholder="e.g., marketing"
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} size="icon">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Audience'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
