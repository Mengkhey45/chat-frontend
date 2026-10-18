'use client'

import { useState, useRef, useEffect } from 'react'
import api from '@/lib/api'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmojiPicker } from '@/components/EmojiPicker'
import { Paperclip, Send, Smile, X, Film, FileIcon, Lock } from 'lucide-react'
import { getSharedSecretKey, encryptE2EEMessage } from '@/lib/crypto'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // matches the server-side presign limit

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf', 'text/plain',
])

type SelectedFile = { file: File; preview: string; kind: 'image' | 'video' | 'file' }

export function MessageInput() {
  const currentConversation = useChatStore((state) => state.currentConversation)
  const user = useAuthStore((state) => state.user)
  const { sendMessage: sendViaSocket, handleTyping } = useChat(currentConversation?.id)

  const [content, setContent] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Object URLs are leaked unless explicitly revoked; the old code only revoked
  // them on the manual "clear" path.
  useEffect(() => {
    return () => {
      if (selectedFile?.preview) URL.revokeObjectURL(selectedFile.preview)
    }
  }, [selectedFile])

  if (!currentConversation || !user) return null

  /**
   * Upload through a short-lived presigned R2 URL and send only the resulting
   * link over the socket.
   */
  const uploadFile = async (file: File): Promise<{ fileUrl: string } | null> => {
    const { data } = await api.post('/api/files/upload-url', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    })

    const put = await fetch(data.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    if (!put.ok) throw new Error(`Upload failed (${put.status})`)

    return { fileUrl: data.fileUrl }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const text = content.trim()
    if (!text && !selectedFile) return

    setIsSending(true)
    try {
      let encryptionInfo: { isEncrypted: boolean; iv: string } | undefined = undefined

      if (currentConversation.isE2EE && text) {
        // Find the peer user
        const peerId = currentConversation.members.find((id) => id !== user.id)
        if (!peerId) {
          throw new Error('Peer participant not found in this conversation')
        }

        // Retrieve peer's public key from memberDetails or fetch from API
        let peerPublicKey = currentConversation.memberDetails?.find((m) => m.id === peerId)?.publicKey
        if (!peerPublicKey) {
          const res = await api.get(`/api/chat/keys/${peerId}`)
          peerPublicKey = res.data?.publicKey
        }

        if (!peerPublicKey) {
          throw new Error(
            `${currentConversation.name} has not set up encryption keys yet. They must sign in to activate End-to-End Encryption.`
          )
        }

        const sharedKey = await getSharedSecretKey(user.id, peerPublicKey, currentConversation.id)
        const encrypted = await encryptE2EEMessage(text, sharedKey)
        encryptionInfo = { isEncrypted: true, iv: encrypted.iv }

        if (!selectedFile) {
          const sent = sendViaSocket(encrypted.ciphertext, undefined, encryptionInfo)
          if (!sent) throw new Error('Not connected. Your message was not sent.')
          setContent('')
          return
        }
      }

      if (!selectedFile) {
        const sent = sendViaSocket(text)
        if (!sent) throw new Error('Not connected. Your message was not sent.')
        setContent('')
        return
      }

      const uploaded = await uploadFile(selectedFile.file)
      if (!uploaded) throw new Error('Upload failed')

      let finalContent = text || selectedFile.file.name
      if (currentConversation.isE2EE && text) {
        const peerId = currentConversation.members.find((id) => id !== user.id)
        let peerPublicKey = currentConversation.memberDetails?.find((m) => m.id === peerId)?.publicKey
        if (!peerPublicKey && peerId) {
          const res = await api.get(`/api/chat/keys/${peerId}`)
          peerPublicKey = res.data?.publicKey
        }
        if (peerPublicKey) {
          const sharedKey = await getSharedSecretKey(user.id, peerPublicKey, currentConversation.id)
          const encrypted = await encryptE2EEMessage(text, sharedKey)
          finalContent = encrypted.ciphertext
          encryptionInfo = { isEncrypted: true, iv: encrypted.iv }
        }
      }

      const sent = sendViaSocket(
        finalContent,
        {
          fileUrl: uploaded.fileUrl,
          fileName: selectedFile.file.name,
          fileType: selectedFile.kind,
        },
        encryptionInfo
      )
      if (!sent) throw new Error('Not connected. Your message was not sent.')

      clearSelectedFile()
      setContent('')
    } catch (err: any) {
      const status = err?.response?.status
      setError(
        status === 503
          ? 'File uploads are not configured on the server.'
          : err?.response?.data?.error || err?.message || 'Could not send message.'
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.currentTarget.files?.[0]
    if (!file) return

    const reset = () => {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`)
      reset()
      return
    }
    if (!ALLOWED_MIME.has(file.type)) {
      setError(`Unsupported file type: ${file.type || 'unknown'}`)
      reset()
      return
    }

    if (selectedFile?.preview) URL.revokeObjectURL(selectedFile.preview)

    const kind = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : 'file'

    setSelectedFile({ file, preview: URL.createObjectURL(file), kind })
  }

  const clearSelectedFile = () => {
    if (selectedFile?.preview) URL.revokeObjectURL(selectedFile.preview)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
      {error && (
        <div
          role="alert"
          className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="mb-3 p-3 bg-secondary rounded-lg flex items-center gap-3">
          <div className="flex-shrink-0">
            {selectedFile.kind === 'image' ? (
              <img
                src={selectedFile.preview}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                {selectedFile.kind === 'video' ? (
                  <Film className="w-8 h-8 text-primary" />
                ) : (
                  <FileIcon className="w-8 h-8 text-primary" />
                )}
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
            aria-label="Remove attachment"
            className="p-1 hover:bg-background rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.txt"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isSending}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Attach a file"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <div className="relative flex-1">
          {currentConversation.isE2EE && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
          )}
          <Input
            type="text"
            aria-label="Message"
            placeholder={
              selectedFile
                ? 'Add an encrypted caption...'
                : currentConversation.isE2EE
                ? 'Type an end-to-end encrypted message...'
                : 'Type a message...'
            }
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (e.target.value) handleTyping()
            }}
            className={`bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary w-full ${
              currentConversation.isE2EE
                ? 'pl-9 border-emerald-500/30 focus-visible:ring-emerald-500/50'
                : ''
            }`}
            disabled={isSending}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Insert emoji"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Smile className="w-5 h-5" />
        </Button>

        <EmojiPicker
          isOpen={showEmojiPicker}
          onEmojiSelect={(emoji: string) => setContent((prev) => prev + emoji)}
          onClose={() => setShowEmojiPicker(false)}
        />

        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={(!content.trim() && !selectedFile) || isSending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {isSending && <div className="mt-2 text-xs text-muted-foreground">Uploading…</div>}
    </form>
  )
}
