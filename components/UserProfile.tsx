'use client'

import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Bell, Lock, Volume2, Moon, Shield } from 'lucide-react'
import { useState } from 'react'

export function UserProfile() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const showUserProfile = useUIStore((state) => state.showUserProfile)
  const setShowUserProfile = useUIStore((state) => state.setShowUserProfile)
  const [activeTab, setActiveTab] = useState('account')

  if (!showUserProfile || !user) {
    return null
  }

  const handleLogout = () => {
    logout()
    setShowUserProfile(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-border bg-card max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>User Settings</CardTitle>
            <CardDescription>Manage your account and preferences</CardDescription>
          </div>
          <button
            onClick={() => setShowUserProfile(false)}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-secondary">
              <TabsTrigger
                value="account"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Account
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Privacy
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Appearance
              </TabsTrigger>
            </TabsList>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {(user.name || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {user.id}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input
                    type="text"
                    value={user.name}
                    readOnly
                    className="bg-secondary border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    value={user.email}
                    readOnly
                    className="bg-secondary border-border text-foreground mt-1"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Button variant="outline" className="w-full text-foreground border-border hover:bg-secondary">
                  Change Password
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              </div>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Profile Visibility</p>
                      <p className="text-xs text-muted-foreground">
                        Let friends see your profile
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Friend Requests</p>
                      <p className="text-xs text-muted-foreground">
                        Allow anyone to send requests
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Show Online Status</p>
                      <p className="text-xs text-muted-foreground">
                        Let friends see when you're online
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </div>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Message Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Get notified of new messages
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Friend Requests</p>
                      <p className="text-xs text-muted-foreground">
                        Get notified when someone adds you
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Sound Effects</p>
                      <p className="text-xs text-muted-foreground">
                        Play sounds for notifications
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </div>
              </div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="p-3 rounded-lg border-2 border-primary bg-background text-foreground text-sm font-medium">
                      Dark
                    </button>
                    <button className="p-3 rounded-lg border border-border bg-secondary text-foreground text-sm font-medium hover:border-primary transition-colors">
                      Light
                    </button>
                    <button className="p-3 rounded-lg border border-border bg-secondary text-foreground text-sm font-medium hover:border-primary transition-colors">
                      Auto
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Compact Mode</p>
                      <p className="text-xs text-muted-foreground">
                        Use a more condensed layout
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-4 h-4" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
