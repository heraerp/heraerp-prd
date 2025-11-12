/**
 * Domain News Panel Component
 * Smart Code: HERA.RETAIL.DOMAIN.NEWS_PANEL.v1
 * 
 * Displays domain-specific news, updates, and announcements
 * Filters content based on the current domain context
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown,
  Clock,
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  content: string
  category: 'update' | 'feature' | 'alert' | 'maintenance'
  domain?: string
  timestamp: string
  timeAgo: string
  image?: string
  link?: string
  priority: 'high' | 'medium' | 'low'
}

interface DomainNewsPanelProps {
  domain: string
  className?: string
}

export default function DomainNewsPanel({ domain, className }: DomainNewsPanelProps) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    loadDomainNews()
  }, [domain])

  const loadDomainNews = async () => {
    setIsLoading(true)
    
    try {
      // Simulate API call - replace with actual news service
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: `HERA ${domain.charAt(0).toUpperCase() + domain.slice(1)} 2025.4 Enhancement`,
          content: `New AI-powered features now available for ${domain} operations, including automated insights and intelligent recommendations for better decision making...`,
          category: 'feature',
          domain,
          timestamp: new Date().toISOString(),
          timeAgo: '2 hours ago',
          image: '/api/placeholder/400/200',
          priority: 'high'
        },
        {
          id: '2',
          title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Performance Optimization`,
          content: `System performance improvements have been deployed, resulting in 40% faster load times and improved user experience across all ${domain} modules.`,
          category: 'update',
          domain,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          timeAgo: '1 day ago',
          priority: 'medium'
        },
        {
          id: '3',
          title: 'Scheduled Maintenance Notification',
          content: `Planned maintenance window scheduled for this weekend. ${domain.charAt(0).toUpperCase() + domain.slice(1)} services may be temporarily unavailable.`,
          category: 'maintenance',
          domain,
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          timeAgo: '2 days ago',
          priority: 'medium'
        },
        {
          id: '4',
          title: 'Integration Updates Available',
          content: `New third-party integrations now supported for ${domain} operations, including enhanced data synchronization capabilities.`,
          category: 'feature',
          domain,
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          timeAgo: '3 days ago',
          priority: 'low'
        }
      ]

      setNewsItems(mockNews)
    } catch (error) {
      console.error('Error loading domain news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      case 'update':
        return <Package className="w-4 h-4 text-green-600" />
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case 'maintenance':
        return <CheckCircle className="w-4 h-4 text-purple-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'update':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'alert':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'maintenance':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDomainName = (domain: string) => {
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {formatDomainName(domain)} News
          </h2>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
          </button>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={loadDomainNews}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {newsItems.map((item) => (
                <Card 
                  key={item.id} 
                  className="border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => item.link && window.open(item.link, '_blank')}
                >
                  {item.image && (
                    <div className="h-32 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                      <div className="absolute top-3 left-3">
                        <Badge className={getCategoryColor(item.category)}>
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(item.category)}
                            <span className="text-xs capitalize">{item.category}</span>
                          </div>
                        </Badge>
                      </div>
                      {item.link && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    {!item.image && (
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getCategoryColor(item.category)}>
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(item.category)}
                            <span className="text-xs capitalize">{item.category}</span>
                          </div>
                        </Badge>
                        {item.link && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2 leading-tight">
                      {item.title}
                    </h3>
                    
                    <p className="text-xs text-gray-600 line-clamp-3 mb-3 leading-relaxed">
                      {item.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{item.timeAgo}</span>
                      </div>
                      
                      {item.priority === 'high' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && newsItems.length === 0 && (
            <Card className="border border-gray-200 p-6 text-center">
              <div className="text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No news available for {formatDomainName(domain)}</p>
                <Button variant="link" onClick={loadDomainNews} className="text-xs mt-2">
                  Check for updates
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}