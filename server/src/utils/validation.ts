import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(30, 'Username must be less than 30 characters.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores.'),
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const updateProfileSchema = z.object({
  bio: z.string().max(160, 'Bio must not exceed 160 characters.').optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
});
