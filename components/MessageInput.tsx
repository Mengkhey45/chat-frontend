'use client'

import { useState, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmojiPicker } from '@/components/EmojiPicker'
import { Paperclip, Send, Smile } from 'lucide-react'

export function MessageInput() {
  const currentConversation = useChatStore((state) => state.currentConversation)
  const addMessage = useChatStore((state) => state.addMessage)
  const addTypingUser = useChatStore((state) => state.addTypingUser)
  const removeTypingUser = useChatStore((state) => state.removeTypingUser)
  const user = useAuthStore((state) => state.user)
  const { sendMessage: sendViaSocket, handleTyping } = useChat(currentConversation?.id)
  const [content, setContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!currentConversation || !user) {
    return null
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      return
    }

    // Send via Socket — the server will broadcast message:new back to all room members
    // (including the sender), so no need to add locally
    sendViaSocket(content.trim())
    
    setContent('')

    // Clear typing status
    removeTypingUser(user.id)
  }

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files || files.length === 0) {
      return
    }

    setIsUploading(true)
    const file = files[0]

    try {
      // In a real app, upload to cloud storage
      // For demo, simulate upload
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newMessage = {
        id: 'msg-' + Date.now(),
        conversationId: currentConversation.id,
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        content: `Shared file: ${file.name}`,
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        createdAt: new Date().toISOString(),
        isRead: true,
      }

      addMessage(newMessage)
    } catch (error) {
      console.error('File upload error:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
      {/* Typing Indicator */}
      {content && (
        <div className="text-xs text-muted-foreground mb-2">
          Typing...
        </div>
      )}

      <div className="flex gap-3">
        {/* File Upload */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Message Input */}
        <Input
          type="text"
          placeholder="Message #general..."
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (e.target.value) {
              handleTyping()
            }
          }}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
          disabled={isUploading}
        />

        {/* Emoji Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Smile className="w-5 h-5" />
        </Button>

        {/* Emoji Picker */}
        <EmojiPicker
          isOpen={showEmojiPicker}
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />

        {/* Send Button */}
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || isUploading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-2 text-xs text-muted-foreground">
          Uploading file...
        </div>
      )}
    </form>
  )
}
