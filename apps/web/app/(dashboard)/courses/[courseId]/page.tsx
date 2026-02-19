/**
 * Course Detail Page
 * TASK-030: Course Detail Page
 *
 * REQ-FE-410 to REQ-FE-418: Course detail with syllabus, enrollment, and roster
 */

"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import { useSession } from "next-auth/react";
import { Calendar, Users, FileText, Settings, BookOpen } from "lucide-react";
import { useCourse } from "~/hooks/useCourse";
import { useCourseProgress } from "~/hooks/useCourseProgress";
import {
  CourseSyllabus,
  CourseEnrollButton,
  CourseStudentRoster,
} from "~/components/course";
import { Button } from "~/components/ui/button";
import { CourseProgressBar } from "~/components/course/CourseProgressBar";
import type { Course, CourseEnrollment } from "@shared";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const courseId = params.courseId as string;

  // Fetch course data
  const { data: course, isLoading, error } = useCourse(courseId);

  // Fetch enrollment progress (for students)
  const { data: enrollment } = useCourseProgress(courseId);

  // Role checks
  const isInstructor = session?.user.role === "instructor";
  const isOwner = isInstructor && course?.instructor.id === session.user.id;
  const isEnrolled = !!enrollment;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-body text-neutral-500">Loading course...</p>
      </div>
    );
  }

  // Error state - handle 404
  if (error || !course) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <CourseHeader course={course} />

      {/* Enrollment Status (for students) */}
      {!isInstructor && (
        <EnrollmentStatus
          isEnrolled={isEnrolled}
          enrollment={enrollment}
          course={course}
        />
      )}

      {/* Instructor Quick Actions */}
      {isOwner && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { router.push(`/courses/${courseId}/settings`); }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Course Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => { router.push(`/courses/${courseId}/materials`); }}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Manage Materials
          </Button>
        </div>
      )}

      {/* Course Metadata */}
      <CourseMetadata course={course} />

      {/* Course Description */}
      <div>
        <h2 className="text-h3 mb-3 font-semibold text-foreground">
          About This Course
        </h2>
        <p className="text-body text-neutral-700 dark:text-neutral-300">
          {course.description}
        </p>
      </div>

      {/* Syllabus */}
      <div>
        <h2 className="text-h3 mb-3 font-semibold text-foreground">
          Course Syllabus
        </h2>
        <CourseSyllabus syllabus={course.syllabus} />
      </div>

      {/* Student Roster (instructor only) */}
      {isOwner && <CourseStudentRoster courseId={courseId} />}
    </div>
  );
}

// Component parts

interface CourseHeaderProps {
  course: Course;
}

function CourseHeader({ course }: CourseHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Thumbnail */}
      {course.thumbnailUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Title and Instructor */}
      <div>
        <h1 className="text-h1 font-bold text-foreground">{course.title}</h1>
        <p className="mt-2 text-body text-neutral-500">
          by {course.instructor.name}
        </p>
      </div>
    </div>
  );
}

interface EnrollmentStatusProps {
  isEnrolled: boolean;
  enrollment?: CourseEnrollment;
  course: Course;
}

function EnrollmentStatus({ isEnrolled, enrollment, course }: EnrollmentStatusProps) {
  if (isEnrolled && enrollment) {
    return (
      <div className="rounded-lg border border-border bg-card-background p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Your Progress</h3>
          <span className="text-body-sm text-neutral-500">
            {enrollment.progressPercent}% complete
          </span>
        </div>
        <CourseProgressBar percent={enrollment.progressPercent} />
      </div>
    );
  }

  // Not enrolled - show enrollment options
  return (
    <div className="rounded-lg border border-border bg-card-background p-6">
      <CourseEnrollButton
        courseId={course.id}
        visibility={course.visibility}
        isEnrolled={false}
      />
    </div>
  );
}

interface CourseMetadataProps {
  course: Course;
}

function CourseMetadata({ course }: CourseMetadataProps) {
  const metadata = [
    {
      icon: Users,
      label: "Students Enrolled",
      value: course.enrolledCount,
    },
    {
      icon: FileText,
      label: "Materials",
      value: course.materialCount,
    },
    {
      icon: Calendar,
      label: "Created",
      value: new Date(course.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {metadata.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border bg-card-background p-4"
        >
          <div className="flex items-center gap-2">
            <item.icon className="h-5 w-5 text-primary" />
            <span className="text-body-sm text-neutral-500">{item.label}</span>
          </div>
          <p className="mt-2 text-h4 font-semibold text-foreground">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
