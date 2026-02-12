import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export const messagesRouter = createTRPCRouter({
    getMany: baseProcedure
        .input(
            z.object({
                projectId: z.string().min(1, { message: "Project ID is required." }),
            })
        )
        .query(async ({ input }) => {
            const messages = await prisma.message.findMany({
                where: { projectId: input.projectId },
                orderBy: {
                    createdAt: "asc"
                },
                include: {
                    fragment: true,
                },
            });

            return messages;
        }),

    create: baseProcedure
        .input(
            z.object({
                value: z.string()
                .min(1, {message: "Value is required."})
                .max(10000, {message: "Value is too long."}),
                projectId: z.string().min(1, {message: "Project ID is required."}),

            })
        )
        .mutation(async ({input})=>{
            await prisma.message.create({
                data: {
                    projectId: input.projectId,
                    content: input.value,
                    role: "USER",
                    type: "RESULT",
                },
            });

            await inngest.send({
                name: "app/developerEvent",
                data: {
                    value: input.value,
                    projectId: input.projectId,
                },
            })

        })
})
