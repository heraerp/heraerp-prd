/**
 * HERA Playbooks Smart Code Generator Component
 *
 * Interactive UI component for generating and validating smart codes
 * for playbook definitions, steps, and related entities.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Code2, Check, AlertTriangle, Copy, RefreshCw, Lightbulb, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  playbookSmartCodeService,
  PlaybookSmartCodes,
  INDUSTRY_CODES,
  MODULE_CODES,
  type SmartCodeValidationResult
} from '@/lib/playbooks/smart-codes/playbook-smart-codes'

interface SmartCodeGeneratorProps {
  onCodeGenerated?: (smartCode: string) => void
  initialType?: 'playbook' | 'step' | 'contract' | 'policy'
  className?: string
}

export function SmartCodeGenerator({
  onCodeGenerated,
  initialType = 'playbook',
  className
}: SmartCodeGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'generator' | 'validator' | 'templates'>('generator')

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-600" />
          Smart Code Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="validator">Validator</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="mt-4">
            <SmartCodeGeneratorTab initialType={initialType} onCodeGenerated={onCodeGenerated} />
          </TabsContent>

          <TabsContent value="validator" className="mt-4">
            <SmartCodeValidatorTab />
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <SmartCodeTemplatesTab onCodeGenerated={onCodeGenerated} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

/**
 * Smart Code Generator Tab
 */
function SmartCodeGeneratorTab({
  initialType,
  onCodeGenerated
}: {
  initialType: string
  onCodeGenerated?: (smartCode: string) => void
}) {
  const [codeType, setCodeType] = useState(initialType)
  const [industry, setIndustry] = useState('PUBLICSECTOR')
  const [module, setModule] = useState('GRANTS')
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1')
  const [generatedCode, setGeneratedCode] = useState('')
  const [validation, setValidation] = useState<SmartCodeValidationResult | null>(null)

  const generateCode = () => {
    let code = ''

    switch (codeType) {
      case 'playbook':
        code = PlaybookSmartCodes.forPlaybookDefinition(industry, name, version)
        break
      case 'step':
        code = PlaybookSmartCodes.forStepDefinition(industry, name, version)
        break
      case 'run':
        code = PlaybookSmartCodes.forPlaybookRun(industry, name, version)
        break
      case 'step_execution':
        code = PlaybookSmartCodes.forStepExecution(industry, name, version)
        break
      case 'input_contract':
        code = PlaybookSmartCodes.forContract('input', version)
        break
      case 'output_contract':
        code = PlaybookSmartCodes.forContract('output', version)
        break
      case 'sla_policy':
        code = PlaybookSmartCodes.forPolicy('sla', version)
        break
      case 'approval_policy':
        code = PlaybookSmartCodes.forPolicy('approval', version)
        break
      default:
        code = `HERA.${industry}.PLAYBOOK.${name.toUpperCase()}.V${version}`
    }

    setGeneratedCode(code)

    // Validate the generated code
    const validationResult = playbookSmartCodeService.validateSmartCode(code)
    setValidation(validationResult)

    // Notify parent component
    if (onCodeGenerated && validationResult.valid) {
      onCodeGenerated(code)
    }
  }

  const copyToClipboard = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode)
    }
  }

  const incrementVersion = () => {
    if (generatedCode) {
      const nextVersionCode = playbookSmartCodeService.generateNextVersion(generatedCode)
      setGeneratedCode(nextVersionCode)
      const validationResult = playbookSmartCodeService.validateSmartCode(nextVersionCode)
      setValidation(validationResult)

      if (onCodeGenerated && validationResult.valid) {
        onCodeGenerated(nextVersionCode)
      }
    }
  }

  useEffect(() => {
    if (name.trim()) {
      generateCode()
    }
  }, [codeType, industry, module, name, version])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="codeType">Code Type</Label>
          <Select value={codeType} onValueChange={setCodeType}>
            <SelectTrigger>
              <SelectValue placeholder="Select code type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="playbook">Playbook Definition</SelectItem>
              <SelectItem value="step">Step Definition</SelectItem>
              <SelectItem value="run">Playbook Run</SelectItem>
              <SelectItem value="step_execution">Step Execution</SelectItem>
              <SelectItem value="input_contract">Input Contract</SelectItem>
              <SelectItem value="output_contract">Output Contract</SelectItem>
              <SelectItem value="sla_policy">SLA Policy</SelectItem>
              <SelectItem value="approval_policy">Approval Policy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="industry">Industry</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(INDUSTRY_CODES).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="module">Module</Label>
          <Select value={module} onValueChange={setModule}>
            <SelectTrigger>
              <SelectValue placeholder="Select module" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODULE_CODES).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={version}
            onChange={e => setVersion(e.target.value)}
            placeholder="1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="name">Name/Identifier</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., GRANTS_INTAKE, REGISTER_APPLICATION"
        />
      </div>

      <div className="space-y-2">
        <Label>Generated Smart Code</Label>
        <div className="flex items-center gap-2">
          <Input
            value={generatedCode}
            readOnly
            className="font-mono text-sm"
            placeholder="Smart code will appear here..."
          />
          <Button size="sm" variant="outline" onClick={copyToClipboard} disabled={!generatedCode}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={incrementVersion} disabled={!generatedCode}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {validation && <ValidationDisplay validation={validation} />}
    </div>
  )
}

/**
 * Smart Code Validator Tab
 */
function SmartCodeValidatorTab() {
  const [inputCode, setInputCode] = useState('')
  const [validation, setValidation] = useState<SmartCodeValidationResult | null>(null)

  const validateCode = () => {
    if (inputCode.trim()) {
      const result = playbookSmartCodeService.validateSmartCode(inputCode.trim())
      setValidation(result)
    } else {
      setValidation(null)
    }
  }

  useEffect(() => {
    const timer = setTimeout(validateCode, 300)
    return () => clearTimeout(timer)
  }, [inputCode])

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="validateInput">Smart Code to Validate</Label>
        <Textarea
          id="validateInput"
          value={inputCode}
          onChange={e => setInputCode(e.target.value)}
          placeholder="Enter a smart code to validate (e.g., HERA.PUBLICSECTOR.PLAYBOOK.DEF.GRANTS_INTAKE.V1)"
          className="font-mono text-sm"
          rows={3}
        />
      </div>

      {validation && <ValidationDisplay validation={validation} showComponents />}

      {!inputCode.trim() && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Enter a smart code above to see detailed validation results and component breakdown.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/**
 * Smart Code Templates Tab
 */
function SmartCodeTemplatesTab({
  onCodeGenerated
}: {
  onCodeGenerated?: (smartCode: string) => void
}) {
  const templates = playbookSmartCodeService.getSmartCodeTemplates()

  const useTemplate = (template: string) => {
    if (onCodeGenerated) {
      onCodeGenerated(template)
    }
  }

  return (
    <div className="space-y-4">
      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          Click any template to use it as a starting point. Replace variables in {'{}'} with your
          values.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3">
        {Object.entries(templates).map(([name, template]) => (
          <div
            key={name}
            className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => useTemplate(template)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm text-gray-900 capitalize">
                  {name.replace('-', ' ')}
                </h4>
                <code className="text-xs text-gray-600 font-mono">{template}</code>
              </div>
              <Button size="sm" variant="ghost">
                Use
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Validation Display Component
 */
function ValidationDisplay({
  validation,
  showComponents = false
}: {
  validation: SmartCodeValidationResult
  showComponents?: boolean
}) {
  return (
    <div className="space-y-3">
      {/* Validation Status */}
      <div className="flex items-center gap-2">
        {validation.valid ? (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <Check className="w-3 h-3 mr-1" />
            Valid
          </Badge>
        ) : (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Invalid
          </Badge>
        )}

        {validation.components && (
          <Badge variant="outline">
            {playbookSmartCodeService.getSmartCodeCategory(
              `${validation.components.prefix}.${validation.components.industry}.${validation.components.module}.${validation.components.type}.${validation.components.subtype}.V${validation.components.version}`
            )}
          </Badge>
        )}
      </div>

      {/* Components Breakdown */}
      {showComponents && validation.components && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm text-gray-900 mb-2">Components</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Prefix:</span> {validation.components.prefix}
            </div>
            <div>
              <span className="text-gray-600">Industry:</span> {validation.components.industry}
            </div>
            <div>
              <span className="text-gray-600">Module:</span> {validation.components.module}
            </div>
            <div>
              <span className="text-gray-600">Type:</span> {validation.components.type}
            </div>
            <div>
              <span className="text-gray-600">Subtype:</span> {validation.components.subtype}
            </div>
            <div>
              <span className="text-gray-600">Version:</span> {validation.components.version}
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {validation.errors && validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Validation Errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions */}
      {validation.suggestions && validation.suggestions.length > 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Suggestions:</div>
            <ul className="list-disc list-inside space-y-1">
              {validation.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm">
                  {suggestion}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
