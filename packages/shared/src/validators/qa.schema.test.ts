/**
 * Q&A Zod Validation Schemas Tests
 * TASK-002: TDD implementation for REQ-FE-501
 */

import { describe, it, expect } from 'vitest';
import type { ZodError } from 'zod';
import {
  CreateQuestionSchema,
  CreateAnswerSchema,
  QAListFilterSchema,
} from './qa.schema';

/**
 * Helper to get first error message from ZodError
 */
function getFirstErrorMessage(error: ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) {
    throw new Error('No issues found in ZodError');
  }
  return firstIssue.message;
}

describe('CreateQuestionSchema', () => {
  describe('valid cases', () => {
    it('should accept valid question data', () => {
      const validData = {
        title: 'This is a valid question title',
        content: 'This is valid question content with enough characters.',
        courseId: 'course-123',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: 'heading-1',
          selectedText: 'Some selected text from the material',
        },
      };

      const result = CreateQuestionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept null headingId', () => {
      const validData = {
        title: 'This is a valid question title',
        content: 'This is valid question content with enough characters.',
        courseId: 'course-123',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: null,
          selectedText: 'Some selected text from the material',
        },
      };

      const result = CreateQuestionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('title validation', () => {
    it('should reject title shorter than 10 characters', () => {
      const invalidData = {
        title: 'Too short',
        content: 'Valid content here',
        courseId: 'course-123',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: null,
          selectedText: 'Selected text',
        },
      };

      const result = CreateQuestionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result.error)).toBe(
          '제목은 최소 10자 이상이어야 합니다'
        );
      }
    });

    it('should reject title longer than 200 characters', () => {
      const invalidData = {
        title: 'a'.repeat(201),
        content: 'Valid content here',
        courseId: 'course-123',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: null,
          selectedText: 'Selected text',
        },
      };

      const result = CreateQuestionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result.error)).toBe(
          '제목은 최대 200자까지 입력 가능합니다'
        );
      }
    });

    it('should accept title with exactly 10 characters', () => {
      const validData = {
        title: '1234567890', // exactly 10 characters
        content: 'Valid content here with enough length',
        courseId: 'course-123',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: null,
          selectedText: 'Selected text',
        },
      };

      const result = CreateQuestionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept title with exactly 200 characters', () => {
      const validData = {
        title: 'a'.repeat(200), // exactly 200 characters
        content: 'Valid content here with enough length',
        courseId: 'course-123',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: null,
          selectedText: 'Selected text',
        },
      };

      const result = CreateQuestionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('content validation', () => {
    it('should reject content shorter than 20 characters', () => {
      const invalidData = {
        title: 'Valid title here',
        content: 'Too short content',
        courseId: 'course-123',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: null,
          selectedText: 'Selected text',
        },
      };

      const result = CreateQuestionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result.error)).toBe(
          '내용은 최소 20자 이상이어야 합니다'
        );
      }
    });

    it('should accept content with exactly 20 characters', () => {
      const validData = {
        title: 'Valid title here',
        content: '12345678901234567890', // exactly 20 characters
        courseId: 'course-123',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: null,
          selectedText: 'Selected text',
        },
      };

      const result = CreateQuestionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('courseId and materialId validation', () => {
    it('should reject empty courseId', () => {
      const invalidData = {
        title: 'Valid title here',
        content: 'Valid content here with enough length',
        courseId: '',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: null,
          selectedText: 'Selected text',
        },
      };

      const result = CreateQuestionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.find((i) => i.path[0] === 'courseId')?.message
        ).toBe('강좌를 선택해주세요');
      }
    });

    it('should reject empty materialId', () => {
      const invalidData = {
        title: 'Valid title here',
        content: 'Valid content here',
        courseId: 'course-123',
        materialId: '',
        context: {
          materialId: '',
          headingId: null,
          selectedText: 'Selected text',
        },
      };

      const result = CreateQuestionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.find((i) => i.path[0] === 'materialId')?.message
        ).toBe('자료를 선택해주세요');
      }
    });
  });

  describe('context.selectedText validation', () => {
    it('should reject empty selectedText', () => {
      const invalidData = {
        title: 'Valid title here',
        content: 'Valid content here',
        courseId: 'course-123',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: null,
          selectedText: '',
        },
      };

      const result = CreateQuestionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.find((i) => i.path.includes('selectedText'))
            ?.message
        ).toBe('선택된 텍스트가 필요합니다');
      }
    });

    it('should reject selectedText longer than 500 characters', () => {
      const invalidData = {
        title: 'Valid title here',
        content: 'Valid content here',
        courseId: 'course-123',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: null,
          selectedText: 'a'.repeat(501),
        },
      };

      const result = CreateQuestionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.find((i) => i.path.includes('selectedText'))
            ?.message
        ).toBe('선택된 텍스트는 최대 500자까지 가능합니다');
      }
    });

    it('should accept selectedText with exactly 500 characters', () => {
      const validData = {
        title: 'Valid title here',
        content: 'Valid content here with enough length',
        courseId: 'course-123',
        materialId: 'material-456',
        context: {
          materialId: 'material-456',
          headingId: null,
          selectedText: 'a'.repeat(500),
        },
      };

      const result = CreateQuestionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('CreateAnswerSchema', () => {
  describe('valid cases', () => {
    it('should accept valid answer content', () => {
      const validData = {
        content: 'This is a valid answer with enough characters.',
      };

      const result = CreateAnswerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('content validation', () => {
    it('should reject content shorter than 10 characters', () => {
      const invalidData = {
        content: 'Too short',
      };

      const result = CreateAnswerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstErrorMessage(result.error)).toBe(
          '답변 내용은 최소 10자 이상이어야 합니다'
        );
      }
    });

    it('should accept content with exactly 10 characters', () => {
      const validData = {
        content: '1234567890', // exactly 10 characters
      };

      const result = CreateAnswerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('QAListFilterSchema', () => {
  describe('default values', () => {
    it('should apply default values for page and limit', () => {
      const result = QAListFilterSchema.parse({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply default values when only some fields are provided', () => {
      const result = QAListFilterSchema.parse({
        courseId: 'course-123',
      });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.courseId).toBe('course-123');
    });
  });

  describe('valid cases', () => {
    it('should accept valid filter with all fields', () => {
      const validData = {
        courseId: 'course-123',
        materialId: 'material-456',
        status: 'OPEN' as const,
        q: 'search query',
        sort: 'newest' as const,
        page: 2,
        limit: 50,
      };

      const result = QAListFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should accept all valid status values', () => {
      const statuses = ['ALL', 'OPEN', 'RESOLVED', 'CLOSED'] as const;

      statuses.forEach((status) => {
        const result = QAListFilterSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid sort values', () => {
      const sortOptions = [
        'newest',
        'upvotes',
        'answers',
        'unanswered',
      ] as const;

      sortOptions.forEach((sort) => {
        const result = QAListFilterSchema.safeParse({ sort });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('page validation', () => {
    it('should coerce string page to number', () => {
      const result = QAListFilterSchema.parse({ page: '3' });
      expect(result.page).toBe(3);
      expect(typeof result.page).toBe('number');
    });

    it('should reject page less than 1', () => {
      const result = QAListFilterSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject negative page', () => {
      const result = QAListFilterSchema.safeParse({ page: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('limit validation', () => {
    it('should coerce string limit to number', () => {
      const result = QAListFilterSchema.parse({ limit: '30' });
      expect(result.limit).toBe(30);
      expect(typeof result.limit).toBe('number');
    });

    it('should reject limit less than 1', () => {
      const result = QAListFilterSchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const result = QAListFilterSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept limit of 100', () => {
      const result = QAListFilterSchema.safeParse({ limit: 100 });
      expect(result.success).toBe(true);
    });
  });

  describe('status validation', () => {
    it('should reject invalid status value', () => {
      const result = QAListFilterSchema.safeParse({ status: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });

  describe('sort validation', () => {
    it('should reject invalid sort value', () => {
      const result = QAListFilterSchema.safeParse({ sort: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
