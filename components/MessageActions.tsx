'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, EyeOff } from 'lucide-react'

interface Props {
  isOwn: boolean
  /** Edits are yours only, within the 15-minute window, and not on attachments. */
  canEdit: boolean
  onEdit: () => void
  onUnsend: () => void
  onHide: () => void
}

/**
 * Per-message menu: edit, unsend for everyone, or hide just for yourself.
 *
 * Appears on hover, and stays reachable from the keyboard — a hover-only
 * control would put edit and unsend out of reach for anyone not using a mouse.
 */
export function MessageActions({ isOwn, canEdit, onEdit, onUnsend, onHide }: Props) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirming(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => {
    setOpen(false)
    setConfirming(false)
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Message actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:opacity-100 ${
          open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-20 top-8 w-48 rounded-lg border border-border bg-popover shadow-xl overflow-hidden ${
            isOwn ? 'right-0' : 'left-0'
          }`}
        >
          {canEdit && (
            <button
              role="menuitem"
              onClick={() => {
                onEdit()
                close()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-popover-foreground hover:bg-secondary transition-colors text-left"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
              Edit message
            </button>
          )}

          <button
            role="menuitem"
            onClick={() => {
              onHide()
              close()
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-popover-foreground hover:bg-secondary transition-colors text-left"
          >
            <EyeOff className="w-4 h-4 text-muted-foreground" />
            Remove for you
          </button>

          {isOwn &&
            (confirming ? (
              <button
                role="menuitem"
                onClick={() => {
                  onUnsend()
                  close()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors text-left font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Tap again to confirm
              </button>
            ) : (
              <button
                role="menuitem"
                onClick={() => setConfirming(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
              >
                <Trash2 className="w-4 h-4" />
                Unsend for everyone
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
