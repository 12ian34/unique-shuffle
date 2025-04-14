'use client'

import { useState } from 'react'
import { Deck, Pattern } from '@/types'
import { Card } from './card'
import { cn } from '@/lib/utils'

interface ShuffleDisplayProps {
  deck: Deck
  patterns?: Pattern[]
  className?: string
}

export function ShuffleDisplay({ deck, patterns = [], className }: ShuffleDisplayProps) {
  // Instead of tracking a string ID, track the actual indices array of the selected pattern
  const [selectedIndices, setSelectedIndices] = useState<number[] | null>(null)

  // Create a set of indices that should be highlighted
  const highlightedIndices = new Set<number>()

  if (selectedIndices === null) {
    // If no pattern is selected, highlight all pattern indices
    patterns.forEach((pattern) => {
      if (pattern.indices) {
        pattern.indices.forEach((index) => {
          highlightedIndices.add(index)
        })
      }
    })
  } else {
    // Otherwise highlight only the selected indices
    selectedIndices.forEach((index) => {
      highlightedIndices.add(index)
    })
  }

  // Group patterns by exact indices to handle overlapping patterns
  const patternGroups = new Map<string, Pattern[]>()

  patterns.forEach((pattern) => {
    if (!pattern.indices || pattern.indices.length === 0) return

    // Create a key based on the exact indices
    const key = [...pattern.indices].sort((a, b) => a - b).join(',')

    if (!patternGroups.has(key)) {
      patternGroups.set(key, [])
    }
    patternGroups.get(key)?.push(pattern)
  })

  // Convert the Map entries to an array for rendering
  const groupEntries = Array.from(patternGroups.entries())

  return (
    <div className='space-y-6'>
      {patterns.length > 0 && (
        <div className='space-y-3'>
          <h3 className='text-lg font-medium'>patterns</h3>
          <div className='flex flex-wrap gap-2'>
            {/* Iterate through unique pattern groups instead of all patterns */}
            {groupEntries.map(([indicesKey, groupPatterns], groupIndex) => {
              const indices = indicesKey.split(',').map(Number)
              const isSelected =
                selectedIndices !== null &&
                indices.length === selectedIndices.length &&
                indices.every((i: number) => selectedIndices.includes(i))

              // Use the first pattern in the group for display
              const pattern = groupPatterns[0]

              return (
                <button
                  key={`pattern-group-${groupIndex}`}
                  onClick={() => setSelectedIndices(isSelected ? null : indices)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-all duration-200 focus-effect',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30'
                  )}
                  title={pattern.description}
                >
                  {pattern.name}
                  {groupPatterns.length > 1 ? ` (${groupPatterns.length})` : ''}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div
        className={cn(
          'grid grid-cols-4 md:grid-cols-13 gap-2.5 bg-card/50 p-4 rounded-lg border border-border/30',
          className
        )}
      >
        {deck.map((card) => (
          <Card key={card.index} card={card} isHighlighted={highlightedIndices.has(card.index)} />
        ))}
      </div>
    </div>
  )
}
