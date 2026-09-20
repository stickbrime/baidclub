import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { TRPCClientError } from "@trpc/client";
import type { AnyRouter } from "@trpc/server";
import {
  listClubs,
  updateClub,
  deleteClub,
  listAds,
  createAd,
  updateAd,
  deleteAd,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "./local-store";

export function localLink<TRouter extends AnyRouter>(): TRPCLink<TRouter> {
  return () =>
    ({ op }) =>
      observable((observer) => {
        try {
          const { path, input, type } = op;
          let result: unknown;

          switch (path) {
            case "ping":
              result = { ok: true, ts: Date.now() };
              break;

            // Clubs
            case "clubs.list":
              result = listClubs();
              break;
            case "clubs.update": {
              const { id, ...data } = input as { id: number; [k: string]: unknown };
              updateClub(id, data);
              result = { ok: true };
              break;
            }
            case "clubs.delete": {
              const { id } = input as { id: number };
              deleteClub(id);
              result = { ok: true };
              break;
            }

            // Ads
            case "ads.list":
              result = listAds();
              break;
            case "ads.create": {
              const id = createAd(input as Parameters<typeof createAd>[0]);
              result = { ok: true, id };
              break;
            }
            case "ads.update": {
              const { id, ...data } = input as { id: number; [k: string]: unknown };
              updateAd(id, data as Parameters<typeof updateAd>[1]);
              result = { ok: true };
              break;
            }
            case "ads.delete": {
              const { id } = input as { id: number };
              deleteAd(id);
              result = { ok: true };
              break;
            }

            // Announcements
            case "announcements.list": {
              const { clubId } = input as { clubId: number };
              result = listAnnouncements(clubId);
              break;
            }
            case "announcements.create": {
              const id = createAnnouncement(input as Parameters<typeof createAnnouncement>[0]);
              result = { ok: true, id };
              break;
            }
            case "announcements.update": {
              const { id, ...data } = input as { id: number; [k: string]: unknown };
              updateAnnouncement(id, data as Parameters<typeof updateAnnouncement>[1]);
              result = { ok: true };
              break;
            }
            case "announcements.delete": {
              const { id } = input as { id: number };
              deleteAnnouncement(id);
              result = { ok: true };
              break;
            }

            default:
              throw new Error(`Unknown procedure: ${path}`);
          }

          observer.next({ result: { data: result, type } } as any);
          observer.complete();
        } catch (err) {
          observer.error(TRPCClientError.from(err as Error));
        }
      });
}
