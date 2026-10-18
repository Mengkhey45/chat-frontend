'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import api, { logoutRequest } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { usePreferencesStore } from '@/store/preferencesStore'
import {
  notificationPermission,
  requestNotificationPermission,
  playMessageTone,
} from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  X, Bell, Volume2, Shield, Monitor, Moon, Sun, Check, Loader2, Rows3,
} from 'lucide-react'

/** One labelled switch. Every instance here is bound to real state. */
function SettingRow({
  icon: Icon, title, description, checked, onChange, disabled, hint,
}: {
  icon: any
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-5 h-5 text-primary-accent flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{hint ?? description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={title} />
    </div>
  )
}

export function UserProfile() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const showUserProfile = useUIStore((s) => s.showUserProfile)
  const setShowUserProfile = useUIStore((s) => s.setShowUserProfile)
  const prefs = usePreferencesStore()
  const { theme, setTheme } = useTheme()

  const [activeTab, setActiveTab] = useState('account')
  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  if (!showUserProfile || !user) return null

  const permission = notificationPermission()
  const notificationsBlocked = permission === 'denied' || permission === 'unsupported'

  const handleSaveProfile = async () => {
    if (!name.trim() || name.trim() === user.name) return
    setSaving(true)
    setError(null)
    try {
      // PUT /api/me already existed on the backend; the fields here were simply
      // marked readOnly, so there was no way to reach it.
      const { data } = await api.put('/api/me', { name: name.trim() })
      setUser({ ...user, name: data.user?.name ?? name.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setError(null)
    try {
      await api.post('/api/auth/forgot-password', { email: user.email })
      setResetSent(true)
    } catch {
      setError('Could not start a password reset.')
    }
  }

  const handleToggleNotifications = async (key: 'messageNotifications' | 'friendRequestNotifications', value: boolean) => {
    if (value) {
      const result = await requestNotificationPermission()
      if (result !== 'granted') {
        setError(
          result === 'unsupported'
            ? 'This browser does not support desktop notifications.'
            : 'Your browser is blocking notifications for this site. Allow them in site settings first.'
        )
        return
      }
    }
    setError(null)
    prefs.setPreference(key, value)
  }

  const themes = [
    { value: 'dark', label: 'Dark', Icon: Moon },
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'system', label: 'System', Icon: Monitor },
  ] as const

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => setShowUserProfile(false)}
    >
      <Card
        className="w-full max-w-2xl border-border bg-card max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your account and preferences</CardDescription>
          </div>
          <button
            onClick={() => setShowUserProfile(false)}
            aria-label="Close settings"
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardHeader>

        <CardContent>
          {error && (
            <p role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </p>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-secondary">
              {['account', 'privacy', 'notifications', 'appearance'].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ---------- Account ---------- */}
            <TabsContent value="account" className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {(user.name || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate">{user.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="display-name" className="text-sm font-medium text-foreground">
                    Display name
                  </label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="display-name"
                      value={name}
                      maxLength={80}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-secondary border-border-strong text-foreground"
                    />
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving || !name.trim() || name.trim() === user.name}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : saved ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    readOnly
                    className="bg-secondary border-border text-muted-foreground mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your email is used to sign in and can&apos;t be changed here.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Button
                  variant="outline"
                  onClick={handleChangePassword}
                  disabled={resetSent}
                  className="w-full text-foreground border-border-strong hover:bg-secondary"
                >
                  {resetSent ? 'Reset code sent — check your email' : 'Change password'}
                </Button>
                <Button variant="destructive" className="w-full" onClick={async () => {
                  await logoutRequest()
                  setShowUserProfile(false)
                }}>
                  Sign out
                </Button>
              </div>
            </TabsContent>

            {/* ---------- Privacy ---------- */}
            <TabsContent value="privacy" className="space-y-4">
              <SettingRow
                icon={Shield}
                title="Show when you're online"
                description="Friends can see your online status"
                checked={prefs.shareOnlineStatus}
                onChange={(v) => prefs.setPreference('shareOnlineStatus', v)}
              />
              <p className="text-xs text-muted-foreground px-1">
                With this off, this device stops broadcasting your presence and you
                appear offline to everyone.
              </p>
            </TabsContent>

            {/* ---------- Notifications ---------- */}
            <TabsContent value="notifications" className="space-y-4">
              {notificationsBlocked && (
                <p className="p-3 rounded-lg bg-secondary text-xs text-muted-foreground">
                  {permission === 'unsupported'
                    ? 'This browser does not support desktop notifications.'
                    : 'Notifications are blocked for this site. Enable them in your browser’s site settings to turn these on.'}
                </p>
              )}
              <SettingRow
                icon={Bell}
                title="New messages"
                description="Notify me when a message arrives in another conversation"
                checked={prefs.messageNotifications}
                disabled={notificationsBlocked}
                onChange={(v) => handleToggleNotifications('messageNotifications', v)}
              />
              <SettingRow
                icon={Bell}
                title="Friend requests"
                description="Notify me when someone adds me"
                checked={prefs.friendRequestNotifications}
                disabled={notificationsBlocked}
                onChange={(v) => handleToggleNotifications('friendRequestNotifications', v)}
              />
              <SettingRow
                icon={Volume2}
                title="Sound"
                description="Play a tone for incoming messages"
                checked={prefs.soundEffects}
                onChange={(v) => {
                  prefs.setPreference('soundEffects', v)
                  if (v) playMessageTone()
                }}
              />
            </TabsContent>

            {/* ---------- Appearance ---------- */}
            <TabsContent value="appearance" className="space-y-4">
              <div>
                <span className="text-sm font-medium text-foreground mb-3 block">Theme</span>
                <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
                  {themes.map(({ value, label, Icon }) => {
                    const active = theme === value
                    return (
                      <button
                        key={value}
                        role="radio"
                        aria-checked={active}
                        onClick={() => setTheme(value)}
                        className={`p-3 rounded-lg text-sm font-medium flex flex-col items-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
                          active
                            ? 'border-2 border-primary bg-primary/10 text-foreground'
                            : 'border border-border-strong bg-secondary text-foreground hover:border-primary'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <SettingRow
                icon={Rows3}
                title="Compact mode"
                description="Tighter spacing, more messages on screen"
                checked={prefs.compactMode}
                onChange={(v) => prefs.setPreference('compactMode', v)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
