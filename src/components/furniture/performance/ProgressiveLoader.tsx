import React, { useState, useEffect, useRef }
from 'react'
import { Loader2, CheckCircle, AlertCircle }
from 'lucide-react'
import { cn }
from '@/lib/utils'


interface LoadingStage {
  id: string
  label: string
  duration?: number // Optional duration in ms
}

interface ProgressiveLoaderProps {
  stages: LoadingStage[]
  onComplete?: () => void
  onError?: (error: Error) => void
  className?: string
  showProgress?: boolean
  autoStart?: boolean
}

interface StageState {
  id: string
  status: 'pending' | 'loading' | 'completed' | 'error'
  error?: string
}

export function ProgressiveLoader({ stages, onComplete, onError, className, showProgress = true, autoStart = true
}: ProgressiveLoaderProps) {
  const [stageStates, setStageStates] = useState<StageState[]>( stages.map(stage => ({ id: stage.id, status: 'pending' })) )

const [currentStageIndex, setCurrentStageIndex] = useState(-1)

const [progress, setProgress] = useState(0)

const [isComplete, setIsComplete] = useState(false)

const [error, setError] = useState<string | null>(null)

const abortRef = useRef(false)

const timeoutRef = useRef<NodeJS.Timeout>() // Start loading process const start = async () => { abortRef.current = false setCurrentStageIndex(0) setProgress(0) setIsComplete(false) setError(null) setStageStates(stages.map(stage => ({ id: stage.id, status: 'pending' }))  ) // Stop loading process
  const stop = () => { abortRef.current = true if (timeoutRef.current) {
  clearTimeout(timeoutRef.current  ) }

// Process stages useEffect(() => { if (currentStageIndex < 0 || currentStageIndex >= stages.length) return if (abortRef.current) return const processStage = async () => { const stage = stages[currentStageIndex] // Update stage status to loading setStageStates(prev => prev.map(s => (s.id === stage.id ? { ...s, status: 'loading' } : s))) try { // Simulate stage duration or use provided duration
  const duration = stage.duration || 1000 + Math.random() * 2000 await new Promise((resolve, reject) => { timeoutRef.current = setTimeout(() => { if (abortRef.current) {
  reject(new Error('Loading aborted')  ) else { resolve(undefined  ) }, duration  )) // Update stage status to completed setStageStates(prev => prev.map(s => (s.id === stage.id ? { ...s, status: 'completed' } : s)) ) // Update progress
  const newProgress = ((currentStageIndex + 1) / stages.length) * 100 setProgress(newProgress) // Move to next stage or complete if (currentStageIndex < stages.length - 1) {
  setCurrentStageIndex(prev => prev + 1  ) else { setIsComplete(true) onComplete?.(  )   } catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error' // Update stage status to error setStageStates(prev => prev.map(s => (s.id === stage.id ? { ...s, status: 'error', error: errorMessage } : s)) ) setError(errorMessage) onError?.(err instanceof Error ? err : new Error(errorMessage)  ) } processStage(  ), [currentStageIndex, stages, onComplete, onError]) // Auto start on mount useEffect(() => { if (autoStart) {
  start(  ) return () => { stop(  ) }, [autoStart])

const getStageIcon = (status: StageState['status']) => { switch (status) {
  case 'loading': return <Loader2 className="h-5 w-5 animate-spin text-primary" /> case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" /> case 'error': return <AlertCircle className="h-5 w-5 text-red-600" /> default: return <div className="bg-[var(--color-body)] h-5 w-5 rounded-full border-2 border-[var(--color-border)]" /> } }

const currentStage = currentStageIndex >= 0 ? stages[currentStageIndex] : null return ( <div className={cn('space-y-4', className)}> {/* Progress bar */} {showProgress && ( <div className="bg-[var(--color-body)] relative"> <div className="overflow-hidden h-2 text-xs flex rounded-full bg-[var(--color-body)] bg-muted-foreground/10"> <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-[var(--color-text-primary)] justify-center bg-[var(--color-body)] transition-all duration-500" /> </div> <div className="bg-[var(--color-body)] mt-1 text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)] text-center"> {progress.toFixed(0)}% Complete </div> </div> )} {/* Current stage indicator */} {currentStage && !isComplete && !error && ( <div className="bg-[var(--color-body)] flex items-center justify-center space-x-2 py-4"> <Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="text-lg font-medium text-[var(--color-text-primary)] text-[var(--color-text-primary)]"> {stages.find(s => s.id === currentStage.id)?.label} </span> </div> )} {/* Stage list */} <div className="bg-[var(--color-body)] space-y-2"> {stages.map((stage, index) => { const stageState = stageStates.find(s => s.id === stage.id) if (!stageState) return null return ( <div key={stage.id} className={cn( 'flex items-center space-x-3 p-3 rounded-lg transition-colors', stageState.status === 'loading' && 'bg-[var(--color-body)] dark:bg-[var(--color-body)]/20', stageState.status === 'completed' && 'bg-green-50 dark:bg-green-900/20', stageState.status === 'error' && 'bg-red-50 dark:bg-red-900/20' )} > {getStageIcon(stageState.status)} <div className="bg-[var(--color-body)] flex-1"> <div className={cn( 'text-sm font-medium', stageState.status === 'completed' && 'text-green-900 dark:text-green-100', stageState.status === 'error' && 'text-red-900 dark:text-red-100', stageState.status === 'loading' && 'text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]', stageState.status === 'pending' && 'text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]' )} > {stage.label} </div> {stageState.error && ( <div className="bg-[var(--color-body)] text-xs text-red-600 dark:text-red-400 mt-1"> {stageState.error} </div> )} </div> {stageState.status === 'completed' && ( <div className="bg-[var(--color-body)] text-xs text-green-600 dark:text-green-400">Complete</div> )} </div>   ))} </div> {/* Completion message */} {isComplete && ( <div className="bg-[var(--color-body)] flex items-center justify-center space-x-2 py-4"> <CheckCircle className="h-6 w-6 text-green-600" /> <span className="text-lg font-medium text-green-900 dark:text-green-100"> All stages completed successfully! </span> </div> )} {/* Error message */} {error && ( <div className="bg-[var(--color-body)] flex items-center justify-center space-x-2 py-4 text-red-600"> <AlertCircle className="h-6 w-6" /> <span className="text-lg font-medium">Loading failed: {error}</span> </div> )} {/* Action buttons */} {(error || isComplete) && ( <div className="bg-[var(--color-body)] flex justify-center space-x-4"> {error && ( <button onClick={() => start()} className="px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-body)] hover:bg-[var(--color-body)]/80 rounded-lg transition-colors" > Retry </button> )} </div> )} </div> )
}
