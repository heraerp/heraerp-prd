'use client'

import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Smile, Clock, Heart, Zap, Flag, Utensils, Car, Lightbulb } from 'lucide-react'

interface EmojiPickerProps {
  onEmojiSelect?: (emoji: string) => void
}

const emojiCategories = {
  recent: {
    icon: Clock,
    label: 'Recent',
    emojis: ['😀', '👍', '❤️', '😂', '🎉', '🔥', '✨', '🙏']
  },
  smileys: {
    icon: Smile,
    label: 'Smileys',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '🙃',
      '😉',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '☺️',
      '😚',
      '😙',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '🤐',
      '🤨',
      '😐',
      '😑',
      '😶',
      '😏',
      '😒',
      '🙄',
      '😬',
      '🤥',
      '😌',
      '😔',
      '😪',
      '🤤',
      '😴',
      '😷',
      '🤒',
      '🤕',
      '🤢',
      '🤮',
      '🤧',
      '🥵',
      '🥶',
      '🥴',
      '😵',
      '🤯',
      '🤠',
      '🥳',
      '😎',
      '🤓',
      '🧐',
      '😕',
      '😟',
      '🙁',
      '☹️',
      '😮',
      '😯',
      '😲',
      '😳',
      '🥺',
      '😦',
      '😧',
      '😨',
      '😰',
      '😥',
      '😢',
      '😭',
      '😱',
      '😖',
      '😣',
      '😞',
      '😓',
      '😩',
      '😫',
      '🥱',
      '😤',
      '😡'
    ]
  },
  hearts: {
    icon: Heart,
    label: 'Hearts',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '☮️',
      '✝️',
      '☪️',
      '🕉',
      '☸️',
      '✡️',
      '🔯',
      '🕎',
      '☯️',
      '☦️',
      '🛐',
      '⛎',
      '♈'
    ]
  },
  gestures: {
    icon: Zap,
    label: 'Gestures',
    emojis: [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👌',
      '🤏',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👍',
      '👎',
      '👊',
      '✊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '👐',
      '🤲',
      '🤝',
      '🙏',
      '✍️',
      '💅',
      '🤳',
      '💪',
      '🦾',
      '🦵',
      '🦿',
      '🦶',
      '👂',
      '🦻'
    ]
  },
  activities: {
    icon: Flag,
    label: 'Activities',
    emojis: [
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🪀',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '🥅',
      '⛳',
      '🪁',
      '🏹',
      '🎣',
      '🤿',
      '🥊',
      '🥋',
      '🎽',
      '🛹',
      '🛷',
      '⛸️',
      '🥌',
      '🎿',
      '⛷️'
    ]
  },
  food: {
    icon: Utensils,
    label: 'Food',
    emojis: [
      '🍏',
      '🍎',
      '🍐',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🍆',
      '🥑',
      '🥦',
      '🥬',
      '🥒',
      '🌶️',
      '🌽',
      '🥕',
      '🥔',
      '🍠',
      '🥐',
      '🥖',
      '🥨',
      '🧀',
      '🥚',
      '🍳',
      '🥓',
      '🥩',
      '🍗',
      '🍖',
      '🦴',
      '🌭',
      '🍔',
      '🍟',
      '🍕',
      '🥪',
      '🥙',
      '🌮',
      '🌯',
      '🥗',
      '🥘'
    ]
  },
  travel: {
    icon: Car,
    label: 'Travel',
    emojis: [
      '🚗',
      '🚕',
      '🚙',
      '🚌',
      '🚎',
      '🏎️',
      '🚓',
      '🚑',
      '🚒',
      '🚐',
      '🚚',
      '🚛',
      '🚜',
      '🏍️',
      '🛵',
      '🚲',
      '🛴',
      '🚏',
      '🛣️',
      '🛤️',
      '⛽',
      '🚨',
      '🚥',
      '🚦',
      '🚧',
      '⚓',
      '⛵',
      '🛶',
      '🚤',
      '🛳️',
      '⛴️',
      '🚢',
      '✈️',
      '🛩️',
      '🛫',
      '🛬',
      '💺',
      '🚁',
      '🚟',
      '🚠'
    ]
  },
  objects: {
    icon: Lightbulb,
    label: 'Objects',
    emojis: [
      '💡',
      '🔦',
      '🏮',
      '📱',
      '💻',
      '⌨️',
      '🖥️',
      '🖨️',
      '🖱️',
      '💾',
      '💿',
      '📷',
      '📹',
      '🎥',
      '📞',
      '☎️',
      '📟',
      '📠',
      '📺',
      '📻',
      '🎙️',
      '🎚️',
      '🎛️',
      '⏱️',
      '⏲️',
      '⏰',
      '🕰️',
      '⌛',
      '⏳',
      '📡',
      '🔋',
      '🔌',
      '💰',
      '💵',
      '💴',
      '💶',
      '💷',
      '💸',
      '💳',
      '💎'
    ]
  }
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = useState(emojiCategories.recent.emojis)

  const handleEmojiClick = (emoji: string) => {
    // Update recent emojis
    setRecentEmojis(prev => {
      const newRecent = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 16)
      return newRecent
    })

    onEmojiSelect?.(emoji)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Smile className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="top">
        <Tabs defaultValue="smileys" className="w-full">
          <TabsList className="w-full justify-start px-2 h-12 bg-transparent border-b">
            {Object.entries(emojiCategories).map(([key, category]) => {
              const Icon = category.icon
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="px-2 py-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Icon className="w-4 h-4" />
                </TabsTrigger>
              )
            })}
          </TabsList>

          {Object.entries(emojiCategories).map(([key, category]) => (
            <TabsContent key={key} value={key} className="m-0">
              <ScrollArea className="h-64 p-2">
                <div className="grid grid-cols-8 gap-1">
                  {(key === 'recent' ? recentEmojis : category.emojis).map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-9 h-9 flex items-center justify-center text-xl hover:bg-muted dark:hover:bg-muted rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
