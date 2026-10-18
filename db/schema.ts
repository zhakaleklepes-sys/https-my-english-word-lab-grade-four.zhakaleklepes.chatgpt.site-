import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const testResults = sqliteTable('test_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  student: text('student').notNull(),
  studentKey: text('student_key').notNull(),
  unit: integer('unit').notNull(),
  score: integer('score').notNull(),
  total: integer('total').notNull(),
  percent: integer('percent').notNull(),
  createdAt: text('created_at').notNull(),
});
