'use client'

import { useState, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmojiPicker } from '@/components/EmojiPicker'
import { Paperclip, Send, Smile, X, Image as ImageIcon, Film, FileIcon } from 'lucide-react'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function MessageInput() {
  const currentConversation = useChatStore((state) => state.currentConversation)
  const removeTypingUser = useChatStore((state) => state.removeTypingUser)
  const user = useAuthStore((state) => state.user)
  const { sendMessage: sendViaSocket, handleTyping } = useChat(currentConversation?.id)
  const [content, setContent] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ file: File; preview: string; type: string } | null>(null)
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!currentConversation || !user) {
    return null
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedFile) {
      await handleSendFile()
      return
    }

    if (!content.trim()) {
      return
    }

    sendViaSocket(content.trim())
    setContent('')
    removeTypingUser(user.id)
  }

  const handleSendFile = async () => {
    if (!selectedFile) return
    setIsSending(true)

    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(selectedFile.file)
      })

      // Send file message through socket
      sendViaSocket(content.trim() || `Shared: ${selectedFile.file.name}`, {
        fileData: base64,
        fileName: selectedFile.file.name,
        fileType: selectedFile.type,
      })

      setSelectedFile(null)
      setContent('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('File send error:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files || files.length === 0) return

    const file = files[0]

    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Maximum size is 5MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const fileType = isImage ? 'image' : isVideo ? 'video' : 'file'

    // Create preview URL
    const preview = URL.createObjectURL(file)
    setSelectedFile({ file, preview, type: fileType })
  }

  const clearSelectedFile = () => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview)
    }
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji)
  }

  return (
    <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-secondary rounded-lg flex items-center gap-3">
          <div className="flex-shrink-0">
            {selectedFile.type === 'image' ? (
              <img
                src={selectedFile.preview}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : selectedFile.type === 'video' ? (
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <Film className="w-8 h-8 text-primary" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileIcon className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selectedFile.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={clearSelectedFile}
            className="p-1 hover:bg-background rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="flex gap-3">
        {/* File Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isSending}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Message Input */}
        <Input
          type="text"
          placeholder={selectedFile ? 'Add a caption...' : 'Type a message...'}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (e.target.value) {
              handleTyping()
            }
          }}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
          disabled={isSending}
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
          disabled={(!content.trim() && !selectedFile) || isSending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Sending Progress */}
      {isSending && (
        <div className="mt-2 text-xs text-muted-foreground">
          Sending file...
        </div>
      )}
    </form>
  )
}
