import { z } from "zod";
import { QUESTION_IDS, ANSWER } from "../services/risk/indicators.js";
import { COMPLAINT_TYPES } from "../models/reportSchema.js";

// Every route's input contract in one place. Unknown keys are stripped by
// default, so nothing unexpected reaches Mongoose.

const email = z.string().trim().toLowerCase().email("Enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long");

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email,
  password,
  country: z.string().trim().max(100).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

/** Answers arrive as { indicatorId: 'yes' | 'no' | 'unknown' }. */
const answersSchema = z
  .record(
    z.enum(QUESTION_IDS),
    z.enum([ANSWER.YES, ANSWER.NO, ANSWER.UNKNOWN])
  )
  .default({});

/** FR-02: platform name and website URL. The URL itself is validated by urlGuard. */
export const analysisSchema = z.object({
  platformName: z.string().trim().min(1, "Platform name is required").max(200),
  website: z.string().trim().min(1, "Website URL is required").max(2000),
  answers: answersSchema,
  model: z.enum(["v1", "v2"]).optional(),
});

/** The OSINT-only pre-step, so the UI can show technical facts while the user answers. */
export const osintOnlySchema = z.object({
  website: z.string().trim().min(1, "Website URL is required").max(2000),
});

/** FR-15: user report submission. */
export const reportSchema = z.object({
  platformName: z.string().trim().min(1, "Platform name is required").max(200),
  website: z.string().trim().max(2000).optional(),
  complaintType: z.enum(COMPLAINT_TYPES),
  description: z
    .string()
    .trim()
    .min(10, "Please describe what happened in at least 10 characters")
    .max(5000),
});

export const objectIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "reviewed", "rejected"]).optional(),
});

export const moderateReportSchema = z.object({
  status: z.enum(["reviewed", "rejected"]),
  moderatorNote: z.string().trim().max(1000).optional(),
});

export const watchlistCreateSchema = z.object({
  entityName: z.string().trim().min(1).max(200),
  aliases: z.array(z.string().trim().max(200)).max(20).default([]),
  domains: z.array(z.string().trim().max(255)).max(20).default([]),
  regulator: z.enum(["COSUMAF", "MINFI", "BEAC", "other"]),
  sourceUrl: z.string().trim().url("A citable source URL is required"),
  noticeDate: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});
