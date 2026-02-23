/**
 * CourseInviteCode Component
 * TASK-029: Display code, copy button, generate new code
 *
 * REQ-FE-433: Invite Code Management
 * REQ-FE-434: Generate New Invite Code
 */

"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
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
import { Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import { useGenerateInviteCode } from "~/hooks/useGenerateInviteCode";
import { toast } from "sonner";

interface CourseInviteCodeProps {
  courseId: string;
  code?: string;
  expiresAt?: string;
  onCodeGenerated?: (newCode: string) => void;
}

/**
 * CourseInviteCode - Display and manage invite code
 */
export function CourseInviteCode({
  courseId,
  code: initialCode,
  expiresAt,
  onCodeGenerated,
}: CourseInviteCodeProps) {
  const [code, setCode] = useState(initialCode ?? "");
  const [copied, setCopied] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const generateMutation = useGenerateInviteCode();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("초대 코드가 클립보드에 복사되었습니다");

      // Reset copied state after 2 seconds
      void setTimeout(() => { setCopied(false); }, 2000);
    } catch (err) {
      toast.error("복사에 실패했습니다. 다시 시도해 주세요.");
      console.error("Copy error:", err);
    }
  };

  const handleGenerateNew = () => {
    setShowConfirmDialog(true);
  };

  const confirmGenerate = () => {
    generateMutation.mutate(
      { courseId },
      {
        onSuccess: (data) => {
          setCode(data.code);
          toast.success("새 초대 코드가 생성되었습니다");
          setShowConfirmDialog(false);
          onCodeGenerated?.(data.code);
        },
        onError: () => {
          toast.error("코드 생성에 실패했습니다. 다시 시도해 주세요.");
        },
      }
    );
  };

  // No code exists - show generate button
  if (!code) {
    return (
      <div className="flex items-center gap-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          아직 초대 코드가 생성되지 않았습니다.
        </p>
        <Button
          onClick={handleGenerateNew}
          disabled={generateMutation.isPending}
          aria-label="초대 코드 생성"
        >
          {generateMutation.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          <RefreshCw className="h-4 w-4 mr-2" />
          코드 생성
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Code Display */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">초대 코드:</span>
          <code
            data-testid="invite-code-display"
            aria-live="polite"
            className="px-3 py-1.5 bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-900)] rounded-md font-mono text-lg tracking-wider"
          >
            {code.toUpperCase()}
          </code>
        </div>

        {/* Copy Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          aria-label="초대 코드 복사"
        >
          {copied ? (
            <>
              <Check data-testid="check-icon" className="h-4 w-4 mr-2 text-[var(--color-success-600)]" />
              복사됨
            </>
          ) : (
            <>
              <Copy data-testid="copy-icon" className="h-4 w-4 mr-2" />
              복사
            </>
          )}
        </Button>

        {/* Generate New Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateNew}
          disabled={generateMutation.isPending}
          aria-label="새 초대 코드 생성"
        >
          {generateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          새로 생성
        </Button>
      </div>

      {/* Expiration Info */}
      {expiresAt && (
        <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
          만료: {new Date(expiresAt).toLocaleDateString()}
        </p>
      )}

      {/* Copy Status Announcement */}
      {copied && (
        <span role="status" className="sr-only">
          초대 코드가 클립보드에 복사되었습니다
        </span>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>새 초대 코드 생성</AlertDialogTitle>
            <AlertDialogDescription>
              기존 코드가 무효화됩니다. 아직 등록하지 않은 학생은
              새 코드로 참여해야 합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGenerate}>
              새 코드 생성
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
