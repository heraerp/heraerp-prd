'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
// Using local Kbd component defined below

interface KeyboardShortcutsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShortcutCategory {
  title: string
  shortcuts: Array<{
    keys: string[]
    description: string
  }>
}

const shortcutCategories: ShortcutCategory[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate through conversations' },
      { keys: ['Enter'], description: 'Open selected conversation' },
      { keys: ['Esc'], description: 'Close current dialog or return to chat list' },
      { keys: ['Tab'], description: 'Move focus to next element' }
    ]
  },
  {
    title: 'Messaging',
    shortcuts: [
      { keys: ['Enter'], description: 'Send message' },
      { keys: ['Shift', 'Enter'], description: 'New line in message' },
      { keys: ['Ctrl/Cmd', 'V'], description: 'Paste from clipboard' },
      { keys: ['Ctrl/Cmd', 'Z'], description: 'Undo' },
      { keys: ['Ctrl/Cmd', 'Y'], description: 'Redo' }
    ]
  },
  {
    title: 'Search',
    shortcuts: [
      { keys: ['Ctrl/Cmd', '/'], description: 'Focus global search' },
      { keys: ['Ctrl/Cmd', 'F'], description: 'Search in conversation' },
      { keys: ['Ctrl/Cmd', 'Shift', 'F'], description: 'Advanced search' }
    ]
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['Ctrl/Cmd', 'N'], description: 'New chat' },
      { keys: ['Ctrl/Cmd', 'Shift', 'N'], description: 'New group' },
      { keys: ['Ctrl/Cmd', 'E'], description: 'Archive conversation' },
      { keys: ['Ctrl/Cmd', 'Shift', 'E'], description: 'Unarchive conversation' },
      { keys: ['Ctrl/Cmd', 'P'], description: 'Pin/Unpin conversation' },
      { keys: ['Ctrl/Cmd', 'D'], description: 'Delete conversation' },
      { keys: ['Ctrl/Cmd', 'M'], description: 'Mute notifications' }
    ]
  },
  {
    title: 'Selection',
    shortcuts: [
      { keys: ['Ctrl/Cmd', 'A'], description: 'Select all messages' },
      { keys: ['Ctrl/Cmd', 'Click'], description: 'Select multiple messages' },
      { keys: ['Shift', 'Click'], description: 'Select range of messages' }
    ]
  },
  {
    title: 'Media',
    shortcuts: [
      { keys: ['Space'], description: 'Play/Pause audio or video' },
      { keys: ['Ctrl/Cmd', 'S'], description: 'Download media' },
      { keys: ['←', '→'], description: 'Navigate media gallery' }
    ]
  }
]

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-4 -mr-4 max-h-[60vh]">
          <div className="space-y-6">
            {shortcutCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="font-semibold text-sm mb-3">{category.title}</h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-xs text-muted-foreground">+</span>
                            )}
                            <Kbd>{key}</Kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <p>
            Note: Use <Kbd>Cmd</Kbd> on macOS and <Kbd>Ctrl</Kbd> on Windows/Linux
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Kbd component if not already available
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-gray-200 bg-muted border border-border rounded dark:bg-muted dark:text-foreground dark:border-border">
      {children}
    </kbd>
  )
}
