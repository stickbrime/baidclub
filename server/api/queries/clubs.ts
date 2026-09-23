import { getDb } from "./connection";
import { CLUBS } from "@db/clubs-data";
import { clubs, ads, announcements } from "@db/schema";
import { asc } from "drizzle-orm";

const REMOTE_API = "https://baid.kimi.site/api/trpc";

async function remoteQuery<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${REMOTE_API}/${path}`, {
      headers: { "content-type": "application/json" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as any;
    if (body.error) return null;
    return body.result.data.json as T;
  } catch {
    return null;
  }
}

// ── 内存存储（无数据库时使用）──────────────────────────────────
type Club = typeof clubs.$inferSelect;
type Ad = typeof ads.$inferSelect & { image?: string | null };
type Announcement = typeof announcements.$inferSelect;

const memAnnouncements: Map<number, Announcement> = new Map();
const memAds: Map<number, Ad> = new Map();
const memClubOverrides: Map<number, Partial<Club>> = new Map();
const memDeletedClubs: Set<number> = new Set();
let memAnnId = 1;
let memAdId = 1;

// ── Clubs ──────────────────────────────────────────────────────
export async function listClubs() {
  const remote = await remoteQuery<Club[]>("clubs.list");
  let base: Club[];
  if (remote) {
    base = remote;
  } else {
    try {
      base = await getDb().select().from(clubs).orderBy(asc(clubs.sort), asc(clubs.id));
    } catch {
      base = CLUBS.map((c) => ({ ...c, createdAt: new Date() }));
    }
  }
  return base
    .filter((c) => !memDeletedClubs.has(c.id))
    .map((c) => ({ ...c, ...memClubOverrides.get(c.id) }))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id);
}

export async function updateClub(
  id: number,
  data: Partial<{
    name: string;
    cat: string;
    leader: string;
    advisor: string;
    time: string;
    room: string;
    intro: string;
    poster: string | null;
    qr: string | null;
  }>,
) {
  const existing = memClubOverrides.get(id) ?? {};
  memClubOverrides.set(id, { ...existing, ...data });
}

export async function deleteClub(id: number) {
  memDeletedClubs.add(id);
  for (const [aid, a] of memAnnouncements) {
    if (a.clubId === id) memAnnouncements.delete(aid);
  }
}

// ── Ads ────────────────────────────────────────────────────────
export async function listAds() {
  const remote = await remoteQuery<Ad[]>("ads.list");
  const remoteAds = remote ?? [];
  const localAds = [...memAds.values()].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id,
  );
  return [...localAds, ...remoteAds];
}

export async function createAd(data: {
  title?: string;
  content?: string;
  link?: string;
  author?: string;
  image?: string;
}) {
  const id = memAdId++;
  memAds.set(id, {
    id,
    title: data.title ?? "",
    content: data.content ?? null,
    link: data.link ?? "",
    author: data.author ?? "",
    createdAt: new Date(),
    image: data.image ?? null,
  });
  return id;
}

export async function deleteAd(id: number) {
  memAds.delete(id);
}

// ── Announcements ──────────────────────────────────────────────
export async function listAnnouncements(clubId: number) {
  const remote = await remoteQuery<Announcement[]>(
    `announcements.list?input=${encodeURIComponent(JSON.stringify({ json: { clubId } }))}`,
  );
  const remoteAnns = remote ?? [];
  const localAnns = [...memAnnouncements.values()].filter((a) => a.clubId === clubId);
  return [...localAnns, ...remoteAnns].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id,
  );
}

export async function createAnnouncement(data: {
  clubId: number;
  author?: string;
  contentHtml: string;
}) {
  const id = memAnnId++;
  memAnnouncements.set(id, {
    id,
    clubId: data.clubId,
    author: data.author ?? "",
    contentHtml: data.contentHtml,
    createdAt: new Date(),
  });
  return id;
}

export async function deleteAnnouncement(id: number) {
  memAnnouncements.delete(id);
}

export async function updateAnnouncement(
  id: number,
  data: { author?: string; contentHtml?: string },
) {
  const existing = memAnnouncements.get(id);
  if (!existing) return;
  memAnnouncements.set(id, {
    ...existing,
    ...(data.author !== undefined ? { author: data.author } : {}),
    ...(data.contentHtml !== undefined ? { contentHtml: data.contentHtml } : {}),
  });
}

export async function updateAd(
  id: number,
  data: { title?: string; content?: string; link?: string; author?: string; image?: string | null },
) {
  const existing = memAds.get(id);
  if (!existing) return;
  memAds.set(id, {
    ...existing,
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.content !== undefined ? { content: data.content ?? null } : {}),
    ...(data.link !== undefined ? { link: data.link } : {}),
    ...(data.author !== undefined ? { author: data.author } : {}),
    ...(data.image !== undefined ? { image: data.image ?? null } : {}),
  });
}
