// Arrays of components to build usernames
const adjectives = [
  'swift',
  'brave',
  'lucky',
  'clever',
  'mighty',
  'nimble',
  'quick',
  'sharp',
  'smart',
  'spry',
  'keen',
  'slick',
  'bold',
  'deft',
  'grand',
  'noble',
  'proud',
  'wise',
  'calm',
  'cool',
  'eager',
  'glad',
  'kind',
  'nice',
  'wild',
  'zany',
  'jolly',
  'merry',
  'free',
  'busy',
]

const nouns = [
  'ace',
  'king',
  'queen',
  'jack',
  'joker',
  'dealer',
  'card',
  'deck',
  'game',
  'play',
  'hand',
  'trick',
  'suit',
  'club',
  'spade',
  'heart',
  'diamond',
  'flush',
  'pair',
  'royal',
  'poker',
  'bridge',
  'score',
  'point',
  'match',
  'round',
  'win',
  'draw',
  'deal',
  'stack',
]

/**
 * Generate a random username in the format "adjectivenoun123"
 * @returns {string} A randomly generated username
 */
export function generateUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 1000)

  return `${adjective}${noun}${number}`
}

/**
 * Generate a list of random usernames
 * @param {number} count Number of usernames to generate
 * @returns {string[]} Array of randomly generated usernames
 */
export function generateMultipleUsernames(count: number): string[] {
  const usernames: string[] = []

  for (let i = 0; i < count; i++) {
    usernames.push(generateUsername())
  }

  return usernames
}

export default generateUsername
