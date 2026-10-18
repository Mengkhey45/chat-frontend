import { usePreferencesStore } from '@/store/preferencesStore'

/**
 * Desktop notifications and a message tone.
 *
 * The Notifications tab offered both as toggles but neither was implemented —
 * nothing in the app ever requested permission or made a sound.
 */

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export function showNotification(title: string, body: string, tag?: string) {
  if (notificationPermission() !== 'granted') return
  // Don't interrupt someone who is already looking at the page.
  if (typeof document !== 'undefined' && !document.hidden) return
  try {
    new Notification(title, { body, tag, icon: '/icon.svg' })
  } catch {
    /* some browsers block construction outside a service worker */
  }
}

let audioContext: AudioContext | null = null

/**
 * A short synthesised blip. Avoids shipping an audio asset, and avoids the
 * autoplay policy problems of an <audio> element, since this only ever runs
 * after the user has interacted with the page.
 */
export function playMessageTone() {
  if (!usePreferencesStore.getState().soundEffects) return
  if (typeof window === 'undefined') return

  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    audioContext ??= new Ctx()
    if (audioContext.state === 'suspended') void audioContext.resume()

    const now = audioContext.currentTime
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(660, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)

    osc.connect(gain).connect(audioContext.destination)
    osc.start(now)
    osc.stop(now + 0.26)
  } catch {
    /* audio is a nicety, never a failure */
  }
}
