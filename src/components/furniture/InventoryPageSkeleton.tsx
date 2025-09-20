import React from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function InventoryPageSkeleton() {
  return (
    <div className="bg-[var(--color-body)] space-y-6">
      {' '}
      {/* Header Skeleton */}{' '}
      <div className="flex justify-between items-center">
        {' '}
        <div>
          {' '}
          <Skeleton className="h-9 w-64 mb-2" /> <Skeleton className="h-5 w-96" />{' '}
        </div>{' '}
        <div className="bg-[var(--color-body)] flex gap-2">
          {' '}
          <Skeleton className="h-10 w-20" /> <Skeleton className="h-10 w-32" />{' '}
        </div>{' '}
      </div>{' '}
      {/* Stats Cards Skeleton */}{' '}
      <div className="bg-[var(--color-body)] grid grid-cols-1 md:grid-cols-4 gap-4">
        {' '}
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4 bg-[var(--color-body)]/50 border-[var(--color-border)]">
            {' '}
            <div className="flex items-center justify-between">
              {' '}
              <div className="space-y-1">
                {' '}
                <Skeleton className="h-4 w-24 mb-2" /> <Skeleton className="h-8 w-16 mb-1" />{' '}
                <Skeleton className="h-3 w-12" />{' '}
              </div>{' '}
              <Skeleton className="h-8 w-8 rounded" />{' '}
            </div>{' '}
          </Card>
        ))}{' '}
      </div>{' '}
      {/* Tabs and Search Bar Skeleton */}{' '}
      <div className="bg-[var(--color-body)] space-y-4">
        {' '}
        <div className="flex justify-between items-center">
          {' '}
          <Skeleton className="h-10 w-96" />{' '}
          <div className="flex gap-4">
            {' '}
            <Skeleton className="h-10 w-64" /> <Skeleton className="h-10 w-40" />{' '}
            <Skeleton className="h-10 w-40" />{' '}
          </div>{' '}
        </div>{' '}
        {/* Table Skeleton */}{' '}
        <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 border-[var(--color-border)]">
          {' '}
          {/* Table Header */}{' '}
          <div className="border-b border-[var(--color-border)] p-4">
            {' '}
            <div className="grid grid-cols-9 gap-4">
              {' '}
              <Skeleton className="h-4 w-16" /> <Skeleton className="h-4 w-32" />{' '}
              <Skeleton className="h-4 w-20" /> <Skeleton className="h-4 w-16" />{' '}
              <Skeleton className="h-4 w-16" /> <Skeleton className="h-4 w-16" />{' '}
              <Skeleton className="h-4 w-16" /> <Skeleton className="h-4 w-24" />{' '}
              <Skeleton className="h-4 w-16" />{' '}
            </div>{' '}
          </div>{' '}
          {/* Table Rows */}{' '}
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div
              key={i}
              className="bg-[var(--color-body)] border-b border-[var(--color-border)]/50 p-4"
            >
              {' '}
              <div className="grid grid-cols-9 gap-4 items-center">
                {' '}
                <Skeleton className="h-5 w-20" />{' '}
                <div className="bg-[var(--color-body)] space-y-1">
                  {' '}
                  <Skeleton className="h-5 w-32" /> <Skeleton className="h-4 w-20" />{' '}
                </div>{' '}
                <div className="flex items-center gap-2">
                  {' '}
                  <Skeleton className="h-4 w-4" /> <Skeleton className="h-5 w-24" />{' '}
                </div>{' '}
                <Skeleton className="h-5 w-12" /> <Skeleton className="h-5 w-12" />{' '}
                <Skeleton className="h-5 w-12" /> <Skeleton className="h-5 w-12" />{' '}
                <div className="flex items-center gap-2 justify-end">
                  {' '}
                  <Skeleton className="h-5 w-8" />{' '}
                  <Skeleton className="h-4 w-4 rounded-full" />{' '}
                </div>{' '}
                <div className="flex gap-1">
                  {' '}
                  <Skeleton className="h-8 w-8 rounded" />{' '}
                  <Skeleton className="h-8 w-8 rounded" />{' '}
                </div>{' '}
              </div>{' '}
            </div>
          ))}{' '}
        </Card>{' '}
      </div>{' '}
    </div>
  )
}
