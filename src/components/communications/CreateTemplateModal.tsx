'use client'

import React from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useCreateTemplate } from '@/hooks/use-communications'

interface CreateTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTemplateModal({ open, onOpenChange }: CreateTemplateModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentVariable, setCurrentVariable] = useState('')

  const [templateData, setTemplateData] = useState({
    name: '',
    channel: 'email',
    subject: '',
    body_text: '',
    variables: [] as string[],
    tags: [] as string[]
  })

  const createMutation = useCreateTemplate()

  const handleAddVariable = () => {
    if (currentVariable && !templateData.variables.includes(currentVariable)) {
      setTemplateData({
        ...templateData,
        variables: [...templateData.variables, currentVariable]
      })
      setCurrentVariable('')
    }
  }

  const handleRemoveVariable = (variable: string) => {
    setTemplateData({
      ...templateData,
      variables: templateData.variables.filter(v => v !== variable)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!templateData.name || !templateData.body_text) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    if (templateData.channel === 'email' && !templateData.subject) {
      toast({
        title: 'Subject required',
        description: 'Email templates require a subject line',
        variant: 'destructive'
      })
      return
    }

    try {
      const template = await createMutation.mutateAsync(templateData)

      toast({
        title: 'Template created',
        description: 'Your template has been created successfully'
      })

      onOpenChange(false)
      router.push(`/civicflow/communications/templates/${template.id}`)
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Create a new message template for your communication campaigns.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={templateData.name}
                onChange={e => setTemplateData({ ...templateData, name: e.target.value })}
                className="col-span-3"
                placeholder="e.g., Welcome Email Template"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="channel" className="text-right">
                Channel
              </Label>
              <Select
                value={templateData.channel}
                onValueChange={value => setTemplateData({ ...templateData, channel: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {templateData.channel === 'email' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={templateData.subject}
                  onChange={e => setTemplateData({ ...templateData, subject: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., Welcome to {{organization_name}}!"
                />
              </div>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="body" className="text-right pt-2">
                {templateData.channel === 'webhook' ? 'Payload' : 'Content'}
              </Label>
              <Textarea
                id="body"
                value={templateData.body_text}
                onChange={e => setTemplateData({ ...templateData, body_text: e.target.value })}
                className="col-span-3"
                rows={6}
                placeholder={
                  templateData.channel === 'webhook'
                    ? '{\n  "message": "{{message}}",\n  "recipient": "{{recipient}}"\n}'
                    : templateData.channel === 'sms'
                      ? 'Hi {{first_name}}, your appointment is confirmed for {{date}} at {{time}}.'
                      : "Dear {{first_name}},\n\nWelcome to our community! We're excited to have you on board."
                }
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Variables</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={currentVariable}
                    onChange={e => setCurrentVariable(e.target.value)}
                    placeholder="e.g., first_name"
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddVariable())}
                  />
                  <Button type="button" onClick={handleAddVariable} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {templateData.variables.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {templateData.variables.map(variable => (
                      <Badge key={variable} variant="secondary">
                        {`{{${variable}}}`}
                        <button
                          type="button"
                          onClick={() => handleRemoveVariable(variable)}
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
              {createMutation.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
