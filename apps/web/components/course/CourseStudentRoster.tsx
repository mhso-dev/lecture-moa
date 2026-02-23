/**
 * CourseStudentRoster Component
 * TASK-028: Student list with progress and remove button
 *
 * REQ-FE-416: Student Roster (Instructor View)
 * REQ-FE-435: Remove Student
 */

"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useCourseStudents } from "~/hooks/useCourseStudents";
import { useRemoveStudent } from "~/hooks/useRemoveStudent";
import { toast } from "sonner";
import { CourseProgressBar } from "./CourseProgressBar";
import type { StudentProgress } from "@shared";

interface CourseStudentRosterProps {
  courseId: string;
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * StudentRow - Individual student row with actions
 */
function StudentRow({
  student,
  onRemove,
}: {
  student: StudentProgress;
  onRemove: () => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={student.avatarUrl} alt={student.name} />
            <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{student.name}</span>
        </div>
      </TableCell>
      <TableCell>
        {new Date(student.enrolledAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="w-32">
          <CourseProgressBar
            percent={student.progressPercent}
            size="sm"
            showLabel
          />
        </div>
      </TableCell>
      <TableCell>
        {student.progressPercent === 100 && (
          <Badge variant="success">완료</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={`${student.name} 제거`}
        >
          제거
        </Button>
      </TableCell>
    </TableRow>
  );
}

/**
 * Loading skeleton for roster
 */
function RosterSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton
            className="h-10 w-10 rounded-full"
            data-testid="skeleton-avatar"
          />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" data-testid="skeleton-name" />
            <Skeleton className="h-3 w-24" data-testid="skeleton-date" />
          </div>
          <Skeleton className="h-2 w-24" data-testid="skeleton-progress" />
        </div>
      ))}
    </div>
  );
}

/**
 * CourseStudentRoster - Table of enrolled students with progress
 */
export function CourseStudentRoster({ courseId }: CourseStudentRosterProps) {
  const [studentToRemove, setStudentToRemove] = useState<StudentProgress | null>(null);

  const { data: students, isLoading, refetch } = useCourseStudents(courseId);
  const removeMutation = useRemoveStudent();

  const handleConfirmRemove = () => {
    if (!studentToRemove) return;

    removeMutation.mutate(
      { courseId, userId: studentToRemove.userId },
      {
        onSuccess: () => {
          toast.success("학생이 제거되었습니다");
          void refetch();
          setStudentToRemove(null);
        },
        onError: () => {
          toast.error("학생 제거에 실패했습니다. 다시 시도해 주세요.");
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="student-roster-loading">
        <RosterSkeleton />
      </div>
    );
  }

  // Empty state
  if (!students || students.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-muted-foreground)]">
          아직 등록된 학생이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table role="table">
        <TableHeader>
          <TableRow>
            <TableHead>학생</TableHead>
            <TableHead>등록일</TableHead>
            <TableHead>진도</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <StudentRow
              key={student.userId}
              student={student}
              onRemove={() => { setStudentToRemove(student); }}
            />
          ))}
        </TableBody>
      </Table>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!studentToRemove}
        onOpenChange={() => { setStudentToRemove(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>학생 제거</AlertDialogTitle>
            <AlertDialogDescription>
              정말 {studentToRemove?.name}님을 이 강의에서 제거하시겠습니까?
              해당 학생의 진도가 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-[var(--color-error-600)] hover:bg-[var(--color-error-700)]"
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
