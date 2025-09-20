'use client'

import React from 'react'
import { Star, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TestimonialCardProps {
  name: string
  title: string
  company?: string
  testimonial: string
  rating?: number
  avatar?: string
  variant?: 'default' | 'featured' | 'compact'
  className?: string
}

export function TestimonialCard({
  name,
  title,
  company,
  testimonial,
  rating = 5,
  avatar,
  variant = 'default',
  className
}: TestimonialCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn('h-4 w-4', i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300')}
      />
    ))
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'bg-background dark:bg-muted rounded-lg p-6 border border-border dark:border-border shadow-sm',
          className
        )}
      >
        <div className="flex items-center mb-4">
          <div className="flex mr-2">{renderStars(rating)}</div>
          <span className="text-sm text-muted-foreground dark:text-muted-foreground">
            {rating}/5
          </span>
        </div>
        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">
          "{testimonial}"
        </p>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-foreground text-xs font-semibold">{name.charAt(0)}</span>
          </div>
          <div className="ml-3">
            <p className="font-semibold text-foreground dark:text-foreground text-sm">{name}</p>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              {title}
              {company && `, ${company}`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'featured') {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-2xl p-8 border border-blue-200 dark:border-input shadow-lg relative overflow-hidden',
          className
        )}
      >
        <Quote className="absolute top-6 right-6 h-12 w-12 text-blue-200 dark:text-muted-foreground" />

        <div className="flex items-center mb-6">
          <div className="flex mr-3">{renderStars(rating)}</div>
        </div>

        <blockquote className="text-lg text-slate-800 dark:text-foreground leading-relaxed mb-6 font-medium">
          "{testimonial}"
        </blockquote>

        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-foreground font-semibold">{name.charAt(0)}</span>
          </div>
          <div className="ml-4">
            <p className="font-semibold text-foreground dark:text-foreground">{name}</p>
            <p className="text-muted-foreground dark:text-muted-foreground">
              {title}
              {company && ` • ${company}`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-background dark:bg-muted rounded-xl p-6 border border-border dark:border-border shadow-sm hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      <div className="flex items-center mb-4">
        <div className="flex mr-2">{renderStars(rating)}</div>
        <span className="text-sm text-muted-foreground dark:text-muted-foreground">{rating}/5</span>
      </div>

      <blockquote className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
        "{testimonial}"
      </blockquote>

      <div className="flex items-center">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-foreground text-sm font-semibold">{name.charAt(0)}</span>
        </div>
        <div className="ml-3">
          <p className="font-semibold text-foreground dark:text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            {title}
            {company && `, ${company}`}
          </p>
        </div>
      </div>
    </div>
  )
}

interface TestimonialsGridProps {
  testimonials: Array<{
    name: string
    title: string
    company?: string
    testimonial: string
    rating?: number
    avatar?: string
  }>
  variant?: 'default' | 'featured' | 'compact'
  className?: string
}

export function TestimonialsGrid({
  testimonials,
  variant = 'default',
  className
}: TestimonialsGridProps) {
  const gridClasses = {
    default: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    featured: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
    compact: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
  }

  return (
    <div className={cn(gridClasses[variant], className)}>
      {testimonials.map((testimonial, index) => (
        <TestimonialCard key={index} variant={variant} {...testimonial} />
      ))}
    </div>
  )
}
