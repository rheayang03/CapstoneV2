import { z } from 'zod';
import { ISODateTime } from './utils';
import { RoleValue } from './role';

export const UserStatus = z.enum(['active', 'deactivated', 'pending']);

export const UserSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional().default(''),
    role: RoleValue,
    status: UserStatus,
    permissions: z.array(z.string()).optional().default([]),
    createdAt: ISODateTime,
    // Accept null/empty string from API, otherwise validate ISO date
    lastLogin: z.preprocess(
      (v) => (v == null || v === '' ? null : v),
      ISODateTime.nullable()
    ),
  })
  .passthrough();

export const UserCreateSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    role: RoleValue.default('staff'),
    phone: z.string().optional(),
    password: z.string().min(8).optional(),
  })
  .strict();

export const UserUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: RoleValue.optional(),
    status: UserStatus.optional(),
    password: z.string().min(8).optional(),
  })
  .strict();
