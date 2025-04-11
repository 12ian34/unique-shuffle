'use client'

import { Achievement as AchievementType } from '@/types'
import { ACHIEVEMENTS, AchievementCategory } from '@/lib/achievements'
import { cn } from '@/lib/utils'

interface AchievementsProps {
  unlockedAchievements: string[]
  className?: string
}

// Map for user-friendly category names
const categoryNames: Record<string, string> = {
  [AchievementCategory.SHUFFLE_COUNT]: 'Shuffle Milestones',
  [AchievementCategory.SHUFFLE_PATTERNS]: 'Shuffle Patterns',
  [AchievementCategory.SPECIAL_SHUFFLES]: 'Special Shuffles',
  [AchievementCategory.TIME_BASED]: 'Time-Based Achievements',
  [AchievementCategory.STREAKS]: 'Shuffling Streaks',
  [AchievementCategory.MILESTONES]: 'Game Milestones',
  [AchievementCategory.POP_CULTURE]: 'Pop Culture References',
  [AchievementCategory.QUIRKY]: 'Quirky Achievements',
}

// Category icons (emojis for now, could be replaced with SVG icons)
const categoryIcons: Record<string, string> = {
  [AchievementCategory.SHUFFLE_COUNT]: '🔢',
  [AchievementCategory.SHUFFLE_PATTERNS]: '🃏',
  [AchievementCategory.SPECIAL_SHUFFLES]: '✨',
  [AchievementCategory.TIME_BASED]: '⏰',
  [AchievementCategory.STREAKS]: '🔥',
  [AchievementCategory.MILESTONES]: '🏆',
  [AchievementCategory.POP_CULTURE]: '🎬',
  [AchievementCategory.QUIRKY]: '🎭',
  other: '❓',
}

export function Achievements({ unlockedAchievements, className }: AchievementsProps) {
  // Group achievements by category
  const achievementsByCategory = ACHIEVEMENTS.reduce((acc, achievement) => {
    const category = achievement.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(achievement)
    return acc
  }, {} as Record<string, AchievementType[]>)

  // Sort categories by their display order
  const orderedCategories = Object.keys(achievementsByCategory).sort((a, b) => {
    // Define the display order for categories
    const order = [
      AchievementCategory.MILESTONES,
      AchievementCategory.SHUFFLE_COUNT,
      AchievementCategory.STREAKS,
      AchievementCategory.SHUFFLE_PATTERNS,
      AchievementCategory.SPECIAL_SHUFFLES,
      AchievementCategory.TIME_BASED,
      AchievementCategory.POP_CULTURE,
      AchievementCategory.QUIRKY,
      'other',
    ]
    return order.indexOf(a) - order.indexOf(b)
  })

  return (
    <div className={cn('space-y-6', className)}>
      <h3 className='text-lg font-semibold text-slate-100'>Achievements</h3>

      {orderedCategories.map((category) => (
        <div key={category} className='mb-6'>
          <h4 className='text-md font-medium text-slate-200 mb-3 flex items-center'>
            <span className='mr-2'>{categoryIcons[category] || '❓'}</span>
            {categoryNames[category] || 'Other Achievements'}
            <span className='ml-2 text-sm text-slate-400'>
              {
                achievementsByCategory[category].filter((a) => unlockedAchievements.includes(a.id))
                  .length
              }
              /{achievementsByCategory[category].length}
            </span>
          </h4>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {achievementsByCategory[category].map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  'p-4 rounded-lg border transition-all',
                  unlockedAchievements.includes(achievement.id)
                    ? 'bg-green-900/30 border-green-700 text-green-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                )}
              >
                <div className='flex items-center gap-2'>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      unlockedAchievements.includes(achievement.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    )}
                  >
                    {unlockedAchievements.includes(achievement.id) ? '✓' : '?'}
                  </div>
                  <div>
                    <h4 className='font-medium text-slate-100'>{achievement.name}</h4>
                    <p className='text-sm text-slate-400'>{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className='text-right text-sm text-slate-400'>
        <span className='font-medium'>{unlockedAchievements.length}</span> of{' '}
        <span className='font-medium'>{ACHIEVEMENTS.length}</span> achievements unlocked
      </div>
    </div>
  )
}
