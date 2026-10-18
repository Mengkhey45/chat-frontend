import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * User preferences.
 *
 * These were previously seven `defaultChecked` checkboxes with no handlers —
 * they looked like settings, changed nothing, and reset on every reload. Each
 * one here is read somewhere that actually changes behaviour.
 */
export interface PreferencesState {
  /** Desktop notification for messages in a conversation you're not looking at. */
  messageNotifications: boolean
  /** Desktop notification for incoming friend requests. */
  friendRequestNotifications: boolean
  /** Short tone on an incoming message. */
  soundEffects: boolean
  /** Tighter message spacing. */
  compactMode: boolean
  /** When off, this client stops broadcasting presence. */
  shareOnlineStatus: boolean

  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
}

type Preferences = Omit<PreferencesState, 'setPreference'>

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      messageNotifications: true,
      friendRequestNotifications: true,
      soundEffects: true,
      compactMode: false,
      shareOnlineStatus: true,
      setPreference: (key, value) => set({ [key]: value } as any),
    }),
    { name: 'chat-preferences' }
  )
)
