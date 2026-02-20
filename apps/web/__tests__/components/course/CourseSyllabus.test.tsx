/**
 * CourseSyllabus Component Tests
 * TASK-024: Ordered sections with materials, collapsible sections
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseSyllabus } from '../../../components/course/CourseSyllabus';
import type { CourseSyllabusSection } from '@shared';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockSyllabus: CourseSyllabusSection[] = [
  {
    id: 'section-1',
    title: 'Introduction',
    order: 1,
    materials: [
      { id: 'mat-1', title: 'Welcome Video', type: 'video', order: 1 },
      { id: 'mat-2', title: 'Course Overview', type: 'markdown', order: 2 },
    ],
  },
  {
    id: 'section-2',
    title: 'Getting Started',
    order: 2,
    materials: [
      { id: 'mat-3', title: 'Setup Guide', type: 'markdown', order: 1 },
      { id: 'mat-4', title: 'Quiz 1', type: 'quiz', order: 2 },
    ],
  },
  {
    id: 'section-3',
    title: 'Advanced Topics',
    order: 3,
    materials: [
      { id: 'mat-5', title: 'Deep Dive', type: 'video', order: 1 },
    ],
  },
];

describe('CourseSyllabus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Section Rendering', () => {
    it('should render all sections', () => {
      render(<CourseSyllabus syllabus={mockSyllabus} />);

      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Advanced Topics')).toBeInTheDocument();
    });

    it('should render sections in order', () => {
      render(<CourseSyllabus syllabus={mockSyllabus} />);

      const sections = screen.getAllByTestId(/syllabus-section/);
      expect(sections[0]).toHaveTextContent('Introduction');
      expect(sections[1]).toHaveTextContent('Getting Started');
      expect(sections[2]).toHaveTextContent('Advanced Topics');
    });

    it('should show section numbers', () => {
      render(<CourseSyllabus syllabus={mockSyllabus} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Material Rendering', () => {
    it('should render all materials in each section', () => {
      render(<CourseSyllabus syllabus={mockSyllabus} />);

      expect(screen.getByText('Welcome Video')).toBeInTheDocument();
      expect(screen.getByText('Course Overview')).toBeInTheDocument();
      expect(screen.getByText('Setup Guide')).toBeInTheDocument();
      expect(screen.getByText('Quiz 1')).toBeInTheDocument();
      expect(screen.getByText('Deep Dive')).toBeInTheDocument();
    });

    it('should show material type indicators', () => {
      render(<CourseSyllabus syllabus={mockSyllabus} />);

      const videoIcons = screen.getAllByTestId('material-icon-video');
      const markdownIcons = screen.getAllByTestId('material-icon-markdown');
      const quizIcons = screen.getAllByTestId('material-icon-quiz');

      expect(videoIcons.length).toBe(2);
      expect(markdownIcons.length).toBe(2);
      expect(quizIcons.length).toBe(1);
    });
  });

  describe('Collapsible Sections', () => {
    it('should render sections as collapsible', () => {
      render(<CourseSyllabus syllabus={mockSyllabus} />);

      const triggers = screen.getAllByRole('button', { name: /toggle section/i });
      expect(triggers.length).toBe(3);
    });

    it('should collapse/expand sections when clicked', () => {
      render(<CourseSyllabus syllabus={mockSyllabus} />);

      // First section should be expanded by default
      expect(screen.getByText('Welcome Video')).toBeInTheDocument();

      // Click to collapse
      const triggers = screen.getAllByRole('button', { name: /toggle section/i });
      const firstTrigger = triggers[0];
      if (firstTrigger) {
        fireEvent.click(firstTrigger);
      }

      // After collapse, the content may be removed from DOM or hidden
      // Check that clicking toggles the state (aria-expanded changes)
      expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('should show expand/collapse icon', () => {
      render(<CourseSyllabus syllabus={mockSyllabus} />);

      const chevronIcons = screen.getAllByTestId('chevron-icon');
      expect(chevronIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Completion Status', () => {
    it('should show completion checkmark for completed materials', () => {
      const completedIds = ['mat-1', 'mat-2'];
      render(<CourseSyllabus syllabus={mockSyllabus} completedMaterialIds={completedIds} />);

      const checkmarks = screen.getAllByTestId('completion-checkmark');
      expect(checkmarks.length).toBe(2);
    });

    it('should not show checkmark for incomplete materials', () => {
      const completedIds = ['mat-1'];
      render(<CourseSyllabus syllabus={mockSyllabus} completedMaterialIds={completedIds} />);

      const checkmarks = screen.getAllByTestId('completion-checkmark');
      expect(checkmarks.length).toBe(1);
    });
  });

  describe('Empty State', () => {
    it('should show message when syllabus is empty', () => {
      render(<CourseSyllabus syllabus={[]} />);

      expect(screen.getByText(/no syllabus available/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes for accordion', () => {
      render(<CourseSyllabus syllabus={mockSyllabus} />);

      const triggers = screen.getAllByRole('button');
      triggers.forEach((trigger) => {
        expect(trigger).toHaveAttribute('aria-expanded');
      });
    });

    it('should be keyboard navigable', () => {
      render(<CourseSyllabus syllabus={mockSyllabus} />);

      const triggers = screen.getAllByRole('button', { name: /toggle section/i });
      const firstTrigger = triggers[0];
      firstTrigger?.focus();

      // Should be focusable
      expect(document.activeElement).toBe(firstTrigger);

      // Enter/Space should toggle
      if (firstTrigger) {
        fireEvent.keyDown(firstTrigger, { key: 'Enter' });
      }
    });
  });
});
