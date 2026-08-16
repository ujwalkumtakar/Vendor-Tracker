import { z } from 'zod';

// The shape of a valid vendor when creating one
export const CreateVendorSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must be 50 characters or fewer'),
  contactEmail: z
    .string()
    .email('contactEmail must be a valid email address'),
});

// The shape of a valid delete request
export const DeleteVendorSchema = z.object({
  vendorId: z
    .string()
    .uuid('vendorId must be a valid UUID'),
});

// The shape of a valid update request
export const UpdateVendorSchema = z.object({
  vendorId: z
    .string()
    .uuid('vendorId must be a valid UUID'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer')
    .optional(),
  category: z
    .string()
    .max(50, 'Category must be 50 characters or fewer')
    .optional(),
  contactEmail: z
    .string()
    .email('contactEmail must be a valid email address')
    .optional(),
}).refine(
  data => data.name || data.category || data.contactEmail,
  { message: 'At least one field to update must be provided' }
);

// A helper type you can use in your frontend and Lambda code
export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;
