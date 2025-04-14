'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Achievement } from '@/types'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface AchievementShareProps {
  achievement: Achievement
  count: number
  total: number
}

export function AchievementShare({ achievement, count, total }: AchievementShareProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  // Generate achievement share text with emojis
  const generateShareText = () => {
    const percentage = Math.round((count / total) * 100)

    // Get appropriate emoji for the achievement
    const getEmoji = () => {
      if (achievement.type === 'pattern') {
        switch (achievement.criteria.patternId) {
          case 'royal_flush':
            return '👑♠️'
          case 'straight_flush':
            return '🔄♥️'
          case 'four_of_a_kind':
            return '4️⃣🎯'
          case 'full_house':
            return '🏠♣️'
          case 'flush':
            return '♦️♦️'
          case 'straight':
            return '➡️🃏'
          case 'three_of_a_kind':
            return '3️⃣🎯'
          case 'two_pair':
            return '4️⃣🎴'
          case 'alternating_colors':
            return '🔄🎨'
          case 'all_red':
            return '❤️🔴'
          case 'all_black':
            return '⚫️♠️'
          case 'four_aces':
            return '4️⃣🅰️'
          case 'royal_family':
            return '👑👑'
          case 'lucky_thirteen':
            return '🍀1️⃣3️⃣'
          case 'perfect_suit':
            return '👌♦️'
          case 'stairway_to_heaven':
            return '🪜☁️'
          case 'highway_to_hell':
            return '🛣️🔥'
          case 'prime_position':
            return '🔢🎯'
          case 'palindrome':
            return '🔄🪞'
          case 'four_corners':
            return '4️⃣📐'
          case 'unlucky_shuffle':
            return '🔄❌'
          case 'the_sandwich':
            return '🥪🃏'
          case 'fibonacci_sequence':
            return '🌀🔢'
          case 'rainbow':
            return '🌈🃏'
          case 'prime_values':
            return '🔢🧮'
          case 'sum_thirteen':
            return '➕1️⃣3️⃣'
          case 'color_gradient':
            return '🎨🔄'
          case 'perfect_balance':
            return '⚖️🎴'
          case 'sequential_trio':
            return '3️⃣➡️'
          case 'even_odd_pattern':
            return '2️⃣🔄'
          case 'perfect_order':
            return '✨📊'
          case 'quad_sequence':
            return '4️⃣4️⃣➡️'
          case 'royal_procession':
            return '👑👑👑'
          case 'mirror_shuffle':
            return '🪞🎴'
          case 'perfect_bridge':
            return '🌉✨'
          case 'symmetrical_suits':
            return '♠️🪞♥️'
          case 'consecutive_flush_quads':
            return '4️⃣♥️♦️♣️♠️'
          case 'consecutive_runs':
            return '🏃‍♂️🏃‍♂️🏃‍♂️'
          case 'suit_segregation':
            return '♥️🔄♠️'
          default:
            return '🎴'
        }
      } else if (achievement.type === 'count') {
        return '🔢🎮'
      } else if (achievement.type === 'time') {
        return '⏰🎯'
      }

      return '🃏✨'
    }

    return `I just unlocked "${achievement.name}" (${getEmoji()}) in Unique Shuffle!\n\n${
      achievement.description
    }\n\nI've earned ${count}/${total} achievements (${percentage}%). Can you beat that? 🎮🎴`
  }

  const shareText = generateShareText()

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(shareText)
      toast({
        title: 'Copied to clipboard!',
        description: 'Share your achievement with friends.',
      })
      setOpen(false)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: 'Failed to copy',
        description: 'Please try again or copy manually.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm'>
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='space-y-2'>
          <h4 className='font-medium'>Share Achievement</h4>
          <p className='text-sm text-muted-foreground'>
            Copy this text to share your achievement on WhatsApp or other platforms.
          </p>
          <Textarea readOnly value={shareText} className='min-h-[100px]' />
          <div className='flex justify-end'>
            <Button size='sm' onClick={copyToClipboard}>
              Copy to Clipboard
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
