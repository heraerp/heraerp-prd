import React, { useState, useEffect, useRef, useCallback }
from 'react'
import { Search, X, Loader2 }
from 'lucide-react'
import { cn }
from '@/src/lib/utils'


interface DebouncedSearchProps {
  onSearch: (query: string) => void | Promise<void>
  placeholder?: string
  delay?: number
  minLength?: number
  className?: string
  showClearButton?: boolean
  showSearchIcon?: boolean
  autoFocus?: boolean
  value?: string
  onChange?: (value: string) => void
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
}

export function DebouncedSearch({ onSearch, placeholder = 'Search...', delay = 300, minLength = 2, className, showClearButton = true, showSearchIcon = true, autoFocus = false, value: controlledValue, onChange, suggestions = [], onSuggestionClick
}: DebouncedSearchProps) {
  const [internalValue, setInternalValue] = useState('')

const [isSearching, setIsSearching] = useState(false)

const [showSuggestions, setShowSuggestions] = useState(false)

const [focusedSuggestion, setFocusedSuggestion] = useState(-1)

const inputRef = useRef<HTMLInputElement>(null)

const searchTimeoutRef = useRef<NodeJS.Timeout>()

const suggestionsRef = useRef<HTMLDivElement>(null)

const value = controlledValue !== undefined ? controlledValue : internalValue // Debounced search function
  const performSearch = useCallback( async (query: string) => { if (query.length < minLength) {
  setIsSearching(false) return } setIsSearching(true) try { await onSearch(query  ) finally { setIsSearching(false  ) }, [onSearch, minLength] ) // Handle input change const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = e.target.value if (controlledValue === undefined) {
  setInternalValue(newValue  ) onChange?.(newValue) setShowSuggestions(true) setFocusedSuggestion(-1) // Clear existing timeout if (searchTimeoutRef.current) {
  clearTimeout(searchTimeoutRef.current  ) // Set new timeout for debounced search searchTimeoutRef.current = setTimeout(() => { performSearch(newValue  ), delay  ) // Handle clear button
  const handleClear = () => { if (controlledValue === undefined) {
  setInternalValue(''  ) onChange?.('') onSearch('') inputRef.current?.focus() setShowSuggestions(false  ) // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => { if (controlledValue === undefined) {
  setInternalValue(suggestion  ) onChange?.(suggestion) onSuggestionClick?.(suggestion) performSearch(suggestion) setShowSuggestions(false) inputRef.current?.focus(  ) // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (!showSuggestions || suggestions.length === 0) return switch (e.key) {
  case 'ArrowDown': e.preventDefault() setFocusedSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : prev)) break case 'ArrowUp': e.preventDefault() setFocusedSuggestion(prev => (prev > 0 ? prev - 1 : -1)) break case 'Enter': e.preventDefault() if (focusedSuggestion >= 0) {
  handleSuggestionClick(suggestions[focusedSuggestion]  ) else { performSearch(value) setShowSuggestions(false  ) break case 'Escape': setShowSuggestions(false) setFocusedSuggestion(-1) break } }

// Handle click outside useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => { if ( inputRef.current && !inputRef.current.contains(e.target as Node) && suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) ) {
  setShowSuggestions(false  ) } document.addEventListener('mousedown', handleClickOutside) return () => document.removeEventListener('mousedown', handleClickOutside  ), []) // Cleanup on unmount useEffect(() => { return () => { if (searchTimeoutRef.current) {
  clearTimeout(searchTimeoutRef.current  ) } }, []) // Filter suggestions based on current value
  const filteredSuggestions = suggestions.filter(suggestion => suggestion.toLowerCase().includes(value.toLowerCase()) ) return ( <div className={cn('relative', className)}> <div className="bg-[var(--color-body)] relative"> {/* Search icon */} {showSearchIcon && ( <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> {isSearching ? ( <Loader2 className="h-5 w-5 text-[var(--color-text-secondary)] animate-spin" /> ) : ( <Search className="h-5 w-5 text-[var(--color-text-primary)]" /> )} </div> )} {/* Input field */} <input ref={inputRef} type="text" value={value} onChange={handleInputChange} onKeyDown={handleKeyDown} onFocus={() => setShowSuggestions(true)} placeholder={placeholder} autoFocus={autoFocus} className={cn( 'block w-full rounded-lg border border-[var(--color-border)] border-[var(--color-border)]', 'bg-[var(--color-body)] bg-[var(--color-body)]', 'text-gray-100 text-[var(--color-text-primary)]', 'placeholder:text-[var(--color-text-secondary)] dark:placeholder:text-[var(--color-text-secondary)]', 'focus:border-[#6b6975] dark:focus:border-[#6b6975]', 'focus:ring-2 focus:ring-[var(--color-accent-teal)]/20 dark:focus:ring-blue-400/20', 'transition-colors duration-200', showSearchIcon && 'pl-10', showClearButton && value && 'pr-10', 'py-2 px-3' )} /> {/* Clear button */} {showClearButton && value && ( <button type="button" onClick={handleClear} className="bg-[var(--color-body)] absolute inset-y-0 right-0 pr-3 flex items-center" > <X className="bg-[var(--color-body)] h-5 w-5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)] dark:hover:text-gray-300" /> </button> )} </div> {/* Suggestions dropdown */} {showSuggestions && filteredSuggestions.length > 0 && ( <div ref={suggestionsRef} className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-[var(--color-border)] border-[var(--color-border)] bg-[var(--color-body)] bg-[var(--color-body)] shadow-lg" > {filteredSuggestions.map((suggestion, index) => ( <div key={index} onClick={() => handleSuggestionClick(suggestion)} onMouseEnter={() => setFocusedSuggestion(index)} className={cn( 'px-4 py-2 cursor-pointer transition-colors', 'hover:bg-[var(--color-body)] dark:hover:bg-[var(--color-sidebar)]/30', focusedSuggestion === index && 'bg-[var(--color-body)] bg-muted-foreground/10' )} > <div className="text-sm text-gray-100 text-[var(--color-text-primary)]">{suggestion}</div> </div> ))} </div> )} </div> )
}
