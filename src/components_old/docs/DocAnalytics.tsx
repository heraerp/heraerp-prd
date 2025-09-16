'use client'

import { useEffect } from 'react'
import { trackDocView } from '@/lib/hera-docs'

interface DocAnalyticsProps {
  pageId: string
  docType: 'dev' | 'user'
  slug: string
  title: string
}

export default function DocAnalytics({ pageId, docType, slug, title }: DocAnalyticsProps) {
  useEffect(() => {
    // Track page view on mount
    const trackPageView = async () => {
      try {
        await trackDocView(pageId, docType, {
          slug,
          title,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      } catch (error) {
        console.error('Failed to track page view:', error)
      }
    }

    trackPageView()

    // Track scroll depth
    let maxScroll = 0
    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      )
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent
      }
    }

    // Track time on page
    const startTime = Date.now()

    const handleScroll = () => trackScroll()
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000)

      // Send analytics data before page unload
      navigator.sendBeacon(
        '/api/v1/analytics/page-exit',
        JSON.stringify({
          pageId,
          docType,
          slug,
          timeOnPage,
          maxScroll
        })
      )
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pageId, docType, slug, title])

  // This component doesn't render anything visible
  return null
}
