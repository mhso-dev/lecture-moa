/**
 * Course Types Compilation Test
 * REQ-FE-444: Type Safety for Course Domain
 *
 * This test file verifies that all course types compile correctly
 * and can be used as expected.
 */

import { describe, it, expect } from 'vitest';
import type {
  CourseVisibility,
  CourseStatus,
  CourseCategory,
  CourseSortOption,
  CourseInstructor,
  CourseMaterialSummary,
  CourseSyllabusSection,
  CourseListItem,
  Course,
  CourseEnrollment,
  StudentProgress,
  CourseListParams,
  PaginatedCourseList,
  CreateCoursePayload,
  UpdateCoursePayload,
  InviteCodeResponse,
  EnrollWithCodePayload,
} from './course.types';

describe('Course Types', () => {
  describe('CourseVisibility', () => {
    it('should accept valid visibility values', () => {
      const publicVisibility: CourseVisibility = 'public';
      const inviteOnlyVisibility: CourseVisibility = 'invite_only';

      expect(publicVisibility).toBe('public');
      expect(inviteOnlyVisibility).toBe('invite_only');
    });
  });

  describe('CourseStatus', () => {
    it('should accept valid status values', () => {
      const draft: CourseStatus = 'draft';
      const published: CourseStatus = 'published';
      const archived: CourseStatus = 'archived';

      expect(draft).toBe('draft');
      expect(published).toBe('published');
      expect(archived).toBe('archived');
    });
  });

  describe('CourseCategory', () => {
    it('should accept valid category values', () => {
      const programming: CourseCategory = 'programming';
      const design: CourseCategory = 'design';
      const business: CourseCategory = 'business';
      const science: CourseCategory = 'science';
      const language: CourseCategory = 'language';
      const other: CourseCategory = 'other';

      expect(programming).toBe('programming');
      expect(design).toBe('design');
      expect(business).toBe('business');
      expect(science).toBe('science');
      expect(language).toBe('language');
      expect(other).toBe('other');
    });
  });

  describe('CourseSortOption', () => {
    it('should accept valid sort option values', () => {
      const recent: CourseSortOption = 'recent';
      const popular: CourseSortOption = 'popular';
      const alphabetical: CourseSortOption = 'alphabetical';

      expect(recent).toBe('recent');
      expect(popular).toBe('popular');
      expect(alphabetical).toBe('alphabetical');
    });
  });

  describe('CourseInstructor', () => {
    it('should accept valid instructor object', () => {
      const instructor: CourseInstructor = {
        id: 'inst-001',
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      expect(instructor.id).toBe('inst-001');
      expect(instructor.name).toBe('John Doe');
      expect(instructor.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should accept instructor without avatarUrl', () => {
      const instructor: CourseInstructor = {
        id: 'inst-002',
        name: 'Jane Smith',
      };

      expect(instructor.avatarUrl).toBeUndefined();
    });
  });

  describe('CourseMaterialSummary', () => {
    it('should accept valid material summary', () => {
      const material: CourseMaterialSummary = {
        id: 'mat-001',
        title: 'Introduction',
        type: 'markdown',
        order: 1,
      };

      expect(material.id).toBe('mat-001');
      expect(material.type).toBe('markdown');
    });

    it('should accept all material types', () => {
      const markdown: CourseMaterialSummary = {
        id: '1', title: 'M1', type: 'markdown', order: 1,
      };
      const video: CourseMaterialSummary = {
        id: '2', title: 'M2', type: 'video', order: 2,
      };
      const quiz: CourseMaterialSummary = {
        id: '3', title: 'M3', type: 'quiz', order: 3,
      };

      expect(markdown.type).toBe('markdown');
      expect(video.type).toBe('video');
      expect(quiz.type).toBe('quiz');
    });
  });

  describe('CourseSyllabusSection', () => {
    it('should accept valid syllabus section', () => {
      const section: CourseSyllabusSection = {
        id: 'sec-001',
        title: 'Week 1: Getting Started',
        order: 1,
        materials: [
          { id: 'mat-001', title: 'Intro', type: 'markdown', order: 1 },
          { id: 'mat-002', title: 'Video', type: 'video', order: 2 },
        ],
      };

      expect(section.materials).toHaveLength(2);
    });
  });

  describe('CourseListItem', () => {
    it('should accept valid course list item', () => {
      const courseItem: CourseListItem = {
        id: 'course-001',
        title: 'TypeScript Fundamentals',
        description: 'Learn TypeScript from scratch',
        category: 'programming',
        status: 'published',
        visibility: 'public',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        instructor: {
          id: 'inst-001',
          name: 'John Doe',
        },
        enrolledCount: 150,
        materialCount: 25,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-02-20T15:30:00Z',
      };

      expect(courseItem.id).toBe('course-001');
      expect(courseItem.category).toBe('programming');
      expect(courseItem.enrolledCount).toBe(150);
    });
  });

  describe('Course', () => {
    it('should extend CourseListItem with additional fields', () => {
      const course: Course = {
        id: 'course-001',
        title: 'TypeScript Fundamentals',
        description: 'Learn TypeScript from scratch',
        category: 'programming',
        status: 'published',
        visibility: 'public',
        instructor: { id: 'inst-001', name: 'John Doe' },
        enrolledCount: 150,
        materialCount: 25,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-02-20T15:30:00Z',
        syllabus: [
          {
            id: 'sec-001',
            title: 'Week 1',
            order: 1,
            materials: [],
          },
        ],
        inviteCode: 'ABC123',
      };

      expect(course.syllabus).toBeDefined();
      expect(course.inviteCode).toBe('ABC123');
    });

    it('should accept course without inviteCode', () => {
      const course: Course = {
        id: 'course-002',
        title: 'Design Basics',
        description: 'Learn design fundamentals',
        category: 'design',
        status: 'published',
        visibility: 'public',
        instructor: { id: 'inst-002', name: 'Jane Smith' },
        enrolledCount: 80,
        materialCount: 15,
        createdAt: '2024-02-01T10:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z',
        syllabus: [],
      };

      expect(course.inviteCode).toBeUndefined();
    });
  });

  describe('CourseEnrollment', () => {
    it('should accept valid enrollment record', () => {
      const enrollment: CourseEnrollment = {
        courseId: 'course-001',
        userId: 'user-001',
        enrolledAt: '2024-02-01T10:00:00Z',
        progressPercent: 45,
        completedMaterialIds: ['mat-001', 'mat-002', 'mat-003'],
      };

      expect(enrollment.progressPercent).toBe(45);
      expect(enrollment.completedMaterialIds).toHaveLength(3);
    });
  });

  describe('StudentProgress', () => {
    it('should accept valid student progress', () => {
      const progress: StudentProgress = {
        userId: 'user-001',
        name: 'Student Name',
        avatarUrl: 'https://example.com/avatar.jpg',
        enrolledAt: '2024-02-01T10:00:00Z',
        progressPercent: 75,
      };

      expect(progress.progressPercent).toBe(75);
    });
  });

  describe('CourseListParams', () => {
    it('should accept valid list params', () => {
      const params: CourseListParams = {
        page: 1,
        limit: 20,
        search: 'typescript',
        category: 'programming',
        sort: 'recent',
        status: 'published',
      };

      expect(params.page).toBe(1);
      expect(params.limit).toBe(20);
    });

    it('should accept empty params', () => {
      const params: CourseListParams = {};

      expect(params.page).toBeUndefined();
    });
  });

  describe('PaginatedCourseList', () => {
    it('should accept valid paginated response', () => {
      const paginatedList: PaginatedCourseList = {
        data: [
          {
            id: 'course-001',
            title: 'Course 1',
            description: 'Description',
            category: 'programming',
            status: 'published',
            visibility: 'public',
            instructor: { id: '1', name: 'Instructor' },
            enrolledCount: 10,
            materialCount: 5,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 100,
        page: 1,
        limit: 20,
      };

      expect(paginatedList.data).toHaveLength(1);
      expect(paginatedList.total).toBe(100);
    });
  });

  describe('CreateCoursePayload', () => {
    it('should accept valid creation payload', () => {
      const payload: CreateCoursePayload = {
        title: 'New Course',
        description: 'Course description',
        category: 'programming',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        visibility: 'public',
      };

      expect(payload.title).toBe('New Course');
    });
  });

  describe('UpdateCoursePayload', () => {
    it('should accept partial update payload', () => {
      const payload: UpdateCoursePayload = {
        title: 'Updated Title',
        status: 'archived',
      };

      expect(payload.title).toBe('Updated Title');
      expect(payload.status).toBe('archived');
    });
  });

  describe('InviteCodeResponse', () => {
    it('should accept valid invite code response', () => {
      const response: InviteCodeResponse = {
        code: 'ABC123',
        expiresAt: '2024-12-31T23:59:59Z',
      };

      expect(response.code).toBe('ABC123');
    });

    it('should accept response without expiresAt', () => {
      const response: InviteCodeResponse = {
        code: 'XYZ789',
      };

      expect(response.expiresAt).toBeUndefined();
    });
  });

  describe('EnrollWithCodePayload', () => {
    it('should accept valid enroll payload', () => {
      const payload: EnrollWithCodePayload = {
        code: 'ABC123',
      };

      expect(payload.code).toBe('ABC123');
    });
  });
});
