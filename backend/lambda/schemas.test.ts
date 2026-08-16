import { CreateVendorSchema, DeleteVendorSchema, UpdateVendorSchema } from './schemas';

describe('CreateVendorSchema', () => {
  it('accepts a valid vendor', () => {
    const result = CreateVendorSchema.safeParse({
      name: 'Acme Corp',
      category: 'SaaS',
      contactEmail: 'contact@acme.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing name', () => {
    const result = CreateVendorSchema.safeParse({
      category: 'SaaS',
      contactEmail: 'contact@acme.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = CreateVendorSchema.safeParse({
      name: 'Acme Corp',
      category: 'SaaS',
      contactEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.contactEmail).toBeDefined();
    }
  });

  it('rejects a name that is too long', () => {
    const result = CreateVendorSchema.safeParse({
      name: 'A'.repeat(101),
      category: 'SaaS',
      contactEmail: 'contact@acme.com',
    });
    expect(result.success).toBe(false);
  });
});

describe('DeleteVendorSchema', () => {
  it('accepts a valid UUID', () => {
    const result = DeleteVendorSchema.safeParse({
      vendorId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID vendorId', () => {
    const result = DeleteVendorSchema.safeParse({
      vendorId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateVendorSchema', () => {
  it('accepts a partial update with at least one field', () => {
    const result = UpdateVendorSchema.safeParse({
      vendorId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an update with no fields to change', () => {
    const result = UpdateVendorSchema.safeParse({
      vendorId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(false);
  });
});
