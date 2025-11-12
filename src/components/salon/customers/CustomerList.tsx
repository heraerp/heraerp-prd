/**
 * Customer List Component
 * Enterprise-grade customer table/grid with salon luxe theme
 * Follows HERA DNA patterns from services/products
 */

'use client'

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MoreVertical,
  Edit,
  History,
  Trash2,
  Archive,
  ArchiveRestore,
  Mail,
  Phone,
  Star,
  User
} from 'lucide-react'
import type { CustomerEntity } from '@/hooks/useHeraCustomers'
import { format } from 'date-fns'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

interface CustomerListProps {
  customers: CustomerEntity[]
  viewMode?: 'list' | 'grid'
  onEdit: (customer: CustomerEntity) => void
  onViewHistory: (customer: CustomerEntity) => void
  onDelete: (customer: CustomerEntity) => void
  onArchive: (customer: CustomerEntity) => void
  onRestore: (customer: CustomerEntity) => void
}

export function CustomerList({
  customers,
  viewMode = 'list',
  onEdit,
  onViewHistory,
  onDelete,
  onArchive,
  onRestore
}: CustomerListProps) {
  if (viewMode === 'grid') {
    return (
      <CustomerGridView
        customers={customers}
        onEdit={onEdit}
        onViewHistory={onViewHistory}
        onDelete={onDelete}
        onArchive={onArchive}
        onRestore={onRestore}
      />
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: COLORS.charcoal + 'f5',
        border: `1px solid ${COLORS.bronze}30`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}
    >
      <Table>
        <TableHeader>
          <TableRow
            style={{
              backgroundColor: COLORS.charcoalLight,
              borderBottom: `1px solid ${COLORS.bronze}30`
            }}
          >
            <TableHead
              style={{ color: COLORS.bronze }}
              className="font-semibold uppercase text-xs tracking-wider"
            >
              Customer
            </TableHead>
            <TableHead
              style={{ color: COLORS.bronze }}
              className="font-semibold uppercase text-xs tracking-wider"
            >
              Contact
            </TableHead>
            <TableHead
              style={{ color: COLORS.bronze }}
              className="font-semibold uppercase text-xs tracking-wider"
            >
              Status
            </TableHead>
            <TableHead
              style={{ color: COLORS.bronze }}
              className="font-semibold uppercase text-xs tracking-wider"
            >
              Joined
            </TableHead>
            <TableHead
              style={{ color: COLORS.bronze }}
              className="font-semibold uppercase text-xs tracking-wider text-right"
            >
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12" style={{ color: COLORS.bronze }}>
                <User className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No customers found</p>
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer, index) => {
              const isDeleted = customer.status === 'deleted'
              const isArchived = customer.status === 'archived'
              const email = customer.dynamic_fields?.email?.value || customer.email
              const phone = customer.dynamic_fields?.phone?.value || customer.phone
              const isVIP = customer.dynamic_fields?.vip?.value || customer.vip

              return (
                <TableRow
                  key={customer.id}
                  className="group transition-all duration-300"
                  style={{
                    backgroundColor: index % 2 === 0 ? 'transparent' : COLORS.charcoalLight + '30',
                    borderBottom: `1px solid ${COLORS.bronze}15`
                  }}
                >
                  {/* Customer Name & VIP Badge */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${isVIP ? COLORS.gold : COLORS.bronze}20 0%, ${isVIP ? COLORS.gold : COLORS.bronze}10 100%)`,
                          border: `1px solid ${isVIP ? COLORS.gold : COLORS.bronze}40`
                        }}
                      >
                        {isVIP ? (
                          <Star className="h-4 w-4" style={{ color: COLORS.gold }} />
                        ) : (
                          <User className="h-4 w-4" style={{ color: COLORS.bronze }} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: COLORS.champagne }}>
                          {customer.entity_name}
                        </p>
                        {isVIP && (
                          <p className="text-[10px] opacity-70" style={{ color: COLORS.gold }}>
                            VIP Customer
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell>
                    <div className="space-y-1">
                      {email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" style={{ color: COLORS.bronze }} />
                          <span className="text-xs" style={{ color: COLORS.lightText }}>
                            {email}
                          </span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" style={{ color: COLORS.bronze }} />
                          <span className="text-xs" style={{ color: COLORS.lightText }}>
                            {phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    {isDeleted ? (
                      <Badge
                        variant="secondary"
                        className="bg-red-500/20 text-red-400 border-red-500/30"
                      >
                        Deleted
                      </Badge>
                    ) : isArchived ? (
                      <Badge
                        variant="secondary"
                        className="bg-muted/50 text-muted-foreground border-border"
                      >
                        Archived
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-green-500/20 text-green-400 border-green-500/30"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>

                  {/* Joined Date */}
                  <TableCell>
                    <span className="text-xs" style={{ color: COLORS.lightText }}>
                      {customer.created_at && !isNaN(new Date(customer.created_at).getTime())
                        ? format(new Date(customer.created_at), 'MMM d, yyyy')
                        : 'N/A'}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    {isDeleted ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="transition-all hover:scale-110"
                            style={{
                              backgroundColor: COLORS.charcoalLight,
                              border: `1px solid ${COLORS.gold}40`
                            }}
                          >
                            <MoreVertical className="h-4 w-4" style={{ color: COLORS.gold }} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          style={{
                            backgroundColor: COLORS.charcoal,
                            border: `1px solid ${COLORS.bronze}33`
                          }}
                        >
                          <DropdownMenuItem
                            onClick={() => onRestore(customer)}
                            style={{ color: COLORS.lightText }}
                            className="hover:!bg-green-900/20 hover:!text-green-300"
                          >
                            <ArchiveRestore className="mr-2 h-4 w-4" />
                            Restore to Active
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="transition-all hover:scale-110"
                            style={{
                              backgroundColor: COLORS.charcoalLight,
                              border: `1px solid ${COLORS.gold}40`
                            }}
                          >
                            <MoreVertical className="h-4 w-4" style={{ color: COLORS.gold }} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          style={{
                            backgroundColor: COLORS.charcoal,
                            border: `1px solid ${COLORS.bronze}33`
                          }}
                        >
                          <DropdownMenuItem
                            onClick={() => onEdit(customer)}
                            style={{ color: COLORS.lightText }}
                            className="hover:!bg-cyan-900/20 hover:!text-cyan-300"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onViewHistory(customer)}
                            style={{ color: COLORS.lightText }}
                            className="hover:!bg-purple-900/20 hover:!text-purple-300"
                          >
                            <History className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator
                            style={{ backgroundColor: COLORS.bronze + '30' }}
                          />
                          {isArchived ? (
                            <DropdownMenuItem
                              onClick={() => onRestore(customer)}
                              style={{ color: COLORS.lightText }}
                              className="hover:!bg-green-900/20 hover:!text-green-300"
                            >
                              <ArchiveRestore className="mr-2 h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => onArchive(customer)}
                              style={{ color: COLORS.lightText }}
                              className="hover:!bg-muted hover:!text-foreground"
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => onDelete(customer)}
                            className="hover:!bg-red-900/20 hover:!text-red-300"
                            style={{ color: '#FF6B6B' }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Grid View Component
function CustomerGridView({
  customers,
  onEdit,
  onViewHistory,
  onDelete,
  onArchive,
  onRestore
}: CustomerListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {customers.length === 0 ? (
        <div className="col-span-full text-center py-12" style={{ color: COLORS.bronze }}>
          <User className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No customers found</p>
        </div>
      ) : (
        customers.map((customer, index) => {
          const isDeleted = customer.status === 'deleted'
          const isArchived = customer.status === 'archived'
          const email = customer.dynamic_fields?.email?.value || customer.email
          const phone = customer.dynamic_fields?.phone?.value || customer.phone
          const isVIP = customer.dynamic_fields?.vip?.value || customer.vip

          return (
            <Card
              key={customer.id || `customer-${index}`}
              className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer ${isArchived ? 'opacity-60' : ''}`}
              style={{
                backgroundColor: COLORS.charcoal + 'f5',
                border: `1px solid ${isVIP ? COLORS.gold : COLORS.bronze}40`,
                boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 20px ${isVIP ? COLORS.gold : COLORS.bronze}10`
              }}
            >
              {/* Top Right: Status Badges */}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                {/* VIP Badge */}
                {isVIP && !isDeleted && !isArchived && (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: COLORS.gold + '20',
                      color: COLORS.gold,
                      border: `1px solid ${COLORS.gold}40`
                    }}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    VIP
                  </Badge>
                )}

                {/* Status Badges */}
                {isDeleted ? (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-red-500/20 text-red-400 border-red-500/30"
                  >
                    Deleted
                  </Badge>
                ) : isArchived ? (
                  <Badge
                    variant="secondary"
                    className="text-[9px] font-bold tracking-tight px-1.5 py-0.5"
                    style={{
                      backgroundColor: COLORS.bronze + '25',
                      color: COLORS.champagne,
                      border: `1.5px solid ${COLORS.gold}`,
                      boxShadow: `0 0 6px ${COLORS.gold}30`
                    }}
                  >
                    ARC
                  </Badge>
                ) : null}
              </div>

              <CardContent className="p-4">
                {/* Avatar & Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${isVIP ? COLORS.gold : COLORS.bronze}20 0%, ${isVIP ? COLORS.gold : COLORS.bronze}10 100%)`,
                      border: `1px solid ${isVIP ? COLORS.gold : COLORS.bronze}40`
                    }}
                  >
                    {isVIP ? (
                      <Star className="h-5 w-5" style={{ color: COLORS.gold }} />
                    ) : (
                      <User className="h-5 w-5" style={{ color: COLORS.bronze }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: COLORS.champagne }}>
                      {customer.entity_name}
                    </p>
                    <p className="text-[10px] opacity-60" style={{ color: COLORS.lightText }}>
                      Member since {customer.created_at && !isNaN(new Date(customer.created_at).getTime())
                        ? format(new Date(customer.created_at), 'MMM yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-3">
                  {email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" style={{ color: COLORS.bronze }} />
                      <span className="text-xs truncate" style={{ color: COLORS.lightText }}>
                        {email}
                      </span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" style={{ color: COLORS.bronze }} />
                      <span className="text-xs" style={{ color: COLORS.lightText }}>
                        {phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div
                  className="flex justify-end gap-2 pt-2 border-t"
                  style={{ borderColor: COLORS.bronze + '20' }}
                >
                  {isDeleted ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRestore(customer)}
                      className="text-xs hover:bg-green-900/20 hover:text-green-300"
                      style={{ color: COLORS.lightText }}
                    >
                      <ArchiveRestore className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(customer)}
                        className="text-xs hover:bg-cyan-900/20 hover:text-cyan-300"
                        style={{ color: COLORS.lightText }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewHistory(customer)}
                        className="text-xs hover:bg-purple-900/20 hover:text-purple-300"
                        style={{ color: COLORS.lightText }}
                      >
                        <History className="h-3 w-3 mr-1" />
                        History
                      </Button>
                      {isArchived ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRestore(customer)}
                          className="text-xs hover:bg-green-900/20 hover:text-green-300"
                          style={{ color: COLORS.lightText }}
                        >
                          <ArchiveRestore className="h-3 w-3 mr-1" />
                          Restore
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onArchive(customer)}
                          className="text-xs hover:bg-muted hover:text-foreground"
                          style={{ color: COLORS.lightText }}
                        >
                          <Archive className="h-3 w-3 mr-1" />
                          Archive
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(customer)}
                        className="text-xs hover:bg-red-900/20 hover:text-red-300"
                        style={{ color: '#FF6B6B' }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
