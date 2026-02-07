import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { inngest } from '@/inngest/client';
export const appRouter = createTRPCRouter({

  invoke: baseProcedure
    .input(
      z.object({
        value: z.string()
      })
    )
    .mutation(async ({ input }) =>{
      await inngest.send({
        name: "test/hello.world",
        data: {
          value: input.value,
        }
      })
    }),

  invokeDeveloper: baseProcedure
    .input(
      z.object({
        value: z.string()
      })
    )
    .mutation(async ({ input }) =>{
      await inngest.send({
        name: "app/developerEvent",
        data: {
          value: input.value,
        }
      })
    }),

  hi: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hi src/trpc/routers/_app.ts : ${opts.input.text}`,
      };
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;