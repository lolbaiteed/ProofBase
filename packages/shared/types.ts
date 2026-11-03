import { z } from "zod";

export const uuidIdSchema = z
  .string()
  .uuid() as z.ZodType<`${string}-${string}-${string}-${string}-${string}`>;
