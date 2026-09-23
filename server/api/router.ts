import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  listClubs,
  updateClub,
  deleteClub,
  listAds,
  createAd,
  deleteAd,
  updateAd,
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "./queries/clubs";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  clubs: createRouter({
    list: publicQuery.query(() => listClubs()),
    update: publicQuery
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          cat: z.string().max(64).optional(),
          leader: z.string().max(255).optional(),
          advisor: z.string().max(255).optional(),
          time: z.string().max(255).optional(),
          room: z.string().max(255).optional(),
          intro: z.string().max(5000).optional(),
          poster: z.string().max(500000).nullable().optional(),
          qr: z.string().max(500000).nullable().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateClub(id, data);
        return { ok: true };
      }),
    delete: publicQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteClub(input.id);
        return { ok: true };
      }),
  }),

  ads: createRouter({
    list: publicQuery.query(() => listAds()),
    create: publicQuery
      .input(
        z.object({
          title: z.string().max(255).optional(),
          content: z.string().max(2000).optional(),
          link: z.string().max(512).optional(),
          author: z.string().max(128).optional(),
          image: z.string().max(2000000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const id = await createAd(input);
        return { ok: true, id };
      }),
    update: publicQuery
      .input(
        z.object({
          id: z.number(),
          title: z.string().max(255).optional(),
          content: z.string().max(2000).optional(),
          link: z.string().max(512).optional(),
          author: z.string().max(128).optional(),
          image: z.string().max(2000000).nullable().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAd(id, data);
        return { ok: true };
      }),
    delete: publicQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAd(input.id);
        return { ok: true };
      }),
  }),

  announcements: createRouter({
    list: publicQuery
      .input(z.object({ clubId: z.number() }))
      .query(({ input }) => listAnnouncements(input.clubId)),
    create: publicQuery
      .input(
        z.object({
          clubId: z.number(),
          author: z.string().max(128).optional(),
          contentHtml: z.string().min(1).max(100000),
        }),
      )
      .mutation(async ({ input }) => {
        const id = await createAnnouncement(input);
        return { ok: true, id };
      }),
    update: publicQuery
      .input(
        z.object({
          id: z.number(),
          author: z.string().max(128).optional(),
          contentHtml: z.string().min(1).max(100000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAnnouncement(id, data);
        return { ok: true };
      }),
    delete: publicQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAnnouncement(input.id);
        return { ok: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
