'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/card'
import { Button } from '@/components/ui/button'
import { createDeck, shuffleDeck } from '@/lib/cards'
import { Card as CardType } from '@/types'

interface ShuffleDisplayProps {
  onSaveShuffle: (cards: CardType[]) => Promise<void>
  className?: string
}

export function ShuffleDisplay({ onSaveShuffle, className }: ShuffleDisplayProps) {
  const [currentShuffle, setCurrentShuffle] = useState<CardType[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)

  useEffect(() => {
    handleShuffle()
  }, [])

  const handleShuffle = () => {
    const deck = createDeck()
    const shuffled = shuffleDeck(deck)
    setCurrentShuffle(shuffled)
    setSelectedCardIndex(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSaveShuffle(currentShuffle)
      // If save successful, shuffle again
      handleShuffle()
    } catch (error) {
      console.error('Failed to save shuffle:', error)
      // Don't shuffle if save failed
    } finally {
      setIsSaving(false)
    }
  }

  const handleCardClick = (index: number) => {
    setSelectedCardIndex(selectedCardIndex === index ? null : index)
  }

  return (
    <div className={className}>
      <div className='flex gap-4 mb-6'>
        <Button
          onClick={handleShuffle}
          disabled={isSaving}
          className='bg-indigo-700 hover:bg-indigo-800 text-white font-medium'
        >
          shuffle
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className='bg-emerald-700 hover:bg-emerald-800 text-white font-medium'
        >
          {isSaving ? 'saving and shuffling...' : 'save + shuffle'}
        </Button>
      </div>

      <div className='bg-slate-800 rounded-lg p-4 sm:p-6 shadow-inner'>
        <div className='flex justify-between items-center mb-3 sm:mb-5'>
          <div className='text-slate-400 text-xs sm:text-sm'>
            your latest {currentShuffle.length} card shuffle, in order
          </div>
        </div>

        <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-13 gap-3 sm:gap-4 md:gap-5 place-items-center'>
          {currentShuffle.map((card, index) => (
            <div
              key={`${card.suit}-${card.value}-${index}`}
              onClick={() => handleCardClick(index)}
              className={`${
                selectedCardIndex === index ? 'ring-2 ring-indigo-400' : ''
              } transition-all duration-200 flex justify-center mb-2`}
              aria-label={`${card.value} of ${card.suit}, position ${index + 1}`}
            >
              <Card card={card} index={index} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
