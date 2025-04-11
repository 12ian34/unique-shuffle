// Fun adjectives for username generation
const adjectives = [
  'Swift',
  'Clever',
  'Cosmic',
  'Dazzling',
  'Electric',
  'Funky',
  'Groovy',
  'Hyper',
  'Jazzy',
  'Lunar',
  'Mighty',
  'Nimble',
  'Orbiting',
  'Plucky',
  'Quantum',
  'Radiant',
  'Stellar',
  'Turbo',
  'Ultra',
  'Vibrant',
  'Wacky',
  'Zealous',
  'Astral',
  'Bouncy',
  'Chromatic',
  'Dynamic',
  'Epic',
  'Feisty',
  'Glowing',
  'Heroic',
  'Iconic',
  'Jumbo',
]

// Fun nouns for username generation
const nouns = [
  'Panda',
  'Dragon',
  'Phoenix',
  'Wizard',
  'Ninja',
  'Pirate',
  'Robot',
  'Astronaut',
  'Rocket',
  'Comet',
  'Tiger',
  'Dolphin',
  'Eagle',
  'Griffin',
  'Pegasus',
  'Sasquatch',
  'Unicorn',
  'Viking',
  'Samurai',
  'Titan',
  'Voyager',
  'Warrior',
  'Champion',
  'Pixie',
  'Knight',
  'Ranger',
  'Explorer',
  'Pioneer',
  'Magician',
  'Drummer',
  'Dancer',
  'Turtle',
]

/**
 * Generates a fun and unique username based on a user ID
 *
 * @param userId - The user's ID to use as a seed
 * @returns A fun username like "SwiftPanda42" or "CosmicDragon77"
 */
export function generateUsername(userId: string): string {
  // Use parts of the userId to create deterministic but random-seeming selections
  const firstChar = userId.charCodeAt(0) % adjectives.length
  const secondChar = userId.charCodeAt(1) % nouns.length

  // Get a number from the userId to append to the username
  const numericValue = ((userId.charCodeAt(2) % 10) * 10 + (userId.charCodeAt(3) % 10)) % 100

  const adjective = adjectives[firstChar]
  const noun = nouns[secondChar]

  return `${adjective}${noun}${numericValue}`
}
