import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { generateSlug } from "random-word-slugs";

export const projectsRouter = createTRPCRouter({
    getMany: baseProcedure
        .query(async ()=> {
            const projects = await prisma.project.findMany({
                orderBy:{
                    updatedAt: "desc"
                },
                include: {
                    _count: {
                        select: { messages: true }
                    }
                }
            });

            return projects;
        }),

    getOne: baseProcedure
        .input(
            z.object({
                id: z.string().min(1, { message: "Project ID is required." }),
            })
        )
        .query(async ({ input }) => {
            const project = await prisma.project.findUniqueOrThrow({
                where: { id: input.id },
            });

            return project;
        }),

    create: baseProcedure
        .input(
            z.object({
                value: z.string()
                    .min(1, {message: "Value is required."})
                    .max(10000, {message: "Value is too long."})
            })
        )
        .mutation(async ({input})=>{
            const createdProject = await prisma.project.create({
                data:{
                    name: generateSlug(2, {
                        format: "kebab"
                    }),
                    messages:{
                        create:{
                            content: input.value,
                            role: "USER",
                            type: "RESULT"
                        }
                    }
                }
            })          

            await inngest.send({
                name: "app/developerEvent",
                data: {
                    value: input.value,
                    projectId: createdProject.id,
                }
            })
            return createdProject;
        })
})
