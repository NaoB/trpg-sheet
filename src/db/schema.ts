import { pgTable, uuid, text, integer } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  xp: integer().notNull().default(0),
});

export const statisticsTable = pgTable("statistics", {
  id: uuid().primaryKey(),
  userId: uuid().notNull().references(() => usersTable.id),
  name: text().notNull(),
  shortName: text().notNull(),
  description: text().notNull(),
  level: integer().notNull().default(0),
  slug: text().notNull(),
  formulaType: text(),
  formulaStatisticId: uuid().references(() => statisticsTable.id),
  formulaValue: integer(),
});

export const skillsTable = pgTable("skills", {
  id: uuid().primaryKey(),
  statisticId: uuid().notNull().references(() => statisticsTable.id),
  name: text().notNull(),
  costPerLevel: integer().notNull().default(1),
  level: integer().notNull().default(0),
  base: integer().notNull().default(0),
  bonus: integer().notNull().default(0),
  total: integer().notNull().default(0),
  slug: text().notNull(),
});
