import { z } from "zod";

export const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

export const lessonSchema = z.object({
  title: z.string(),
  objective: z.string(),
  durationMinutes: z.number().int().min(5).max(180),
  explanation: z.string(),
  practiceTask: z.string(),
  quiz: z.array(quizQuestionSchema).min(2).max(5),
});

export const learningPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  lessons: z.array(lessonSchema).min(3).max(7),
});

export type LearningPlan = z.infer<typeof learningPlanSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
