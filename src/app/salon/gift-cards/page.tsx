'use client'

import React, { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth'
import { apiV2 } from '@/lib/client/fetchV2'
import { Plus, Gift, DollarSign, Calendar, Search, Download, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Alert } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface GiftCard {
  id: string
  entity_name: string
  entity_code: string
  metadata: {
    initial_value: number
    current_balance: number
    status: 'active' | 'redeemed' | 'expired' | 'cancelled'
    expiry_date?: string
    recipient_name?: string
    recipient_email?: string
    recipient_phone?: string
    purchaser_name?: string
    purchaser_email?: string
    message?: string
    activated_date?: string
    last_used_date?: string
  }
  created_at: string
}

interface GiftCardTransaction {
  id: string
  transaction_date: string
  total_amount: number
  transaction_type: string
  metadata: {
    description?: string
    remaining_balance?: number
  }
}

export default function GiftCardsPage() {
  const { currentOrganization, isAuthenticated, contextLoading } = useHERAAuth()
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  const [transactions, setTransactions] = useState<GiftCardTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)

  // Form state for new gift card
  const [formData, setFormData] = useState({
    amount: '',
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    purchaserName: '',
    purchaserEmail: '',
    message: '',
    expiryMonths: '12'
  })

  // Transaction form state
  const [transactionData, setTransactionData] = useState({
    type: 'redemption',
    amount: '',
    description: ''
  })

  const organizationId = currentOrganization?.id

  // Load gift cards
  const loadGiftCards = async () => {
    if (!organizationId) return

    setLoading(true)
    try {
      const { data } = await apiV2.get('entities', {
        entity_type: 'gift_card',
        organization_id: organizationId
      })

      setGiftCards(data.entities || [])
    } catch (error) {
      console.error('Error loading gift cards:', error)
      toast.error('Failed to load gift cards')
    } finally {
      setLoading(false)
    }
  }

  // Load transactions for a gift card
  const loadTransactions = async (giftCardId: string) => {
    try {
      const { data } = await apiV2.get('transactions', {
        from_entity_id: giftCardId,
        organization_id: organizationId
      })

      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Failed to load transactions')
    }
  }

  useEffect(() => {
    if (organizationId && !contextLoading) {
      loadGiftCards()
    }
  }, [organizationId, contextLoading])

  // Create new gift card
  const handleCreateGiftCard = async () => {
    try {
      // Generate gift card code
      const code = `GC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      // Calculate expiry date
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + parseInt(formData.expiryMonths))

      // Create gift card entity
      const { data: giftCard } = await apiV2.post('entities', {
        entity_type: 'gift_card',
        entity_name: `Gift Card - ${formData.recipientName || 'Anonymous'}`,
        entity_code: code,
        organization_id: organizationId,
        smart_code: 'HERA.SALON.GIFT.CARD.V1',
        metadata: {
          initial_value: parseFloat(formData.amount),
          current_balance: parseFloat(formData.amount),
          status: 'active',
          expiry_date: expiryDate.toISOString(),
          recipient_name: formData.recipientName,
          recipient_email: formData.recipientEmail,
          recipient_phone: formData.recipientPhone,
          purchaser_name: formData.purchaserName,
          purchaser_email: formData.purchaserEmail,
          message: formData.message,
          activated_date: new Date().toISOString()
        }
      })

      // Create initial transaction for gift card purchase
      await apiV2.post('transactions', {
        transaction_type: 'gift_card_purchase',
        organization_id: organizationId,
        from_entity_id: giftCard.id,
        total_amount: parseFloat(formData.amount),
        transaction_date: new Date().toISOString(),
        smart_code: 'HERA.SALON.GIFT.CARD.PURCHASE.V1',
        metadata: {
          description: 'Gift card purchase',
          gift_card_code: code
        }
      })

      toast.success('Gift card created successfully!')
      setShowCreateDialog(false)
      setFormData({
        amount: '',
        recipientName: '',
        recipientEmail: '',
        recipientPhone: '',
        purchaserName: '',
        purchaserEmail: '',
        message: '',
        expiryMonths: '12'
      })
      loadGiftCards()
    } catch (error) {
      console.error('Error creating gift card:', error)
      toast.error('Failed to create gift card')
    }
  }

  // Process gift card transaction
  const handleTransaction = async () => {
    if (!selectedCard) return

    try {
      const amount = parseFloat(transactionData.amount)
      const isRedemption = transactionData.type === 'redemption'

      // Check if there's sufficient balance for redemption
      if (isRedemption && amount > selectedCard.metadata.current_balance) {
        toast.error('Insufficient gift card balance')
        return
      }

      // Calculate new balance
      const newBalance = isRedemption
        ? selectedCard.metadata.current_balance - amount
        : selectedCard.metadata.current_balance + amount

      // Create transaction
      await apiV2.post('transactions', {
        transaction_type: transactionData.type,
        organization_id: organizationId,
        from_entity_id: selectedCard.id,
        total_amount: amount,
        transaction_date: new Date().toISOString(),
        smart_code: isRedemption
          ? 'HERA.SALON.GIFT.CARD.REDEMPTION.V1'
          : 'HERA.SALON.GIFT.CARD.RELOAD.V1',
        metadata: {
          description: transactionData.description || `Gift card ${transactionData.type}`,
          remaining_balance: newBalance
        }
      })

      // Update gift card balance
      await apiV2.put('entities', {
        id: selectedCard.id,
        metadata: {
          ...selectedCard.metadata,
          current_balance: newBalance,
          last_used_date: new Date().toISOString()
        }
      })

      toast.success(`Gift card ${transactionData.type} successful!`)
      setShowTransactionDialog(false)
      setTransactionData({ type: 'redemption', amount: '', description: '' })
      loadGiftCards()
      loadTransactions(selectedCard.id)
    } catch (error) {
      console.error('Error processing transaction:', error)
      toast.error('Failed to process transaction')
    }
  }

  // Filter gift cards
  const filteredGiftCards = giftCards.filter(card => {
    const matchesSearch =
      card.entity_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.metadata.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.metadata.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || card.metadata.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Check auth
  if (!isAuthenticated) {
    return <Alert>Please log in to access this page.</Alert>
  }

  if (contextLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!organizationId) {
    return <Alert>No organization context found.</Alert>
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold !text-gray-900 dark:!text-gray-100">Gift Cards</h1>
          <p className="!text-gray-600 dark:!text-gray-400 mt-2">
            Manage salon gift cards and track balances
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create Gift Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Gift Card</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiry">Validity Period</Label>
                  <Select
                    value={formData.expiryMonths}
                    onValueChange={v => setFormData({ ...formData, expiryMonths: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Recipient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Recipient Name"
                    value={formData.recipientName}
                    onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                  />
                  <Input
                    placeholder="Recipient Email"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={e => setFormData({ ...formData, recipientEmail: e.target.value })}
                  />
                  <Input
                    placeholder="Recipient Phone"
                    value={formData.recipientPhone}
                    onChange={e => setFormData({ ...formData, recipientPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Purchaser Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Purchaser Name"
                    value={formData.purchaserName}
                    onChange={e => setFormData({ ...formData, purchaserName: e.target.value })}
                  />
                  <Input
                    placeholder="Purchaser Email"
                    type="email"
                    value={formData.purchaserEmail}
                    onChange={e => setFormData({ ...formData, purchaserEmail: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to the gift card..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateGiftCard}
                disabled={!formData.amount || parseFloat(formData.amount) <= 0}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Create Gift Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by code, name, or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="redeemed">Fully Redeemed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-300">Total Active Cards</p>
              <p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">
                {giftCards.filter(c => c.metadata.status === 'active').length}
              </p>
            </div>
            <Gift className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-300">Total Balance</p>
              <p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">
                {formatCurrency(
                  giftCards
                    .filter(c => c.metadata.status === 'active')
                    .reduce((sum, c) => sum + (c.metadata.current_balance || 0), 0)
                )}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-300">Redeemed This Month</p>
              <p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">
                {formatCurrency(0)} {/* TODO: Calculate from transactions */}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-300">Expiring Soon</p>
              <p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">
                {
                  giftCards.filter(c => {
                    if (!c.metadata.expiry_date) return false
                    const daysUntilExpiry = Math.floor(
                      (new Date(c.metadata.expiry_date).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
                  }).length
                }
              </p>
            </div>
            <Calendar className="h-8 w-8 text-amber-500" />
          </div>
        </Card>
      </div>

      {/* Gift Cards List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gift Card Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading gift cards...
                  </td>
                </tr>
              ) : filteredGiftCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No gift cards found
                  </td>
                </tr>
              ) : (
                filteredGiftCards.map(card => (
                  <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Gift className="h-5 w-5 text-purple-500 mr-2" />
                        <span className="font-mono text-sm">{card.entity_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium !text-gray-900 dark:!text-gray-100">
                          {card.metadata.recipient_name || 'Anonymous'}
                        </div>
                        {card.metadata.recipient_email && (
                          <div className="text-gray-500">{card.metadata.recipient_email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium !text-gray-900 dark:!text-gray-100">
                          {formatCurrency(card.metadata.current_balance)}
                        </div>
                        <div className="text-gray-500">
                          of {formatCurrency(card.metadata.initial_value)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${card.metadata.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                        ${card.metadata.status === 'redeemed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' : ''}
                        ${card.metadata.status === 'expired' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
                        ${card.metadata.status === 'cancelled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                      `}
                      >
                        {card.metadata.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {card.metadata.expiry_date
                        ? new Date(card.metadata.expiry_date).toLocaleDateString()
                        : 'No expiry'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCard(card)
                            loadTransactions(card.id)
                            setShowTransactionDialog(true)
                          }}
                          disabled={card.metadata.status !== 'active'}
                        >
                          Use Card
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // TODO: Implement send gift card functionality
                            toast.info('Send gift card feature coming soon!')
                          }}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gift Card Transaction</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Gift Card</p>
                    <p className="font-mono font-medium">{selectedCard.entity_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedCard.metadata.current_balance)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="transaction-type">Transaction Type</Label>
                  <Select
                    value={transactionData.type}
                    onValueChange={v => setTransactionData({ ...transactionData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="redemption">Redemption</SelectItem>
                      <SelectItem value="reload">Reload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={transactionData.amount}
                    onChange={e =>
                      setTransactionData({ ...transactionData, amount: e.target.value })
                    }
                  />
                  {transactionData.type === 'redemption' &&
                    parseFloat(transactionData.amount) > selectedCard.metadata.current_balance && (
                      <p className="text-sm text-red-500 mt-1">Amount exceeds available balance</p>
                    )}
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Enter transaction description..."
                    value={transactionData.description}
                    onChange={e =>
                      setTransactionData({ ...transactionData, description: e.target.value })
                    }
                  />
                </div>

                {transactionData.amount && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      New balance after {transactionData.type}:{' '}
                      <span className="font-bold">
                        {formatCurrency(
                          transactionData.type === 'redemption'
                            ? selectedCard.metadata.current_balance -
                                parseFloat(transactionData.amount)
                            : selectedCard.metadata.current_balance +
                                parseFloat(transactionData.amount)
                        )}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Recent transactions */}
              {transactions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recent Transactions</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {transactions.map(txn => (
                      <div
                        key={txn.id}
                        className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <div>
                          <p>{txn.metadata.description || txn.transaction_type}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(txn.transaction_date).toLocaleString()}
                          </p>
                        </div>
                        <p
                          className={
                            txn.transaction_type === 'redemption'
                              ? 'text-red-600'
                              : 'text-green-600'
                          }
                        >
                          {txn.transaction_type === 'redemption' ? '-' : '+'}
                          {formatCurrency(txn.total_amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTransactionDialog(false)
                    setTransactionData({ type: 'redemption', amount: '', description: '' })
                    setTransactions([])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransaction}
                  disabled={
                    !transactionData.amount ||
                    parseFloat(transactionData.amount) <= 0 ||
                    (transactionData.type === 'redemption' &&
                      parseFloat(transactionData.amount) > selectedCard.metadata.current_balance)
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Process {transactionData.type}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
