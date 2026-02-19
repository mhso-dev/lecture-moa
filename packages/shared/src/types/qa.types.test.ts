/**
 * Q&A Types Compilation Test
 * REQ-FE-500: Type Safety for Q&A Domain
 *
 * This test file verifies that all Q&A types compile correctly
 * and can be used as expected.
 */

import { describe, it, expect } from 'vitest';
import type {
  QAStatus,
  QAQuestionContext,
  QAAuthorInfo,
  QAQuestion,
  QAListItem,
  QAAnswer,
  QACreateRequest,
  QAAnswerRequest,
  QAListFilter,
  QAWebSocketNotification,
} from './qa.types';

describe('Q&A Types', () => {
  describe('QAStatus', () => {
    it('should accept OPEN status', () => {
      const status: QAStatus = 'OPEN';
      expect(status).toBe('OPEN');
    });

    it('should accept RESOLVED status', () => {
      const status: QAStatus = 'RESOLVED';
      expect(status).toBe('RESOLVED');
    });

    it('should accept CLOSED status', () => {
      const status: QAStatus = 'CLOSED';
      expect(status).toBe('CLOSED');
    });
  });

  describe('QAQuestionContext', () => {
    it('should accept valid context with headingId', () => {
      const context: QAQuestionContext = {
        materialId: 'mat-001',
        headingId: 'heading-001',
        selectedText: 'This is the selected text from the material.',
      };

      expect(context.materialId).toBe('mat-001');
      expect(context.headingId).toBe('heading-001');
      expect(context.selectedText).toBe('This is the selected text from the material.');
    });

    it('should accept context with null headingId', () => {
      const context: QAQuestionContext = {
        materialId: 'mat-001',
        headingId: null,
        selectedText: 'Selected text without heading context.',
      };

      expect(context.headingId).toBeNull();
    });

    it('should accept maximum length selectedText (500 chars)', () => {
      const longText = 'a'.repeat(500);
      const context: QAQuestionContext = {
        materialId: 'mat-001',
        headingId: null,
        selectedText: longText,
      };

      expect(context.selectedText).toHaveLength(500);
    });
  });

  describe('QAAuthorInfo', () => {
    it('should accept valid author info with avatar', () => {
      const author: QAAuthorInfo = {
        id: 'user-001',
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'student',
      };

      expect(author.id).toBe('user-001');
      expect(author.name).toBe('John Doe');
      expect(author.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(author.role).toBe('student');
    });

    it('should accept author info without avatar', () => {
      const author: QAAuthorInfo = {
        id: 'user-002',
        name: 'Jane Smith',
        avatarUrl: null,
        role: 'instructor',
      };

      expect(author.avatarUrl).toBeNull();
    });

    it('should accept all user roles', () => {
      const student: QAAuthorInfo = {
        id: '1', name: 'Student', avatarUrl: null, role: 'student',
      };
      const instructor: QAAuthorInfo = {
        id: '2', name: 'Instructor', avatarUrl: null, role: 'instructor',
      };
      const admin: QAAuthorInfo = {
        id: '3', name: 'Admin', avatarUrl: null, role: 'admin',
      };

      expect(student.role).toBe('student');
      expect(instructor.role).toBe('instructor');
      expect(admin.role).toBe('admin');
    });
  });

  describe('QAQuestion', () => {
    it('should accept valid question with all fields', () => {
      const question: QAQuestion = {
        id: 'q-001',
        courseId: 'course-001',
        courseName: 'TypeScript Fundamentals',
        materialId: 'mat-001',
        materialTitle: 'Introduction to TypeScript',
        authorId: 'user-001',
        author: {
          id: 'user-001',
          name: 'John Doe',
          avatarUrl: null,
          role: 'student',
        },
        title: 'How do generics work in TypeScript?',
        content: 'I am confused about generics. Can someone explain with examples?',
        context: {
          materialId: 'mat-001',
          headingId: 'heading-001',
          selectedText: 'Generics allow you to write flexible code.',
        },
        status: 'OPEN',
        upvoteCount: 5,
        isUpvoted: false,
        answerCount: 2,
        aiSuggestion: null,
        aiSuggestionPending: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      expect(question.id).toBe('q-001');
      expect(question.status).toBe('OPEN');
      expect(question.context.headingId).toBe('heading-001');
      expect(question.aiSuggestionPending).toBe(true);
    });

    it('should accept question with AI suggestion', () => {
      const question: QAQuestion = {
        id: 'q-002',
        courseId: 'course-001',
        courseName: 'Course Name',
        materialId: 'mat-001',
        materialTitle: 'Material Title',
        authorId: 'user-001',
        author: { id: 'user-001', name: 'Author', avatarUrl: null, role: 'student' },
        title: 'Question Title',
        content: 'Question content in markdown',
        context: { materialId: 'mat-001', headingId: null, selectedText: 'text' },
        status: 'OPEN',
        upvoteCount: 0,
        isUpvoted: false,
        answerCount: 1,
        aiSuggestion: {
          id: 'ans-ai-001',
          questionId: 'q-002',
          authorId: 'ai-system',
          author: { id: 'ai-system', name: 'AI Assistant', avatarUrl: null, role: 'instructor' },
          content: 'AI generated answer',
          isAccepted: false,
          isAiGenerated: true,
          upvoteCount: 3,
          isUpvoted: false,
          createdAt: '2024-01-15T11:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z',
        },
        aiSuggestionPending: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
      };

      expect(question.aiSuggestion).not.toBeNull();
      expect(question.aiSuggestion?.isAiGenerated).toBe(true);
    });
  });

  describe('QAListItem', () => {
    it('should accept valid list item', () => {
      const item: QAListItem = {
        id: 'q-001',
        courseId: 'course-001',
        courseName: 'Course Name',
        materialId: 'mat-001',
        materialTitle: 'Material Title',
        author: { id: 'user-001', name: 'Author', avatarUrl: null, role: 'student' },
        title: 'Question Title',
        context: { selectedText: 'Selected text snippet' },
        status: 'OPEN',
        upvoteCount: 10,
        answerCount: 3,
        hasAiSuggestion: true,
        createdAt: '2024-01-15T10:00:00Z',
      };

      expect(item.id).toBe('q-001');
      expect(item.context.selectedText).toBe('Selected text snippet');
      expect(item.hasAiSuggestion).toBe(true);
    });
  });

  describe('QAAnswer', () => {
    it('should accept human-generated answer', () => {
      const answer: QAAnswer = {
        id: 'ans-001',
        questionId: 'q-001',
        authorId: 'user-002',
        author: {
          id: 'user-002',
          name: 'Instructor Name',
          avatarUrl: 'https://example.com/avatar.jpg',
          role: 'instructor',
        },
        content: 'Here is my explanation...',
        isAccepted: true,
        isAiGenerated: false,
        upvoteCount: 15,
        isUpvoted: true,
        createdAt: '2024-01-15T12:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
      };

      expect(answer.isAiGenerated).toBe(false);
      expect(answer.isAccepted).toBe(true);
      expect(answer.isUpvoted).toBe(true);
    });

    it('should accept AI-generated answer', () => {
      const answer: QAAnswer = {
        id: 'ans-ai-001',
        questionId: 'q-001',
        authorId: 'ai-system',
        author: {
          id: 'ai-system',
          name: 'AI Assistant',
          avatarUrl: null,
          role: 'instructor',
        },
        content: 'Based on the course material...',
        isAccepted: false,
        isAiGenerated: true,
        upvoteCount: 5,
        isUpvoted: false,
        createdAt: '2024-01-15T11:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
      };

      expect(answer.isAiGenerated).toBe(true);
    });
  });

  describe('QACreateRequest', () => {
    it('should accept valid create request', () => {
      const request: QACreateRequest = {
        courseId: 'course-001',
        materialId: 'mat-001',
        title: 'How do I use useEffect?',
        content: 'I am confused about the dependency array.',
        context: {
          materialId: 'mat-001',
          headingId: 'heading-005',
          selectedText: 'useEffect hook in React',
        },
      };

      expect(request.courseId).toBe('course-001');
      expect(request.context.headingId).toBe('heading-005');
    });
  });

  describe('QAAnswerRequest', () => {
    it('should accept valid answer request', () => {
      const request: QAAnswerRequest = {
        content: 'Here is my answer to the question...',
      };

      expect(request.content).toBe('Here is my answer to the question...');
    });
  });

  describe('QAListFilter', () => {
    it('should accept valid filter with all options', () => {
      const filter: QAListFilter = {
        courseId: 'course-001',
        materialId: 'mat-001',
        status: 'OPEN',
        q: 'generics',
        sort: 'newest',
        page: 1,
        limit: 20,
      };

      expect(filter.page).toBe(1);
      expect(filter.limit).toBe(20);
      expect(filter.sort).toBe('newest');
    });

    it('should accept status ALL', () => {
      const filter: QAListFilter = {
        status: 'ALL',
        page: 1,
        limit: 10,
      };

      expect(filter.status).toBe('ALL');
    });

    it('should accept all sort options', () => {
      const newest: QAListFilter = { sort: 'newest', page: 1, limit: 10 };
      const upvotes: QAListFilter = { sort: 'upvotes', page: 1, limit: 10 };
      const answers: QAListFilter = { sort: 'answers', page: 1, limit: 10 };
      const unanswered: QAListFilter = { sort: 'unanswered', page: 1, limit: 10 };

      expect(newest.sort).toBe('newest');
      expect(upvotes.sort).toBe('upvotes');
      expect(answers.sort).toBe('answers');
      expect(unanswered.sort).toBe('unanswered');
    });

    it('should accept minimal filter', () => {
      const filter: QAListFilter = {
        page: 1,
        limit: 20,
      };

      expect(filter.courseId).toBeUndefined();
      expect(filter.materialId).toBeUndefined();
    });
  });

  describe('QAWebSocketNotification', () => {
    it('should accept NEW_ANSWER notification', () => {
      const notification: QAWebSocketNotification = {
        id: 'notif-001',
        type: 'NEW_ANSWER',
        questionId: 'q-001',
        questionTitle: 'How do generics work?',
        actorName: 'Jane Smith',
        receivedAt: '2024-01-15T12:00:00Z',
      };

      expect(notification.type).toBe('NEW_ANSWER');
      expect(notification.actorName).toBe('Jane Smith');
    });

    it('should accept AI_SUGGESTION_READY notification', () => {
      const notification: QAWebSocketNotification = {
        id: 'notif-002',
        type: 'AI_SUGGESTION_READY',
        questionId: 'q-001',
        questionTitle: 'How do generics work?',
        receivedAt: '2024-01-15T12:30:00Z',
      };

      expect(notification.type).toBe('AI_SUGGESTION_READY');
      expect(notification.actorName).toBeUndefined();
    });

    it('should accept QUESTION_RESOLVED notification', () => {
      const notification: QAWebSocketNotification = {
        id: 'notif-003',
        type: 'QUESTION_RESOLVED',
        questionId: 'q-001',
        questionTitle: 'How do generics work?',
        actorName: 'John Doe',
        receivedAt: '2024-01-15T13:00:00Z',
      };

      expect(notification.type).toBe('QUESTION_RESOLVED');
    });
  });

  describe('QAWebSocketNotification type safety', () => {
    it('should enforce valid notification types', () => {
      const validTypes: QAWebSocketNotification['type'][] = [
        'NEW_ANSWER',
        'AI_SUGGESTION_READY',
        'QUESTION_RESOLVED',
      ];

      expect(validTypes).toHaveLength(3);
    });
  });
});
