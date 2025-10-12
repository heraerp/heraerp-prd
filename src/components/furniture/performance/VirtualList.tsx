import React, { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number | ((index: number) => number)
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
  onEndReached?: () => void
  endReachedThreshold?: number
  loading?: boolean
  emptyMessage?: string
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className,
  overscan = 3,
  onEndReached,
  endReachedThreshold = 100,
  loading = false,
  emptyMessage = 'No items to display'
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const endReachedRef = useRef(false)

  const getItemHeight = useCallback(
    (index: number) => {
      return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight
    },
    [itemHeight]
  )

  const itemPositions = useRef<number[]>([])

  useEffect(() => {
    let position = 0
    itemPositions.current = items.map((_, index) => {
      const currentPosition = position
      position += getItemHeight(index)
      return currentPosition
    })
  }, [items, getItemHeight])

  const totalHeight = itemPositions.current[items.length - 1] + (items.length > 0 ? getItemHeight(items.length - 1) : 0)

  const getVisibleRange = useCallback(() => {
    const start = Math.max(
      0,
      itemPositions.current.findIndex(pos => pos + getItemHeight(0) > scrollTop) - overscan
    )

    const end = Math.min(
      items.length - 1,
      itemPositions.current.findIndex(pos => pos > scrollTop + containerHeight) + overscan
    )

    return { start, end: end === -1 ? items.length - 1 : end }
  }, [scrollTop, containerHeight, items.length, overscan, getItemHeight])

  const { start, end } = getVisibleRange()

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const newScrollTop = containerRef.current.scrollTop
    setScrollTop(newScrollTop)

    if (onEndReached && !endReachedRef.current && !loading) {
      const distanceFromBottom = totalHeight - newScrollTop - containerHeight
      if (distanceFromBottom < endReachedThreshold) {
        endReachedRef.current = true
        onEndReached()
      }
    }
  }, [totalHeight, containerHeight, endReachedThreshold, onEndReached, loading])

  useEffect(() => {
    if (!loading) {
      endReachedRef.current = false
    }
  }, [loading])

  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateContainerHeight()

    const resizeObserver = new ResizeObserver(updateContainerHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const visibleItems = []
  for (let i = start; i <= end; i++) {
    if (items[i]) {
      visibleItems.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute' as const,
          top: itemPositions.current[i],
          left: 0,
          right: 0,
          height: getItemHeight(i)
        }
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}

        {loading && (
          <div
            className="absolute left-0 right-0 flex items-center justify-center p-4"
            style={{ top: totalHeight }}
          >
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading more items...</span>
            </div>
          </div>
        )}

        {items.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}