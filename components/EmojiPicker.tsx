'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useState } from 'react'

interface EmojiPickerProps {
  isOpen: boolean
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😚', '😙'],
  'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌', '🤞', '🫰', '🤟', '🤘', '🤙', '👍', '👎', '☝', '👆', '👇', '👈'],
  'Heart': ['❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '👋', '💌'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔'],
}

export function EmojiPicker({ isOpen, onEmojiSelect, onClose }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys')

  if (!isOpen) {
    return null
  }

  const emojis = EMOJI_CATEGORIES[selectedCategory]

  return (
    <div className="fixed bottom-20 right-4 bg-card border border-border rounded-lg shadow-lg z-50 w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Pick an emoji</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-secondary rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category as keyof typeof EMOJI_CATEGORIES)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emojis Grid */}
      <div className="p-3 grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onEmojiSelect(emoji)
              onClose()
            }}
            className="text-xl p-1 rounded hover:bg-secondary transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
