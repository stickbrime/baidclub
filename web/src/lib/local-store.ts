import { CLUBS } from "@db/clubs-data";

type Club = typeof CLUBS[number] & { createdAt?: string };
type Ad = {
  id: number;
  title: string;
  content: string | null;
  link: string;
  author: string;
  image: string | null;
  createdAt: string;
};
type Announcement = {
  id: number;
  clubId: number;
  author: string | null;
  contentHtml: string;
  createdAt: string;
};

const KEYS = {
  clubs: "baid_clubs",
  ads: "baid_ads",
  announcements: "baid_announcements",
  adId: "baid_ad_id",
  annId: "baid_ann_id",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

function initClubs(): Club[] {
  const existing = read<Club[] | null>(KEYS.clubs, null);
  if (existing && existing.length > 0) return existing;
  const clubs = CLUBS.map((c) => ({ ...c, createdAt: new Date().toISOString() }));
  write(KEYS.clubs, clubs);
  return clubs;
}

export function listClubs(): Club[] {
  const clubs = initClubs();
  return [...clubs].sort(
    (a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id,
  );
}

export function updateClub(id: number, data: Partial<Omit<Club, "id">>) {
  const clubs = initClubs();
  const idx = clubs.findIndex((c) => c.id === id);
  if (idx >= 0) {
    clubs[idx] = { ...clubs[idx], ...data };
    write(KEYS.clubs, clubs);
  }
}

export function deleteClub(id: number) {
  const clubs = initClubs();
  const filtered = clubs.filter((c) => c.id !== id);
  write(KEYS.clubs, filtered);
  const anns = listAnnouncementsAll().filter((a) => a.clubId !== id);
  write(KEYS.announcements, anns);
}

function nextAdId(): number {
  const id = read<number>(KEYS.adId, 0) + 1;
  write(KEYS.adId, id);
  return id;
}

export function listAds(): Ad[] {
  return read<Ad[]>(KEYS.ads, []);
}

export function createAd(data: {
  title?: string;
  content?: string;
  link?: string;
  author?: string;
  image?: string;
}): number {
  const ads = listAds();
  const id = nextAdId();
  ads.push({
    id,
    title: data.title ?? "",
    content: data.content ?? null,
    link: data.link ?? "",
    author: data.author ?? "",
    image: data.image ?? null,
    createdAt: new Date().toISOString(),
  });
  write(KEYS.ads, ads);
  return id;
}

export function updateAd(
  id: number,
  data: {
    title?: string;
    content?: string;
    link?: string;
    author?: string;
    image?: string | null;
  },
) {
  const ads = listAds();
  const idx = ads.findIndex((a) => a.id === id);
  if (idx >= 0) {
    if (data.title !== undefined) ads[idx].title = data.title;
    if (data.content !== undefined) ads[idx].content = data.content ?? null;
    if (data.link !== undefined) ads[idx].link = data.link;
    if (data.author !== undefined) ads[idx].author = data.author;
    if (data.image !== undefined) ads[idx].image = data.image ?? null;
    write(KEYS.ads, ads);
  }
}

export function deleteAd(id: number) {
  const ads = listAds().filter((a) => a.id !== id);
  write(KEYS.ads, ads);
}

function nextAnnId(): number {
  const id = read<number>(KEYS.annId, 0) + 1;
  write(KEYS.annId, id);
  return id;
}

function listAnnouncementsAll(): Announcement[] {
  return read<Announcement[]>(KEYS.announcements, []);
}

export function listAnnouncements(clubId: number): Announcement[] {
  return listAnnouncementsAll()
    .filter((a) => a.clubId === clubId)
    .sort((a, b) => b.id - a.id);
}

export function createAnnouncement(data: {
  clubId: number;
  author?: string;
  contentHtml: string;
}): number {
  const anns = listAnnouncementsAll();
  const id = nextAnnId();
  anns.push({
    id,
    clubId: data.clubId,
    author: data.author ?? null,
    contentHtml: data.contentHtml,
    createdAt: new Date().toISOString(),
  });
  write(KEYS.announcements, anns);
  return id;
}

export function updateAnnouncement(
  id: number,
  data: { author?: string; contentHtml?: string },
) {
  const anns = listAnnouncementsAll();
  const idx = anns.findIndex((a) => a.id === id);
  if (idx >= 0) {
    if (data.author !== undefined) anns[idx].author = data.author ?? null;
    if (data.contentHtml !== undefined) anns[idx].contentHtml = data.contentHtml;
    write(KEYS.announcements, anns);
  }
}

export function deleteAnnouncement(id: number) {
  const anns = listAnnouncementsAll().filter((a) => a.id !== id);
  write(KEYS.announcements, anns);
}
