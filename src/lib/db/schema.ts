import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

type DbSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
type DbRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
type DbColor = 'red' | 'black'

interface DbCard {
  suit: DbSuit
  rank: DbRank
  value: number
  color: DbColor
  index: number
}

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull(),
  totalShuffles: integer('total_shuffles').notNull().default(0),
  shuffleStreak: integer('shuffle_streak').notNull().default(0),
  lastShuffleDate: date('last_shuffle_date', { mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const shuffles = pgTable('shuffles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  cards: jsonb('cards').$type<DbCard[]>().notNull(),
  isSaved: boolean('is_saved').notNull().default(false),
  isShared: boolean('is_shared').notNull().default(false),
  shareCode: text('share_code').unique(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const achievements = pgTable(
  'achievements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id').notNull(),
    shuffleId: uuid('shuffle_id').references(() => shuffles.id, { onDelete: 'set null' }),
    count: integer('count').notNull().default(1),
    achievedAt: timestamp('achieved_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [unique('achievements_user_achievement_shuffle_unique').on(table.userId, table.achievementId, table.shuffleId)]
)

export const sharedShuffles = pgTable('shared_shuffles', {
  id: uuid('id').defaultRandom().primaryKey(),
  shuffleId: uuid('shuffle_id')
    .notNull()
    .unique()
    .references(() => shuffles.id, { onDelete: 'cascade' }),
  views: integer('views').notNull().default(0),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const friends = pgTable(
  'friends',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    friendId: uuid('friend_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [unique('friends_user_friend_unique').on(table.userId, table.friendId)]
)

export const globalStats = pgTable('global_stats', {
  id: text('id').primaryKey(),
  count: integer('count').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const publicSharedShuffles = pgTable('public_shared_shuffles', {
  shareCode: text('share_code').primaryKey(),
  cards: jsonb('cards').$type<DbCard[]>().notNull(),
  patterns: jsonb('patterns').$type<Array<{ id: string; name: string; description: string }>>().notNull(),
  achievementIds: jsonb('achievement_ids').$type<string[]>().notNull(),
  displayName: text('display_name'),
  profileHash: text('profile_hash'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  views: integer('views').notNull().default(0),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true, mode: 'string' }),
})

export type UserProfileRow = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert
export type ShuffleRow = typeof shuffles.$inferSelect
export type NewShuffle = typeof shuffles.$inferInsert
export type AchievementRow = typeof achievements.$inferSelect
export type NewAchievement = typeof achievements.$inferInsert
export type SharedShuffleRow = typeof sharedShuffles.$inferSelect
export type FriendRow = typeof friends.$inferSelect
export type GlobalStatsRow = typeof globalStats.$inferSelect
export type PublicSharedShuffleRow = typeof publicSharedShuffles.$inferSelect
