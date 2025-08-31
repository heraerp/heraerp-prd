'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Database, FileText } from 'lucide-react'

export default function TestTransactionPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  const testTransaction = async (type: string) => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/v1/test-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data)
      }
    } catch (err) {
      setError({
        error: 'Network error',
        details: err instanceof Error ? err.message : err
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="container mx-auto max-w-6xl">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-3xl font-bold">Universal Transaction Test</CardTitle>
            <CardDescription className="text-gray-100 text-lg">
              Test creating transactions and line items to diagnose database issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => testTransaction('sale')}
                disabled={loading}
                size="lg"
                className="h-16 text-lg font-semibold"
                variant="outline"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Database className="mr-2 h-5 w-5" />}
                Test Sale Transaction
              </Button>
              
              <Button 
                onClick={() => testTransaction('journal_entry')}
                disabled={loading}
                size="lg"
                className="h-16 text-lg font-semibold"
                variant="outline"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileText className="mr-2 h-5 w-5" />}
                Test Journal Entry
              </Button>
            </div>

            {/* Success Result */}
            {result && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription>
                  <div className="text-lg font-bold text-green-800 dark:text-green-200 mb-4">
                    ✅ Transaction Created Successfully!
                  </div>
                  
                  {/* Transaction Details */}
                  <Card className="mb-4 border-green-200">
                    <CardHeader className="bg-green-100 dark:bg-green-900/30">
                      <CardTitle className="text-lg">Transaction Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4">
                      <div className="grid grid-cols-2 gap-2 text-base">
                        <div className="font-semibold">ID:</div>
                        <div className="font-mono text-sm">{result.transaction?.id}</div>
                        
                        <div className="font-semibold">Code:</div>
                        <div className="font-mono">{result.transaction?.transaction_code}</div>
                        
                        <div className="font-semibold">Type:</div>
                        <div>{result.transaction?.transaction_type}</div>
                        
                        <div className="font-semibold">Amount:</div>
                        <div className="font-mono">${result.transaction?.total_amount}</div>
                        
                        <div className="font-semibold">Date:</div>
                        <div>{new Date(result.transaction?.transaction_date).toLocaleString()}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Line Item Details */}
                  {result.line && (
                    <Card className="border-green-200">
                      <CardHeader className="bg-green-100 dark:bg-green-900/30">
                        <CardTitle className="text-lg">Line Item Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 p-4">
                        <div className="grid grid-cols-2 gap-2 text-base">
                          <div className="font-semibold">Line ID:</div>
                          <div className="font-mono text-sm">{result.line.id}</div>
                          
                          <div className="font-semibold">Line #:</div>
                          <div>{result.line.line_number}</div>
                          
                          <div className="font-semibold">Amount:</div>
                          <div className="font-mono">${result.line.line_amount}</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Full Response Data */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-base font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                      📋 View Full Response Data
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm overflow-x-auto border border-gray-300 dark:border-gray-600">
{JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Result */}
            {error && (
              <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-900/20">
                <XCircle className="h-5 w-5" />
                <AlertDescription>
                  <div className="text-lg font-bold text-red-800 dark:text-red-200 mb-4">
                    ❌ Error Occurred
                  </div>
                  
                  <Card className="border-red-200">
                    <CardContent className="p-4 space-y-3">
                      {error.message && (
                        <div className="text-base">
                          <span className="font-semibold">Message:</span>
                          <p className="mt-1 text-gray-700 dark:text-gray-300">{error.message}</p>
                        </div>
                      )}
                      
                      {error.lineError && (
                        <Card className="bg-red-100 dark:bg-red-900/30 border-red-300">
                          <CardHeader>
                            <CardTitle className="text-base text-red-800 dark:text-red-200">
                              Line Creation Error
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-base">
                              <span className="font-semibold">Error Code:</span> 
                              <span className="ml-2 font-mono">{error.lineError.code}</span>
                            </div>
                            <div className="text-base">
                              <span className="font-semibold">Error Message:</span>
                              <p className="mt-1 font-mono text-sm">{error.lineError.message}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {error.transaction && (
                        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <AlertDescription>
                            <p className="font-semibold text-orange-800 dark:text-orange-200">
                              Note: Transaction was created successfully
                            </p>
                            <p className="text-sm mt-1">ID: {error.transaction.id}</p>
                            <p className="text-sm">Code: {error.transaction.transaction_code}</p>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Full Error Data */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-base font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                      📋 View Full Error Data
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm overflow-x-auto border border-gray-300 dark:border-gray-600">
{JSON.stringify(error, null, 2)}
                    </pre>
                  </details>
                </AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <Card className="bg-white dark:bg-gray-800 border-2 border-blue-400 shadow-lg">
              <CardHeader className="bg-blue-600 text-white">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <AlertCircle className="h-8 w-8" />
                  What This Tests
                </h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      1
                    </div>
                    <div className="text-lg text-gray-900 dark:text-gray-100">
                      <p className="font-semibold">Creates a transaction</p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Inserts a record into the <span className="font-mono bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded text-black dark:text-white">universal_transactions</span> table
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      2
                    </div>
                    <div className="text-lg text-gray-900 dark:text-gray-100">
                      <p className="font-semibold">Attempts to create a line item</p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Tries to insert into <span className="font-mono bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded text-black dark:text-white">universal_transaction_lines</span> table
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      3
                    </div>
                    <div className="text-lg text-gray-900 dark:text-gray-100">
                      <p className="font-semibold">Shows exact error messages</p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Displays database errors if line creation fails
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      4
                    </div>
                    <div className="text-lg text-gray-900 dark:text-gray-100">
                      <p className="font-semibold">Diagnoses database issues</p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Helps identify the <span className="font-mono bg-red-100 dark:bg-red-900 px-2 py-1 rounded text-red-800 dark:text-red-200">line_amount_base</span> column problem
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}