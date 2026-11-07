import { z } from "zod";

export const tutorRequestSchema = z.object({
  question: z.string().trim().min(2).max(2000),
  subject: z.string().trim().min(1).max(80).default("General"),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  goal: z.string().trim().max(300).default("Understand the topic and practise it."),
});

export type TutorRequest = z.infer<typeof tutorRequestSchema>;
