/**
 * Course Schema Validation Tests
 * REQ-FE-445: Zod Schema Enrichment
 */

import { describe, it, expect } from 'vitest';
import {
  CourseCategorySchema,
  CourseVisibilitySchema,
  CourseSortOptionSchema,
  CreateCourseSchema,
  UpdateCourseSchema,
  EnrollWithCodeSchema,
  CourseListParamsSchema,
} from './course.schema';

describe('CourseCategorySchema', () => {
  it('should accept valid category values', () => {
    expect(CourseCategorySchema.parse('programming')).toBe('programming');
    expect(CourseCategorySchema.parse('design')).toBe('design');
    expect(CourseCategorySchema.parse('business')).toBe('business');
    expect(CourseCategorySchema.parse('science')).toBe('science');
    expect(CourseCategorySchema.parse('language')).toBe('language');
    expect(CourseCategorySchema.parse('other')).toBe('other');
  });

  it('should reject invalid category values', () => {
    expect(() => CourseCategorySchema.parse('invalid')).toThrow();
    expect(() => CourseCategorySchema.parse('')).toThrow();
  });
});

describe('CourseVisibilitySchema', () => {
  it('should accept valid visibility values', () => {
    expect(CourseVisibilitySchema.parse('public')).toBe('public');
    expect(CourseVisibilitySchema.parse('invite_only')).toBe('invite_only');
  });

  it('should reject invalid visibility values', () => {
    expect(() => CourseVisibilitySchema.parse('private')).toThrow();
    expect(() => CourseVisibilitySchema.parse('')).toThrow();
  });
});

describe('CourseSortOptionSchema', () => {
  it('should accept valid sort option values', () => {
    expect(CourseSortOptionSchema.parse('recent')).toBe('recent');
    expect(CourseSortOptionSchema.parse('popular')).toBe('popular');
    expect(CourseSortOptionSchema.parse('alphabetical')).toBe('alphabetical');
  });

  it('should reject invalid sort option values', () => {
    expect(() => CourseSortOptionSchema.parse('newest')).toThrow();
    expect(() => CourseSortOptionSchema.parse('')).toThrow();
  });
});

describe('CreateCourseSchema', () => {
  it('should accept valid course creation data', () => {
    const result = CreateCourseSchema.parse({
      title: 'TypeScript Fundamentals',
      description: 'Learn TypeScript from scratch with practical examples',
      category: 'programming',
      visibility: 'public',
    });

    expect(result.title).toBe('TypeScript Fundamentals');
    expect(result.category).toBe('programming');
  });

  it('should accept course with thumbnail URL', () => {
    const result = CreateCourseSchema.parse({
      title: 'Design Course',
      description: 'Learn design fundamentals and principles',
      category: 'design',
      visibility: 'invite_only',
      thumbnailUrl: 'https://example.com/image.jpg',
    });

    expect(result.thumbnailUrl).toBe('https://example.com/image.jpg');
  });

  it('should reject title shorter than 3 characters', () => {
    expect(() =>
      CreateCourseSchema.parse({
        title: 'AB',
        description: 'A valid description here',
        category: 'programming',
        visibility: 'public',
      })
    ).toThrow(/Title must be at least 3 characters/);
  });

  it('should reject title longer than 100 characters', () => {
    expect(() =>
      CreateCourseSchema.parse({
        title: 'A'.repeat(101),
        description: 'A valid description here',
        category: 'programming',
        visibility: 'public',
      })
    ).toThrow();
  });

  it('should reject description shorter than 10 characters', () => {
    expect(() =>
      CreateCourseSchema.parse({
        title: 'Valid Title',
        description: 'Too short',
        category: 'programming',
        visibility: 'public',
      })
    ).toThrow(/Description must be at least 10 characters/);
  });

  it('should reject description longer than 2000 characters', () => {
    expect(() =>
      CreateCourseSchema.parse({
        title: 'Valid Title',
        description: 'A'.repeat(2001),
        category: 'programming',
        visibility: 'public',
      })
    ).toThrow();
  });

  it('should reject invalid thumbnail URL', () => {
    expect(() =>
      CreateCourseSchema.parse({
        title: 'Valid Title',
        description: 'Valid description here',
        category: 'programming',
        visibility: 'public',
        thumbnailUrl: 'not-a-url',
      })
    ).toThrow();
  });

  it('should accept empty string as thumbnail URL', () => {
    const result = CreateCourseSchema.parse({
      title: 'Valid Title',
      description: 'Valid description here',
      category: 'programming',
      visibility: 'public',
      thumbnailUrl: '',
    });

    expect(result.thumbnailUrl).toBe('');
  });

  it('should reject missing required fields', () => {
    expect(() =>
      CreateCourseSchema.parse({
        title: 'Valid Title',
        // missing description
        category: 'programming',
        visibility: 'public',
      })
    ).toThrow();
  });
});

describe('UpdateCourseSchema', () => {
  it('should accept partial update data', () => {
    const result = UpdateCourseSchema.parse({
      title: 'Updated Title',
    });

    expect(result.title).toBe('Updated Title');
    expect(result.description).toBeUndefined();
  });

  it('should accept status update', () => {
    const result = UpdateCourseSchema.parse({
      status: 'archived',
    });

    expect(result.status).toBe('archived');
  });

  it('should accept all status values', () => {
    expect(UpdateCourseSchema.parse({ status: 'draft' }).status).toBe('draft');
    expect(UpdateCourseSchema.parse({ status: 'published' }).status).toBe('published');
    expect(UpdateCourseSchema.parse({ status: 'archived' }).status).toBe('archived');
  });

  it('should accept empty object', () => {
    const result = UpdateCourseSchema.parse({});
    expect(result).toEqual({});
  });

  it('should validate title constraints when provided', () => {
    expect(() =>
      UpdateCourseSchema.parse({
        title: 'AB', // Too short
      })
    ).toThrow();
  });

  it('should validate description constraints when provided', () => {
    expect(() =>
      UpdateCourseSchema.parse({
        description: 'Too short', // 9 characters
      })
    ).toThrow();
  });
});

describe('EnrollWithCodeSchema', () => {
  it('should accept valid 6-character code', () => {
    const result = EnrollWithCodeSchema.parse({
      code: 'ABC123',
    });

    expect(result.code).toBe('ABC123');
  });

  it('should convert code to uppercase', () => {
    const result = EnrollWithCodeSchema.parse({
      code: 'abc123',
    });

    expect(result.code).toBe('ABC123');
  });

  it('should reject code shorter than 6 characters', () => {
    expect(() =>
      EnrollWithCodeSchema.parse({
        code: 'ABC12',
      })
    ).toThrow(/Invite code must be exactly 6 characters/);
  });

  it('should reject code longer than 6 characters', () => {
    expect(() =>
      EnrollWithCodeSchema.parse({
        code: 'ABC1234',
      })
    ).toThrow(/Invite code must be exactly 6 characters/);
  });

  it('should reject missing code', () => {
    expect(() =>
      EnrollWithCodeSchema.parse({})
    ).toThrow();
  });
});

describe('CourseListParamsSchema', () => {
  it('should accept valid list params', () => {
    const result = CourseListParamsSchema.parse({
      page: 1,
      limit: 20,
      search: 'typescript',
      category: 'programming',
      sort: 'recent',
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.search).toBe('typescript');
  });

  it('should apply default values', () => {
    const result = CourseListParamsSchema.parse({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should coerce string numbers to numbers', () => {
    const result = CourseListParamsSchema.parse({
      page: '2',
      limit: '10',
    });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it('should reject page less than 1', () => {
    expect(() =>
      CourseListParamsSchema.parse({
        page: 0,
      })
    ).toThrow();
  });

  it('should reject limit less than 1', () => {
    expect(() =>
      CourseListParamsSchema.parse({
        limit: 0,
      })
    ).toThrow();
  });

  it('should reject limit greater than 50', () => {
    expect(() =>
      CourseListParamsSchema.parse({
        limit: 51,
      })
    ).toThrow();
  });

  it('should accept limit of 50', () => {
    const result = CourseListParamsSchema.parse({
      limit: 50,
    });

    expect(result.limit).toBe(50);
  });

  it('should reject invalid category', () => {
    expect(() =>
      CourseListParamsSchema.parse({
        category: 'invalid-category',
      })
    ).toThrow();
  });

  it('should reject invalid sort option', () => {
    expect(() =>
      CourseListParamsSchema.parse({
        sort: 'invalid-sort',
      })
    ).toThrow();
  });
});
