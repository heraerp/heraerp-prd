/**
 * HERA Scan-to-Cart Component
 * Smart Code: HERA.SALON.POS.COMPONENT.SCAN_TO_CART.V1
 *
 * ✅ ENTERPRISE FEATURES:
 * - Camera scanning (BarcodeDetector API for modern browsers)
 * - USB/Bluetooth scanner support (keyboard-wedge mode)
 * - Instant product lookup via RPC-based barcode search
 * - Quick-add modal for products not found
 * - Visual feedback and error handling
 * - Supports EAN13, UPC, CODE128, QR codes
 *
 * USAGE:
 * <ScanToCart onProductFound={(product) => addToCart(product)} />
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Scan, Camera, Keyboard, Loader2, CheckCircle2, XCircle, Plus, Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { useHeraProducts } from '@/hooks/useHeraProducts'

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

  // Quick-add modal state
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState<string>('')
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    selling_price: '',
    cost_price: ''
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef<boolean>(false)

  // Get product creation hook
  const { createProduct, isCreating } = useHeraProducts({ organizationId })

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
        // Barcode not found - show quick-add modal
        setScannedBarcode(barcode)
        setQuickAddForm({
          name: '',
          selling_price: '',
          cost_price: ''
        })
        setShowQuickAddModal(true)
        setMode('idle')
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

  // Handle quick-add product creation
  async function handleQuickAddProduct() {
    if (!quickAddForm.name || !quickAddForm.selling_price) {
      alert('Please enter product name and selling price')
      return
    }

    try {
      const newProduct = await createProduct({
        name: quickAddForm.name,
        selling_price: parseFloat(quickAddForm.selling_price) || 0,
        cost_price: parseFloat(quickAddForm.cost_price) || 0,
        barcode_primary: scannedBarcode,
        barcode_type: 'EAN13',
        status: 'active'
      })

      if (newProduct) {
        // Close modal
        setShowQuickAddModal(false)

        // Add to cart
        onProductFound({
          ...newProduct,
          price_market: parseFloat(quickAddForm.selling_price) || 0
        })

        setFeedbackMessage(`✓ Created and added: ${quickAddForm.name}`)
        setFeedbackType('success')
        setLastScanned(scannedBarcode)

        // Clear feedback after 2 seconds
        setTimeout(() => {
          setFeedbackMessage('')
          setFeedbackType(null)
        }, 2000)
      }
    } catch (error: any) {
      console.error('[ScanToCart] Quick-add error:', error)
      alert(`Failed to create product: ${error.message}`)
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
            <SalonLuxeButton
              onClick={startCameraScan}
              variant="primary"
              size="md"
              icon={<Camera className="w-4 h-4" />}
            >
              Scan with Camera
            </SalonLuxeButton>

            <SalonLuxeButton
              onClick={() => setMode('keyboard')}
              variant="outline"
              size="md"
              icon={<Keyboard className="w-4 h-4" />}
            >
              Keyboard Scanner
            </SalonLuxeButton>
          </>
        )}

        {mode === 'camera' && (
          <SalonLuxeButton
            onClick={stopCameraScan}
            variant="danger"
            size="md"
            icon={<XCircle className="w-4 h-4" />}
          >
            Stop Camera
          </SalonLuxeButton>
        )}

        {mode === 'keyboard' && (
          <SalonLuxeButton
            onClick={() => {
              setMode('idle')
              if (inputRef.current) {
                inputRef.current.value = ''
              }
            }}
            variant="outline"
            size="md"
            icon={<XCircle className="w-4 h-4" />}
          >
            Cancel
          </SalonLuxeButton>
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

      {/* Quick-Add Product Modal */}
      <Dialog open={showQuickAddModal} onOpenChange={setShowQuickAddModal}>
        <DialogContent
          className="sm:max-w-[500px]"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: COLORS.gold + '40',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                  border: `1px solid ${COLORS.gold}30`
                }}
              >
                <Package className="w-5 h-5" style={{ color: COLORS.gold }} />
              </div>
              <DialogTitle style={{ color: COLORS.champagne }}>Quick-Add Product</DialogTitle>
            </div>
            <DialogDescription style={{ color: COLORS.champagne, opacity: 0.7 }}>
              Product not found. Create it now and add to cart.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Scanned Barcode (Read-only) */}
            <div>
              <Label htmlFor="barcode" style={{ color: COLORS.champagne }}>
                Scanned Barcode
              </Label>
              <Input
                id="barcode"
                value={scannedBarcode}
                readOnly
                className="mt-1.5"
                style={{
                  backgroundColor: COLORS.charcoal + 'CC',
                  borderColor: COLORS.gold + '40',
                  color: COLORS.gold,
                  opacity: 0.8
                }}
              />
            </div>

            {/* Product Name */}
            <div>
              <Label htmlFor="name" style={{ color: COLORS.champagne }}>
                Product Name <span style={{ color: COLORS.gold }}>*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter product name"
                value={quickAddForm.name}
                onChange={e => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                className="mt-1.5"
                style={{
                  backgroundColor: COLORS.charcoal + 'CC',
                  borderColor: COLORS.gold + '40',
                  color: COLORS.champagne
                }}
                autoFocus
              />
            </div>

            {/* Selling Price */}
            <div>
              <Label htmlFor="selling_price" style={{ color: COLORS.champagne }}>
                Selling Price (AED) <span style={{ color: COLORS.gold }}>*</span>
              </Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={quickAddForm.selling_price}
                onChange={e => setQuickAddForm({ ...quickAddForm, selling_price: e.target.value })}
                className="mt-1.5"
                style={{
                  backgroundColor: COLORS.charcoal + 'CC',
                  borderColor: COLORS.gold + '40',
                  color: COLORS.champagne
                }}
              />
            </div>

            {/* Cost Price (Optional) */}
            <div>
              <Label htmlFor="cost_price" style={{ color: COLORS.champagne }}>
                Cost Price (AED) <span className="text-xs opacity-60">Optional</span>
              </Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={quickAddForm.cost_price}
                onChange={e => setQuickAddForm({ ...quickAddForm, cost_price: e.target.value })}
                className="mt-1.5"
                style={{
                  backgroundColor: COLORS.charcoal + 'CC',
                  borderColor: COLORS.gold + '40',
                  color: COLORS.champagne
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <SalonLuxeButton
              variant="outline"
              size="md"
              onClick={() => setShowQuickAddModal(false)}
              disabled={isCreating}
            >
              Cancel
            </SalonLuxeButton>
            <SalonLuxeButton
              variant="primary"
              size="md"
              onClick={handleQuickAddProduct}
              disabled={isCreating || !quickAddForm.name || !quickAddForm.selling_price}
              loading={isCreating}
              icon={!isCreating ? <Plus className="w-4 h-4" /> : undefined}
            >
              {isCreating ? 'Creating...' : 'Create & Add to Cart'}
            </SalonLuxeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
