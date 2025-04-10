'use client'

import { Achievement as AchievementType } from '@/types'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { cn } from '@/lib/utils'

interface AchievementsProps {
  unlockedAchievements: string[]
  className?: string
}

export function Achievements({ unlockedAchievements, className }: AchievementsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className='text-lg font-semibold text-slate-100'>Achievements</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {ACHIEVEMENTS.map((achievement) => (
          <div
            key={achievement.id}
            className={cn(
              'p-4 rounded-lg border',
              unlockedAchievements.includes(achievement.id)
                ? 'bg-green-900/30 border-green-700 text-green-200'
                : 'bg-slate-800 border-slate-700 text-slate-300'
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
  )
}
