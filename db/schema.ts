import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
} from "drizzle-orm/mysql-core";

export const clubs = mysqlTable("clubs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cat: varchar("cat", { length: 64 }).notNull(),
  leader: varchar("leader", { length: 255 }).default(""),
  advisor: varchar("advisor", { length: 255 }).default(""),
  time: varchar("time", { length: 255 }).default(""),
  room: varchar("room", { length: 255 }).default(""),
  intro: text("intro"),
  poster: varchar("poster", { length: 512 }),
  qr: varchar("qr", { length: 512 }),
  sort: int("sort").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ads = mysqlTable("ads", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  link: varchar("link", { length: 512 }).default(""),
  author: varchar("author", { length: 128 }).default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const announcements = mysqlTable("announcements", {
  id: serial("id").primaryKey(),
  clubId: bigint("club_id", { mode: "number", unsigned: true }).notNull(),
  author: varchar("author", { length: 128 }).default(""),
  contentHtml: text("content_html").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Club = typeof clubs.$inferSelect;
export type InsertClub = typeof clubs.$inferInsert;
export type Ad = typeof ads.$inferSelect;
export type InsertAd = typeof ads.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;
