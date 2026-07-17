import { z } from "zod";

export const optionSchema = z.object({
  label: z.string().min(1).max(5),
  option_text: z.string().min(1),
  is_correct: z.boolean(),
});

export const questionSchema = z.object({
  external_id: z.string().max(100).optional().nullable(),
  question_type: z.enum(["single_best_answer", "multiple_select", "true_false"]),
  stem: z.string().min(10),
  clinical_vignette: z.string().optional().nullable(),
  explanation: z.string().min(5),
  learning_point: z.string().optional().nullable(),
  reference_text: z.string().optional().nullable(),
  subject_id: z.string().uuid(),
  topic_id: z.string().uuid().optional().nullable(),
  difficulty: z.enum(["foundation", "standard", "advanced"]),
  status: z.enum(["draft", "published", "archived"]),
  tags: z.array(z.string()).default([]),
  options: z.array(optionSchema).min(2).max(10),
}).superRefine((value, ctx) => {
  const correct = value.options.filter((o) => o.is_correct).length;
  if (value.question_type === "single_best_answer" && correct !== 1) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Single-best-answer questions require exactly one correct option." });
  }
  if (value.question_type === "multiple_select" && correct < 1) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Multiple-select questions require at least one correct option." });
  }
});

export type QuestionInput = z.infer<typeof questionSchema>;
