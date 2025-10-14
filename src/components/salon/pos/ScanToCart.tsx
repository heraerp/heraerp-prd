/**
 * HERA Scan-to-Cart Component
 * Smart Code: HERA.SALON.POS.COMPONENT.SCAN_TO_CART.V1
 *
 * ✅ ENTERPRISE FEATURES:
 * - Camera scanning (BarcodeDetector API for modern browsers)
 * - USB/Bluetooth scanner support (keyboard-wedge mode)
 * - Instant product lookup via indexed barcode search
 * - Visual feedback and error handling
 * - Supports EAN13, UPC, CODE128, QR codes
 *
 * USAGE:
 * <ScanToCart onProductFound={(product) => addToCart(product)} />
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Scan, Camera, Keyboard, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

const COLORS = {
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  charcoal: '#1A1A1A',
  emerald: '#0F6F5C',
  error: '#FF6B6B'
}

interface ScanToCartProps {
  organizationId: string
  onProductFound: (product: any) => void
  onError?: (message: string) => void
}

type ScanMode = 'idle' | 'camera' | 'keyboard' | 'searching'

export function ScanToCart({ organizationId, onProductFound, onError }: ScanToCartProps) {
  const [mode, setMode] = useState<ScanMode>('idle')
  const [lastScanned, setLastScanned] = useState<string>('')
  const [feedbackMessage, setFeedbackMessage] = useState<string>('')
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef<boolean>(false)

  // Auto-focus keyboard input when in keyboard mode
  useEffect(() => {
    if (mode === 'keyboard') {
      inputRef.current?.focus()
    }
  }, [mode])

  // Cleanup video stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Lookup product by barcode
  async function lookupBarcode(barcode: string) {
    setMode('searching')
    setFeedbackMessage('')
    setFeedbackType(null)

    try {
      const response = await fetch(
        `/api/v2/products/barcode-search?barcode=${encodeURIComponent(barcode)}`,
        {
          headers: {
            'x-hera-api-version': 'v2',
            'x-hera-org': organizationId
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search barcode')
      }

      if (data.found && data.items && data.items.length > 0) {
        // Product found! Add to cart
        const product = data.items[0]
        onProductFound(product)

        setFeedbackMessage(`✓ Added: ${product.entity_name}`)
        setFeedbackType('success')
        setLastScanned(barcode)

        // Clear feedback after 2 seconds
        setTimeout(() => {
          setFeedbackMessage('')
          setFeedbackType(null)
          setMode('idle')
        }, 2000)
      } else {
        // Barcode not found
        setFeedbackMessage(`✗ No product found with barcode: ${barcode}`)
        setFeedbackType('error')

        if (onError) {
          onError(`No product found with barcode: ${barcode}`)
        }

        setTimeout(() => {
          setFeedbackMessage('')
          setFeedbackType(null)
          setMode('idle')
        }, 3000)
      }
    } catch (error: any) {
      console.error('[ScanToCart] Lookup error:', error)
      setFeedbackMessage(`✗ Error: ${error.message}`)
      setFeedbackType('error')

      if (onError) {
        onError(error.message)
      }

      setTimeout(() => {
        setFeedbackMessage('')
        setFeedbackType(null)
        setMode('idle')
      }, 3000)
    }
  }

  // Start camera scanning (modern browsers)
  async function startCameraScan() {
    // Check if BarcodeDetector is available
    if (!('BarcodeDetector' in window)) {
      alert(
        'Camera barcode scanning is not supported in this browser. Please use the keyboard scanner mode or try Chrome/Edge.'
      )
      return
    }

    try {
      setMode('camera')
      scanningRef.current = true

      // @ts-ignore - BarcodeDetector is experimental
      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
      })

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream

      // Create video element
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true
      videoRef.current = video

      await video.play()

      // Start scanning loop
      const scanFrame = async () => {
        if (!scanningRef.current || mode !== 'camera') {
          stream.getTracks().forEach(track => track.stop())
          return
        }

        try {
          const barcodes = await detector.detect(video)

          if (barcodes.length > 0 && barcodes[0].rawValue) {
            // Found a barcode!
            scanningRef.current = false
            stream.getTracks().forEach(track => track.stop())

            const barcode = barcodes[0].rawValue
            await lookupBarcode(barcode)
            return
          }
        } catch (err) {
          console.error('[ScanToCart] Detection error:', err)
        }

        // Continue scanning
        requestAnimationFrame(scanFrame)
      }

      requestAnimationFrame(scanFrame)
    } catch (error: any) {
      console.error('[ScanToCart] Camera error:', error)
      alert(`Camera error: ${error.message}. Please check camera permissions or use keyboard mode.`)
      setMode('idle')
      scanningRef.current = false
    }
  }

  // Stop camera scanning
  function stopCameraScan() {
    scanningRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setMode('idle')
  }

  // Handle keyboard scanner input (USB/Bluetooth barcode scanners)
  function handleKeyboardInput(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      const barcode = (event.target as HTMLInputElement).value.trim()
      ;(event.target as HTMLInputElement).value = ''

      if (barcode) {
        lookupBarcode(barcode)
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Scan Controls */}
      <div className="flex items-center gap-2">
        {mode === 'idle' && (
          <>
            <Button
              onClick={startCameraScan}
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, #B8860B 100%)`,
                color: COLORS.charcoal
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
            >
              <Camera className="w-4 h-4" />
              <span>Scan with Camera</span>
            </Button>

            <Button
              onClick={() => setMode('keyboard')}
              variant="outline"
              style={{
                borderColor: COLORS.gold + '60',
                color: COLORS.champagne
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
            >
              <Keyboard className="w-4 h-4" />
              <span>Keyboard Scanner</span>
            </Button>
          </>
        )}

        {mode === 'camera' && (
          <Button
            onClick={stopCameraScan}
            variant="outline"
            style={{
              borderColor: COLORS.error + '60',
              color: COLORS.error
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
          >
            <XCircle className="w-4 h-4" />
            <span>Stop Camera</span>
          </Button>
        )}

        {mode === 'keyboard' && (
          <Button
            onClick={() => {
              setMode('idle')
              if (inputRef.current) {
                inputRef.current.value = ''
              }
            }}
            variant="outline"
            style={{
              borderColor: COLORS.gold + '60',
              color: COLORS.champagne
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
        )}

        {mode === 'searching' && (
          <div className="flex items-center gap-2 px-4 py-2">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: COLORS.gold }} />
            <span style={{ color: COLORS.champagne }}>Searching...</span>
          </div>
        )}
      </div>

      {/* Keyboard Scanner Input (hidden, only focused) */}
      {mode === 'keyboard' && (
        <div>
          <label
            htmlFor="barcode-input"
            className="block text-sm font-medium mb-1"
            style={{ color: COLORS.champagne }}
          >
            Scan or type barcode (press Enter):
          </label>
          <Input
            id="barcode-input"
            ref={inputRef}
            type="text"
            placeholder="Position cursor here and scan..."
            onKeyDown={handleKeyboardInput}
            autoFocus
            style={{
              backgroundColor: COLORS.charcoal,
              borderColor: COLORS.gold + '40',
              color: COLORS.champagne
            }}
            className="w-full px-3 py-2 rounded-lg border"
          />
        </div>
      )}

      {/* Feedback Message */}
      {feedbackMessage && (
        <Alert
          style={{
            backgroundColor:
              feedbackType === 'success' ? COLORS.emerald + '20' : COLORS.error + '20',
            borderColor: feedbackType === 'success' ? COLORS.emerald + '60' : COLORS.error + '60'
          }}
          className="border"
        >
          <div className="flex items-center gap-2">
            {feedbackType === 'success' ? (
              <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.emerald }} />
            ) : (
              <XCircle className="w-4 h-4" style={{ color: COLORS.error }} />
            )}
            <AlertDescription style={{ color: COLORS.champagne }}>
              {feedbackMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Camera Scanning Status */}
      {mode === 'camera' && (
        <div
          className="p-4 rounded-lg border text-center"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: COLORS.gold + '40'
          }}
        >
          <Scan className="w-8 h-8 mx-auto mb-2 animate-pulse" style={{ color: COLORS.gold }} />
          <p className="text-sm font-medium" style={{ color: COLORS.champagne }}>
            Position barcode in front of camera
          </p>
          <p className="text-xs mt-1 opacity-70" style={{ color: COLORS.champagne }}>
            Scanning will happen automatically
          </p>
        </div>
      )}

      {/* Last Scanned */}
      {lastScanned && mode === 'idle' && (
        <div className="text-xs opacity-60" style={{ color: COLORS.champagne }}>
          Last scanned: {lastScanned}
        </div>
      )}
    </div>
  )
}
