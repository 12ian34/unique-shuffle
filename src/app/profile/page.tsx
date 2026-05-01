'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { achievements } from '@/lib/achievements'
import { formatDate } from '@/lib/utils'
import { useLocalProfile } from '@/contexts/LocalProfileContext'
import { trackEvent } from '@/lib/analytics'

export default function ProfilePage() {
  const {
    profile,
    isLoading,
    updateDisplayName,
    exportProfile,
    importProfile,
    resetProfile,
  } = useLocalProfile()
  const { toast } = useToast()
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [importText, setImportText] = useState('')

  const earnedAchievementIds = useMemo(
    () => new Set(profile.earned_achievements.map((achievement) => achievement.achievement_id)),
    [profile.earned_achievements]
  )

  const earnedAchievements = achievements.filter((achievement) => earnedAchievementIds.has(achievement.id))

  const handleSaveName = () => {
    updateDisplayName(displayName)
    toast({
      title: 'profile updated',
      description: 'your local display name was saved on this browser.',
      variant: 'success',
    })
  }

  const handleExport = async () => {
    const exportData = exportProfile()
    await navigator.clipboard.writeText(exportData)
    trackEvent('profile_exported', { storage: 'local' })
    toast({
      title: 'profile copied',
      description: 'your profile JSON was copied to the clipboard.',
      variant: 'success',
    })
  }

  const handleImport = () => {
    try {
      importProfile(importText)
      setImportText('')
      trackEvent('profile_imported', { storage: 'local' })
      toast({
        title: 'profile imported',
        description: 'your local profile was restored from JSON.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'import failed',
        description: error instanceof Error ? error.message : 'that profile JSON could not be imported.',
        variant: 'destructive',
      })
    }
  }

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      importProfile(await file.text())
      toast({
        title: 'profile imported',
        description: `${file.name} was imported successfully.`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'import failed',
        description: error instanceof Error ? error.message : 'that file is not a valid profile export.',
        variant: 'destructive',
      })
    } finally {
      event.target.value = ''
    }
  }

  const handleReset = () => {
    if (!window.confirm('Reset this local profile? Export it first if you want a backup.')) return
    resetProfile()
    toast({
      title: 'profile reset',
      description: 'this browser now has a fresh local profile.',
      variant: 'info',
    })
  }

  if (isLoading) {
    return <div className='text-center py-12'>loading your local profile...</div>
  }

  return (
    <div className='space-y-8'>
      <div className='text-center max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>local profile</h1>
        <p className='mt-4 text-muted-foreground'>
          your shuffles, achievements, and saved decks live in this browser. export your profile
          if you want a backup.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle>{profile.total_shuffles}</CardTitle>
            <CardDescription>total shuffles</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{profile.shuffle_streak}</CardTitle>
            <CardDescription>daily streak</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{profile.saved_shuffles.length}</CardTitle>
            <CardDescription>saved shuffles</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>display name</CardTitle>
          <CardDescription>shown on shared shuffles only after you choose to share.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col sm:flex-row gap-3'>
          <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <Button onClick={handleSaveName}>save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>backup and restore</CardTitle>
          <CardDescription>
            export/import is the replacement for accounts. no cloud recovery code, no login.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col sm:flex-row gap-3'>
            <Button onClick={handleExport}>copy profile JSON</Button>
            <label className='inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground'>
              import from file
              <input className='sr-only' type='file' accept='application/json' onChange={handleFileImport} />
            </label>
            <Button variant='outline' className='text-destructive' onClick={handleReset}>
              reset local profile
            </Button>
          </div>
          <div className='space-y-2'>
            <textarea
              className='min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder='paste exported profile JSON here'
            />
            <Button variant='outline' onClick={handleImport} disabled={!importText.trim()}>
              import pasted JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>achievements</CardTitle>
          <CardDescription>
            {earnedAchievements.length} of {achievements.length} earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earnedAchievements.length === 0 ? (
            <p className='text-muted-foreground'>shuffle to start earning achievements.</p>
          ) : (
            <div className='grid gap-3 md:grid-cols-2'>
              {earnedAchievements.map((achievement) => {
                const earned = profile.earned_achievements.find(
                  (entry) => entry.achievement_id === achievement.id
                )

                return (
                  <div key={achievement.id} className='rounded-md border p-3'>
                    <div className='font-medium'>{achievement.name}</div>
                    <div className='text-sm text-muted-foreground'>{achievement.description}</div>
                    {earned && (
                      <div className='mt-2 text-xs text-muted-foreground'>
                        earned {formatDate(earned.achieved_at)}
                        {earned.count > 1 ? ` • found ${earned.count} times` : ''}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
