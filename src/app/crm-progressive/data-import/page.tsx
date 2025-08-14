'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Upload, FileText, Database, CheckCircle, AlertCircle,
  Eye, Download, RefreshCw, BarChart3, Users, 
  Building2, Network, CreditCard, FileCheck,
  ArrowRight, Info, Settings, Target, Brain, Lock, Shield
} from 'lucide-react'
import Link from 'next/link'
import { CRMLayout } from '@/components/layout/crm-layout'

interface ConversionResult {
  success: boolean
  data?: any
  summary?: any
  conversion_log?: string[]
  message: string
  error?: string
}

// Strong password for data import protection
const SECURE_PASSWORD = "HERA@2024#AI$SmartMapping!Xk7pZ9"

export default function CRMDataImportPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [authAttempts, setAuthAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ConversionResult | null>(null)
  const [previewResult, setPreviewResult] = useState<ConversionResult | null>(null)
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [importResult, setImportResult] = useState<ConversionResult | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  // Check authentication on mount
  useEffect(() => {
    const auth = sessionStorage.getItem('hera-data-import-auth')
    if (auth === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  // Handle password authentication
  const handleAuthentication = () => {
    if (passwordInput === SECURE_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('hera-data-import-auth', 'authenticated')
      setPasswordInput('')
      setAuthAttempts(0)
    } else {
      setAuthAttempts(prev => prev + 1)
      setPasswordInput('')
      
      if (authAttempts >= 2) {
        setIsLocked(true)
        setTimeout(() => {
          setIsLocked(false)
          setAuthAttempts(0)
        }, 30000) // 30 second lockout
      }
    }
  }

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('hera-data-import-auth')
    // Reset all state
    setCurrentStep(1)
    setRawData('')
    setAnalysisResult(null)
    setPreviewResult(null)
    setConversionResult(null)
    setImportResult(null)
  }

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">🔒 Secure Access Required</CardTitle>
            <p className="text-gray-600">HERA Legacy Data Conversion System</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLocked ? (
              <Alert className="border-red-200 bg-red-50">
                <Lock className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Access Temporarily Locked</AlertTitle>
                <AlertDescription className="text-red-700">
                  Too many failed attempts. Please wait 30 seconds before trying again.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Master Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAuthentication()}
                    placeholder="Enter secure password..."
                    className="w-full"
                    disabled={isLocked}
                  />
                </div>
                
                {authAttempts > 0 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      Invalid password. {3 - authAttempts} attempts remaining.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  onClick={handleAuthentication}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isLocked || !passwordInput.trim()}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Authenticate Access
                </Button>
              </>
            )}
            
            <div className="text-center text-xs text-gray-500 mt-4">
              <p>🛡️ This system contains sensitive data conversion tools</p>
              <p>Authorized personnel only</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sample data for demonstration
  const sampleData = `id,project_id,company_name,sector,amount,remarks,agency,country,state,city,promoter_name_1,designation_promoter_1,contact_no_promoter_1,promoter_name_2,designation_promoter_2,contact_no_promoter_2,services,feedback,next_call_date,reminder_email,resource,created_at,updated_at,custom_fields,status
004b15f0-03ad-4a9e-8173-fba01a6433df,6c134986-c31c-4ace-81e2-409f2a490035,Marath Enterprises and Crushers Private Limited,Mining & Minerals,16,INC,CRISIL,INDIA,KERALA,Thrissur,Mr. M V Rajan,,9194470000,ARUMUGAN KOUTTUNGAL ITTOORAN,Managing Director,,ex employee num.,ex employee num.,2025-04-03 10:28:54.656+00,2025-04-03 10:28:54.656+00,"{""date"":""17-10-2023"",""din1"":""9282391"",""din2"":""9282391"",""link"":""https://www.crisilratings.com"",""cin_no"":""U14200KL2012PTC030492"",""product"":""CFO"",""ratingnew"":""CRISIL B- /Stable""}",active
006d1e7e-ff69-4290-a4f1-8ea04e624b63,6c134986-c31c-4ace-81e2-409f2a490035,HEATHER INFRASTRUCTURE PRIVATE LIMITED,Construction - Real Estate,10,Withdrawn,CRISIL,INDIA,KERALA,Thiruvananthapuram,George Abraham,Managing Director,9198470000,JOSE JOY,Director,,check on linkedin,2025-04-10 00:00:00+00,Currently stoped all projects,2025-04-04 03:51:26.145+00,2025-04-04 03:51:26.145+00,"{""date"":""23-11-2021"",""din1"":""2068978"",""din2"":""2450663"",""link"":""https://www.crisilratings.com"",""cin_no"":""U45200KL2008PTC022417"",""product"":""CFO"",""ratingnew"":""CRISIL D""}",active`

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setRawData(e.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  const parseCSVData = (csvText: string) => {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',')
    
    return lines.slice(1).map(line => {
      const values = line.split(',')
      const record: any = {}
      
      headers.forEach((header, index) => {
        let value = values[index]?.trim()
        
        // Handle JSON custom_fields
        if (header === 'custom_fields' && value) {
          try {
            value = JSON.parse(value.replace(/^"|"$/g, '').replace(/""/g, '"'))
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
        
        // Convert amount to number
        if (header === 'amount' && value) {
          record[header] = Number(value)
        } else {
          record[header] = value
        }
      })
      
      return record
    })
  }

  const analyzeData = async () => {
    if (!rawData) {
      alert('Please provide data to analyze')
      return
    }

    setIsProcessing(true)
    try {
      const parsedData = parseCSVData(rawData)
      
      const response = await fetch('/api/v1/data-conversion/legacy-crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_structure',
          data: parsedData
        })
      })

      const result = await response.json()
      setAnalysisResult(result)
      if (result.success) {
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setAnalysisResult({
        success: false,
        message: 'Analysis failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const previewMapping = async () => {
    if (!rawData) return

    setIsProcessing(true)
    try {
      const parsedData = parseCSVData(rawData)
      
      const response = await fetch('/api/v1/data-conversion/legacy-crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview_mapping',
          data: parsedData,
          organization_id: 'crm_import_demo'
        })
      })

      const result = await response.json()
      setPreviewResult(result)
      if (result.success) {
        setCurrentStep(3)
      }
    } catch (error) {
      console.error('Preview error:', error)
      setPreviewResult({
        success: false,
        message: 'Preview failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const convertData = async () => {
    if (!rawData) return

    setIsProcessing(true)
    try {
      const parsedData = parseCSVData(rawData)
      
      const response = await fetch('/api/v1/data-conversion/legacy-crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'convert_legacy_crm',
          data: parsedData,
          organization_id: 'crm_import_demo'
        })
      })

      const result = await response.json()
      setConversionResult(result)
      if (result.success) {
        setCurrentStep(4)
      }
    } catch (error) {
      console.error('Conversion error:', error)
      setConversionResult({
        success: false,
        message: 'Conversion failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const performSmartAnalysis = async () => {
    if (!rawData) return

    setIsProcessing(true)
    try {
      const parsedData = parseCSVData(rawData)
      
      const response = await fetch('/api/v1/data-conversion/legacy-crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'smart_analysis',
          data: parsedData,
          organization_id: 'crm_import_demo'
        })
      })

      const result = await response.json()
      setAnalysisResult(result)
      if (result.success) {
        setCurrentStep(2) // Move to analysis results
      }
    } catch (error) {
      console.error('Smart analysis error:', error)
      setAnalysisResult({
        success: false,
        message: 'Smart analysis failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const convertAndImport = async () => {
    if (!rawData) return

    setIsProcessing(true)
    try {
      const parsedData = parseCSVData(rawData)
      
      const response = await fetch('/api/v1/data-conversion/legacy-crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'convert_and_import',
          data: parsedData,
          organization_id: 'crm_import_demo'
        })
      })

      const result = await response.json()
      setImportResult(result)
      if (result.success) {
        setCurrentStep(5) // New step for import results
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        message: 'Import failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const useSampleData = () => {
    setRawData(sampleData)
    setSelectedFile(null)
  }

  return (
    <CRMLayout>
      <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/crm-progressive" className="text-blue-600 hover:text-blue-800">
                <Users className="h-5 w-5" />
              </Link>
              <span className="text-gray-400">→</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Legacy Data Import</h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">Convert legacy CRM data to HERA Universal Architecture</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/crm-progressive">
                <ArrowRight className="h-4 w-4 mr-2" />
                Back to CRM
              </Link>
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Import Progress</h3>
              <Badge variant={currentStep === 5 ? "default" : "secondary"}>
                Step {currentStep} of 5
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className={`flex items-center gap-2 p-3 rounded-lg ${currentStep >= 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                <FileText className="h-5 w-5" />
                <span className="font-medium">1. Load Data</span>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-lg ${currentStep >= 2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">2. Analyze</span>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-lg ${currentStep >= 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                <Eye className="h-5 w-5" />
                <span className="font-medium">3. Preview</span>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-lg ${currentStep >= 4 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                <Database className="h-5 w-5" />
                <span className="font-medium">4. Convert</span>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-lg ${currentStep >= 5 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">5. Import</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Data Input */}
          <div className="space-y-6">
            {/* Data Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Data Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload CSV File</label>
                  <Input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="text-center">
                  <span className="text-sm text-gray-500">OR</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Paste CSV Data</label>
                    <Button variant="outline" size="sm" onClick={useSampleData}>
                      Use Sample Data
                    </Button>
                  </div>
                  <Textarea
                    value={rawData}
                    onChange={(e) => setRawData(e.target.value)}
                    placeholder="Paste your CSV data here..."
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>

                <Button 
                  onClick={analyzeData} 
                  disabled={!rawData || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analyze Data Structure
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* HERA Mapping Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  HERA Universal Mapping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                    <Building2 className="h-4 w-4 text-orange-600" />
                    <span className="text-sm"><strong>Organizations:</strong> Countries, States, Agencies</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm"><strong>Entities:</strong> Companies, Contacts, Projects, Services</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm"><strong>Dynamic Data:</strong> Custom fields, Details, Metadata</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <Network className="h-4 w-4 text-purple-600" />
                    <span className="text-sm"><strong>Relationships:</strong> Company-Contact, Project connections</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <CreditCard className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm"><strong>Transactions:</strong> Project valuations, Activities</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="conversion">Convert</TabsTrigger>
                <TabsTrigger value="import">Import</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Structure Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult ? (
                      <div className="space-y-4">
                        {analysisResult.success ? (
                          <>
                            {/* AI Smart Analysis Results */}
                            {analysisResult.data?.ai_insights ? (
                              <div className="space-y-4">
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Brain className="h-5 w-5 text-purple-600" />
                                    <h4 className="font-semibold text-purple-800">🧠 AI Smart Analysis Results</h4>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                    <div className="text-center p-3 bg-white/50 rounded border">
                                      <div className="text-xl font-bold text-purple-600">
                                        {Math.round(analysisResult.data.ai_insights.overall_confidence * 100)}%
                                      </div>
                                      <div className="text-xs text-gray-600">AI Confidence</div>
                                    </div>
                                    <div className="text-center p-3 bg-white/50 rounded border">
                                      <div className="text-xl font-bold text-blue-600">
                                        {analysisResult.data.ai_insights.json_complexity}
                                      </div>
                                      <div className="text-xs text-gray-600">JSON Objects</div>
                                    </div>
                                    <div className="text-center p-3 bg-white/50 rounded border">
                                      <div className="text-xl font-bold text-green-600">
                                        {analysisResult.data.ai_insights.detected_relationships}
                                      </div>
                                      <div className="text-xs text-gray-600">Relationships</div>
                                    </div>
                                    <div className="text-center p-3 bg-white/50 rounded border">
                                      <div className="text-xl font-bold text-orange-600">
                                        {Math.round(analysisResult.data.ai_insights.data_quality_score * 100)}%
                                      </div>
                                      <div className="text-xs text-gray-600">Data Quality</div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="text-sm">
                                      <span className="font-medium">Industry Detected:</span>
                                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                        {analysisResult.data.ai_insights.industry_detected}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>JSON Confidence: {Math.round(analysisResult.data.ai_insights.json_confidence * 100)}%</div>
                                      <div>Relationship Confidence: {Math.round(analysisResult.data.ai_insights.relationship_confidence * 100)}%</div>
                                    </div>
                                  </div>

                                  {analysisResult.data.processing_recommendations && (
                                    <div className="mt-3 p-3 bg-white/70 rounded border">
                                      <h5 className="text-sm font-medium text-gray-800 mb-2">AI Recommendations:</h5>
                                      <ul className="text-xs text-gray-600 space-y-1">
                                        {analysisResult.data.processing_recommendations.map((rec: string, idx: number) => (
                                          <li key={idx} className="flex items-start gap-1">
                                            <span className="text-green-500 mt-0.5">•</span>
                                            {rec}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Standard Analysis Results */
                              <>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="text-center p-3 bg-blue-50 rounded">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {analysisResult.data?.total_records || 0}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Records</div>
                                  </div>
                                  <div className="text-center p-3 bg-green-50 rounded">
                                    <div className="text-2xl font-bold text-green-600">
                                      {analysisResult.data?.field_analysis?.length || 0}
                                    </div>
                                    <div className="text-sm text-gray-600">Data Fields</div>
                                  </div>
                                </div>

                                {analysisResult.data?.entity_analysis && (
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Data Analysis</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>Total Records: {analysisResult.data.entity_analysis.total_records}</div>
                                      <div>Unique Companies: {analysisResult.data.entity_analysis.unique_companies || analysisResult.data.entity_analysis.companies || 0}</div>
                                      <div>Sectors: {analysisResult.data.entity_analysis.unique_sectors}</div>
                                      <div>Agencies: {analysisResult.data.entity_analysis.unique_agencies}</div>
                                      <div>Countries: {analysisResult.data.entity_analysis.unique_countries}</div>
                                      <div>With Contacts: {analysisResult.data.entity_analysis.records_with_promoters}</div>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            <div className="flex gap-2">
                              <Button onClick={previewMapping} size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Preview Mapping
                              </Button>
                              {analysisResult.data?.ai_insights && (
                                <Button 
                                  onClick={() => console.log('Detailed AI Analysis:', analysisResult.data?.intelligent_mapping)} 
                                  size="sm" 
                                  variant="outline"
                                >
                                  <Brain className="h-4 w-4 mr-2" />
                                  View AI Details
                                </Button>
                              )}
                            </div>
                          </>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Analysis Failed</AlertTitle>
                            <AlertDescription>{analysisResult.message}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Run analysis to see data structure insights</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mapping Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {previewResult ? (
                      <div className="space-y-4">
                        {previewResult.success ? (
                          <>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-orange-50 rounded">
                                <div className="text-lg font-bold text-orange-600">
                                  {previewResult.data?.estimated_totals?.organizations || 0}
                                </div>
                                <div className="text-xs text-gray-600">Organizations</div>
                              </div>
                              <div className="text-center p-3 bg-blue-50 rounded">
                                <div className="text-lg font-bold text-blue-600">
                                  {previewResult.data?.estimated_totals?.entities || 0}
                                </div>
                                <div className="text-xs text-gray-600">Entities</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded">
                                <div className="text-lg font-bold text-green-600">
                                  {previewResult.data?.estimated_totals?.dynamic_data_fields || 0}
                                </div>
                                <div className="text-xs text-gray-600">Dynamic Fields</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-purple-50 rounded">
                                <div className="text-lg font-bold text-purple-600">
                                  {previewResult.data?.estimated_totals?.relationships || 0}
                                </div>
                                <div className="text-xs text-gray-600">Relationships</div>
                              </div>
                              <div className="text-center p-3 bg-yellow-50 rounded">
                                <div className="text-lg font-bold text-yellow-600">
                                  {previewResult.data?.estimated_totals?.transactions || 0}
                                </div>
                                <div className="text-xs text-gray-600">Transactions</div>
                              </div>
                              <div className="text-center p-3 bg-indigo-50 rounded">
                                <div className="text-lg font-bold text-indigo-600">
                                  {previewResult.data?.estimated_totals?.transaction_lines || 0}
                                </div>
                                <div className="text-xs text-gray-600">Txn Lines</div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Button 
                                onClick={performSmartAnalysis} 
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                disabled={isProcessing}
                              >
                                <Brain className="h-4 w-4 mr-2" />
                                🧠 AI Smart Analysis
                              </Button>
                              <Button onClick={convertData} className="w-full" variant="outline">
                                <Database className="h-4 w-4 mr-2" />
                                Convert Only
                              </Button>
                              <Button onClick={convertAndImport} className="w-full">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Convert & Import to CRM
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Preview Failed</AlertTitle>
                            <AlertDescription>{previewResult.message}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Run preview to see mapping results</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="conversion" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {conversionResult ? (
                      <div className="space-y-4">
                        {conversionResult.success ? (
                          <>
                            <Alert>
                              <CheckCircle className="h-4 w-4" />
                              <AlertTitle>Conversion Successful!</AlertTitle>
                              <AlertDescription>
                                {conversionResult.message}
                              </AlertDescription>
                            </Alert>

                            {conversionResult.summary && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Organizations:</span>
                                    <Badge variant="secondary">{conversionResult.summary.organizations_created}</Badge>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Entities:</span>
                                    <Badge variant="secondary">{conversionResult.summary.entities_created}</Badge>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Dynamic Data:</span>
                                    <Badge variant="secondary">{conversionResult.summary.dynamic_data_fields}</Badge>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Relationships:</span>
                                    <Badge variant="secondary">{conversionResult.summary.relationships_created}</Badge>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Transactions:</span>
                                    <Badge variant="secondary">{conversionResult.summary.transactions_created}</Badge>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Txn Lines:</span>
                                    <Badge variant="secondary">{conversionResult.summary.transaction_lines_created}</Badge>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export Results
                              </Button>
                              <Button size="sm" asChild>
                                <Link href="/crm-progressive">
                                  <Target className="h-4 w-4 mr-2" />
                                  View in CRM
                                </Link>
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Conversion Failed</AlertTitle>
                            <AlertDescription>{conversionResult.message}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Run conversion to see results</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="import" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Import to HERA CRM</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {importResult ? (
                      <div className="space-y-4">
                        {importResult.success ? (
                          <>
                            <Alert>
                              <CheckCircle className="h-4 w-4" />
                              <AlertTitle>Import Successful!</AlertTitle>
                              <AlertDescription>
                                {importResult.message} All data is now available in your HERA CRM system.
                              </AlertDescription>
                            </Alert>

                            {importResult.summary && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Organizations:</span>
                                    <Badge variant="secondary">{importResult.summary.organizations_created}</Badge>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Customers:</span>
                                    <Badge variant="secondary">{importResult.summary.entities_created}</Badge>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Data Fields:</span>
                                    <Badge variant="secondary">{importResult.summary.dynamic_data_fields}</Badge>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Relationships:</span>
                                    <Badge variant="secondary">{importResult.summary.relationships_created}</Badge>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Activities:</span>
                                    <Badge variant="secondary">{importResult.summary.transactions_created}</Badge>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Status:</span>
                                    <Badge variant="default">{importResult.summary.database_status}</Badge>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button size="sm" asChild>
                                <Link href="/crm-progressive">
                                  <Target className="h-4 w-4 mr-2" />
                                  View in CRM System
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href="/crm-progressive/dashboards/customers">
                                  <Users className="h-4 w-4 mr-2" />
                                  View Customers
                                </Link>
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Import Failed</AlertTitle>
                            <AlertDescription>
                              {importResult.message}
                              {importResult.error && <div className="mt-2 text-sm opacity-75">{importResult.error}</div>}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="mb-4">Ready to import your data to HERA CRM</p>
                        
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Automatic CRM Population</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Companies become CRM customers</li>
                            <li>• Promoters become contacts with relationships</li>
                            <li>• Projects create activity records</li>
                            <li>• All custom fields preserved</li>
                            <li>• Immediate availability in CRM system</li>
                          </ul>
                        </div>

                        {/* Import Button - Always Visible When Data is Available */}
                        <div className="space-y-3">
                          <Button 
                            onClick={convertAndImport} 
                            disabled={!rawData || isProcessing}
                            size="lg"
                            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                          >
                            {isProcessing ? (
                              <>
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                Converting & Importing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Convert & Import to CRM
                              </>
                            )}
                          </Button>
                          
                          {!rawData && (
                            <p className="text-sm text-gray-400">
                              Add your CSV data first, then click to import
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Always Visible Action Panel */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                onClick={analyzeData} 
                disabled={!rawData || isProcessing}
                variant={analysisResult ? "outline" : "default"}
                className="w-full"
              >
                {isProcessing && !analysisResult ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                1. Analyze Data
              </Button>
              
              <Button 
                onClick={previewMapping} 
                disabled={!analysisResult?.success || isProcessing}
                variant={previewResult ? "outline" : "default"}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                2. Preview Mapping
              </Button>
              
              <Button 
                onClick={convertData} 
                disabled={!previewResult?.success || isProcessing}
                variant="outline"
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                3. Convert Only
              </Button>
              
              <Button 
                onClick={convertAndImport} 
                disabled={!rawData || isProcessing}
                className="w-full"
              >
                {isProcessing && (analysisResult || previewResult) ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                4. Import to CRM
              </Button>
            </div>
            
            {/* Quick Import Option */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-center gap-4">
                <span className="text-sm text-gray-500">Skip steps:</span>
                <Button 
                  onClick={async () => {
                    if (!rawData) return
                    // Direct import - all steps in sequence
                    await convertAndImport()
                  }}
                  disabled={!rawData || isProcessing}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ⚡ One-Click Import
                </Button>
                <span className="text-xs text-gray-400">Direct to CRM import</span>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              <div className={`flex items-center gap-1 ${analysisResult?.success ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4" />
                Analysis {analysisResult?.success ? 'Complete' : 'Pending'}
              </div>
              <div className={`flex items-center gap-1 ${previewResult?.success ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4" />
                Preview {previewResult?.success ? 'Complete' : 'Pending'}
              </div>
              <div className={`flex items-center gap-1 ${conversionResult?.success ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4" />
                Convert {conversionResult?.success ? 'Complete' : 'Pending'}
              </div>
              <div className={`flex items-center gap-1 ${importResult?.success ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4" />
                Import {importResult?.success ? 'Complete' : 'Pending'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </CRMLayout>
  )
}