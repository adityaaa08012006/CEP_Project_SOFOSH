import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
});

export const scheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  max_capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  is_active: z.boolean().optional().default(true),
});

export const appointmentSchema = z.object({
  schedule_id: z.string().uuid('Invalid schedule ID'),
  num_visitors: z.number().int().min(1, 'At least 1 visitor required'),
  purpose: z.string().optional(),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  admin_notes: z.string().optional(),
});

export const donationCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional().default(''),
});

export const donationItemSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  name: z.string().min(1, 'Item name is required'),
  unit: z.string().min(1, 'Unit is required'),
  required_qty: z.number().min(0, 'Quantity must be non-negative'),
  is_active: z.boolean().optional().default(true),
});

export const donationSchema = z.object({
  item_id: z.string().uuid('Invalid item ID'),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  notes: z.string().optional().default(''),
});

export const bulkDonationItemsSchema = z.object({
  batch_title: z.string().min(1, 'Batch title is required'),
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().min(0),
    unit: z.string().min(1),
    category: z.string().min(1),
  })).min(1, 'At least one item is required'),
});

export const inventoryUpdateSchema = z.object({
  quantity_on_hand: z.number().min(0, 'Quantity must be non-negative'),
});
