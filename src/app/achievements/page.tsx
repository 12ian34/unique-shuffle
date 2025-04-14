'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { achievements } from '@/lib/achievements'
import supabase from '@/lib/supabase'
import { formatRelativeDate } from '@/lib/utils'
import { DbAchievement, Achievement } from '@/types'
import { AchievementShare } from '@/components/achievement-share'
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'

export default function AchievementsPage() {
  const [userAchievements, setUserAchievements] = useState<DbAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [earnedFilter, setEarnedFilter] = useState<boolean | null>(null)

  useEffect(() => {
    async function fetchUserAchievements() {
      setIsLoading(true)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data } = await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', user.id)
            .order('achieved_at', { ascending: false })

          setUserAchievements(data || [])
        }
      } catch (error) {
        console.error('Error fetching achievements:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAchievements()
  }, [])

  // Find achievement details from the list of available achievements
  const getUserAchievementDetails = (achievementId: string) => {
    return achievements.find((a) => a.id === achievementId)
  }

  // Get unique achievement entries (first time each was earned)
  const getUniqueAchievements = () => {
    const uniqueMap = new Map<string, DbAchievement>()

    // Sort by date ascending to get the first occurrence of each achievement
    const sortedByDate = [...userAchievements].sort(
      (a, b) => new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime()
    )

    sortedByDate.forEach((achievement) => {
      if (!uniqueMap.has(achievement.achievement_id)) {
        uniqueMap.set(achievement.achievement_id, achievement)
      }
    })

    // Return in reverse order (newest first)
    return Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime()
    )
  }

  // Get the count of unique achievements earned
  const uniqueAchievementsCount = new Set(userAchievements.map((a) => a.achievement_id)).size

  // Calculate completion percentage
  const completionPercentage = Math.round((uniqueAchievementsCount / achievements.length) * 100)

  // Get achievement categories and counts
  const categories = Array.from(new Set(achievements.map((a) => a.type)))

  // Calculate progress per category
  const categoryProgress = categories.map((category) => {
    const categoryAchievements = achievements.filter((a) => a.type === category)
    const earnedInCategory = new Set(
      userAchievements
        .filter((ua) => {
          const achievement = getUserAchievementDetails(ua.achievement_id)
          return achievement?.type === category
        })
        .map((ua) => ua.achievement_id)
    ).size

    return {
      category,
      total: categoryAchievements.length,
      earned: earnedInCategory,
      percentage: Math.round((earnedInCategory / categoryAchievements.length) * 100),
    }
  })

  // Filter achievements for the available tab
  const filteredAchievements = achievements.filter((achievement) => {
    // Apply category filter
    if (categoryFilter && achievement.type !== categoryFilter) {
      return false
    }

    // Apply earned filter
    if (earnedFilter !== null) {
      const isEarned = userAchievements.some((ua) => ua.achievement_id === achievement.id)
      return isEarned === earnedFilter
    }

    return true
  })

  // Get a human-readable category name
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'pattern':
        return 'Pattern'
      case 'count':
        return 'Count'
      case 'time':
        return 'Time'
      default:
        return category
    }
  }

  const resetFilters = () => {
    setCategoryFilter(null)
    setEarnedFilter(null)
  }

  return (
    <div className='space-y-8'>
      <div className='text-center max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Achievements</h1>
        <p className='mt-4 text-muted-foreground'>
          Track your progress and earn special achievements
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>
            {uniqueAchievementsCount} of {achievements.length} achievements earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='w-full bg-muted rounded-full h-4 mb-4'>
            <div
              className='bg-primary h-4 rounded-full'
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className='text-sm text-muted-foreground text-center'>
            {completionPercentage}% Complete
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue='earned'>
        <TabsList className='grid w-full grid-cols-2 mb-8'>
          <TabsTrigger value='earned'>Achievement Timeline</TabsTrigger>
          <TabsTrigger value='available'>All Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value='earned'>
          {isLoading ? (
            <div className='text-center py-8'>Loading achievements...</div>
          ) : userAchievements.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              You haven&apos;t earned any achievements yet. Start shuffling to unlock achievements!
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='relative border-l-2 border-muted pl-6 ml-4 space-y-6'>
                {getUniqueAchievements().map((userAchievement) => {
                  const achievement = getUserAchievementDetails(userAchievement.achievement_id)

                  if (!achievement) return null

                  // Count how many times this achievement has been earned
                  const count = userAchievements.filter(
                    (a) => a.achievement_id === userAchievement.achievement_id
                  ).length

                  return (
                    <div key={userAchievement.id} className='relative'>
                      <div className='absolute w-3 h-3 rounded-full bg-primary -left-[31px] mt-2'></div>
                      <Card>
                        <CardHeader className='pb-2'>
                          <div className='flex justify-between items-center'>
                            <div>
                              <CardTitle className='text-lg'>{achievement.name}</CardTitle>
                              <Badge variant='outline' className='mt-1'>
                                {getCategoryName(achievement.type)}
                              </Badge>
                            </div>
                            <AchievementShare
                              achievement={achievement}
                              count={uniqueAchievementsCount}
                              total={achievements.length}
                            />
                          </div>
                          <CardDescription>
                            First earned {formatRelativeDate(userAchievement.achieved_at)}
                            {count > 1 && (
                              <span className='ml-2 text-primary font-medium'>× {count} total</span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className='text-sm text-muted-foreground'>{achievement.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value='available'>
          <div className='space-y-8'>
            {/* Category progress cards */}
            <div className='grid gap-4 grid-cols-1 md:grid-cols-3 mb-6'>
              {categoryProgress.map((cat) => (
                <Card key={cat.category} className='overflow-hidden'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base'>{getCategoryName(cat.category)}</CardTitle>
                    <CardDescription>
                      {cat.earned} of {cat.total} earned
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='w-full bg-muted rounded-full h-2 mb-2'>
                      <div
                        className='bg-primary h-2 rounded-full'
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <p className='text-xs text-muted-foreground text-right'>{cat.percentage}%</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className='flex flex-wrap gap-2 mb-6'>
              <Badge
                variant={categoryFilter === null ? 'default' : 'outline'}
                className='cursor-pointer'
                onClick={() => setCategoryFilter(null)}
              >
                All Types
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={categoryFilter === category ? 'default' : 'outline'}
                  className='cursor-pointer'
                  onClick={() => setCategoryFilter(category)}
                >
                  {getCategoryName(category)}
                </Badge>
              ))}
              <div className='ml-auto flex gap-2'>
                <Badge
                  variant={earnedFilter === true ? 'default' : 'outline'}
                  className='cursor-pointer'
                  onClick={() => setEarnedFilter(earnedFilter === true ? null : true)}
                >
                  <Check className='mr-1 h-3 w-3' /> Earned
                </Badge>
                <Badge
                  variant={earnedFilter === false ? 'default' : 'outline'}
                  className='cursor-pointer'
                  onClick={() => setEarnedFilter(earnedFilter === false ? null : false)}
                >
                  <X className='mr-1 h-3 w-3' /> Not Earned
                </Badge>
              </div>
            </div>

            {/* Filtered achievements */}
            <div className='grid gap-4 md:grid-cols-2'>
              {filteredAchievements.map((achievement) => {
                // Get all instances of this achievement
                const earnedAchievements = userAchievements.filter(
                  (ua) => ua.achievement_id === achievement.id
                )
                const isEarned = earnedAchievements.length > 0

                return (
                  <Card
                    key={achievement.id}
                    className={isEarned ? 'bg-primary/5 border-primary/20' : ''}
                  >
                    <CardHeader className='pb-2'>
                      <div className='flex justify-between'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          {achievement.name}
                          {isEarned && (
                            <span className='text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full'>
                              Earned
                            </span>
                          )}
                        </CardTitle>
                        <Badge variant='outline'>{getCategoryName(achievement.type)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-muted-foreground'>{achievement.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* No results message */}
            {filteredAchievements.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <p>No achievements match your filters.</p>
                <button onClick={resetFilters} className='text-primary hover:underline mt-2'>
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
