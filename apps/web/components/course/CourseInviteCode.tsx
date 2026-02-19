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
      toast.success("Invite code copied to clipboard");

      // Reset copied state after 2 seconds
      void setTimeout(() => { setCopied(false); }, 2000);
    } catch (err) {
      toast.error("Failed to copy. Please try again.");
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
          toast.success("New invite code generated");
          setShowConfirmDialog(false);
          onCodeGenerated?.(data.code);
        },
        onError: () => {
          toast.error("Failed to generate new code. Please try again.");
        },
      }
    );
  };

  // No code exists - show generate button
  if (!code) {
    return (
      <div className="flex items-center gap-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No invite code generated yet.
        </p>
        <Button
          onClick={handleGenerateNew}
          disabled={generateMutation.isPending}
          aria-label="Generate invite code"
        >
          {generateMutation.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate Code
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Code Display */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Invite Code:</span>
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
          aria-label="Copy invite code"
        >
          {copied ? (
            <>
              <Check data-testid="check-icon" className="h-4 w-4 mr-2 text-[var(--color-success-600)]" />
              Copied
            </>
          ) : (
            <>
              <Copy data-testid="copy-icon" className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>

        {/* Generate New Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateNew}
          disabled={generateMutation.isPending}
          aria-label="Generate new invite code"
        >
          {generateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Generate New
        </Button>
      </div>

      {/* Expiration Info */}
      {expiresAt && (
        <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
          Expires: {new Date(expiresAt).toLocaleDateString()}
        </p>
      )}

      {/* Copy Status Announcement */}
      {copied && (
        <span role="status" className="sr-only">
          Invite code copied to clipboard
        </span>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate New Invite Code</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate the old code. Students who have not yet
              enrolled will need the new code to join.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGenerate}>
              Generate New Code
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
