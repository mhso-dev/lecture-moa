/**
 * CourseEnrollButton Component
 * TASK-026: Public enrollment button
 * TASK-027: Invite code enrollment
 *
 * REQ-FE-414: Enroll Button (Public)
 * REQ-FE-415: Join via Invite Code
 * REQ-FE-440: Optimistic Updates
 */

"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { useEnrollCourse } from "~/hooks/useEnrollCourse";
import { useEnrollWithCode } from "~/hooks/useEnrollWithCode";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import type { CourseVisibility } from "@shared";

interface CourseEnrollButtonProps {
  courseId: string;
  visibility: CourseVisibility;
  isEnrolled: boolean;
  onEnrollSuccess?: () => void;
}

/**
 * CourseEnrollButton - Enroll button for public courses or invite code form for invite_only
 */
export function CourseEnrollButton({
  courseId,
  visibility,
  isEnrolled,
  onEnrollSuccess,
}: CourseEnrollButtonProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const enrollMutation = useEnrollCourse();
  const enrollWithCodeMutation = useEnrollWithCode();

  // If already enrolled, show status
  if (isEnrolled) {
    return (
      <Badge variant="success" className="px-4 py-2">
        <Check className="h-4 w-4 mr-2" />
        수강 중
      </Badge>
    );
  }

  // Public course - simple enroll button
  if (visibility === "public") {
    const handleEnroll = () => {
      enrollMutation.mutate(
        { courseId },
        {
          onSuccess: () => {
            toast.success("강의에 등록되었습니다!");
            onEnrollSuccess?.();
          },
          onError: (err) => {
            toast.error("등록에 실패했습니다. 다시 시도해 주세요.");
            console.error("Enrollment error:", err);
          },
        }
      );
    };

    return (
      <Button
        onClick={handleEnroll}
        disabled={enrollMutation.isPending}
        aria-label="이 강의에 등록"
        size="lg"
      >
        {enrollMutation.isPending && (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        )}
        수강 신청
      </Button>
    );
  }

  // Invite-only course - show code input form
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setInviteCode(value);
    setError(null);
  };

  const handleSubmitCode = () => {
    // Validate code length
    if (inviteCode.length !== 6) {
      setError("초대 코드는 정확히 6자여야 합니다");
      return;
    }

    enrollWithCodeMutation.mutate(
      { courseId, code: inviteCode },
      {
        onSuccess: () => {
          toast.success("Successfully enrolled in the course!");
          onEnrollSuccess?.();
        },
        onError: (err) => {
          toast.error("잘못된 초대 코드입니다. 확인 후 다시 시도해 주세요.");
          console.error("Enrollment error:", err);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmitCode();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="초대 코드 입력"
          aria-label="초대 코드 입력"
          value={inviteCode}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          maxLength={6}
          className={cn(
            "font-mono text-center tracking-wider uppercase",
            error && "border-[var(--color-error-500)]"
          )}
          error={!!error}
        />
        <Button
          onClick={handleSubmitCode}
          disabled={enrollWithCodeMutation.isPending || inviteCode.length !== 6}
        >
          {enrollWithCodeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "참여"
          )}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-[var(--color-error-600)]">
          {error}
        </p>
      )}
    </div>
  );
}
