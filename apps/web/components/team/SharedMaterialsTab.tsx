/**
 * SharedMaterialsTab Component
 * TASK-028: Shared materials tab content
 * REQ-FE-723: Materials shared within team
 */

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { useTeamMembers } from "~/hooks/team/useTeam";
import { useAuthStore } from "~/stores/auth.store";
import {
  FolderOpen,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

// Shared material type - would be in types file
interface SharedMaterial {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  authorName: string;
  linkedAt: Date;
}

// Mock hook - would be implemented separately
function useTeamMaterials(_teamId: string) {
  // Placeholder - actual implementation would fetch from API
  return {
    data: [] as SharedMaterial[],
    isLoading: false,
    error: null,
  };
}

function useRemoveMaterial() {
  return {
    mutate: () => {},
    isPending: false,
  };
}

interface SharedMaterialsTabProps {
  teamId: string;
  currentUserId?: string;
}

/**
 * SharedMaterialsTab displays materials shared within the team.
 * All members can view and add materials.
 * Only leaders can remove materials.
 */
export function SharedMaterialsTab({
  teamId,
  currentUserId,
}: SharedMaterialsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: members } = useTeamMembers(teamId);
  const { data: materials, isLoading, error } = useTeamMaterials(teamId);
  const { mutate: removeMaterial, isPending: isRemoving } = useRemoveMaterial();
  const user = useAuthStore((state) => state.user);

  // Determine if current user is a leader
  const isCurrentUserLeader = members?.some(
    (m) => m.userId === (currentUserId || user?.id) && m.role === "leader"
  );

  // Format date helper
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div data-testid="materials-loading-skeleton" className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">자료를 불러오지 못했습니다</h3>
        <p className="text-muted-foreground">
          페이지를 새로고침해 주세요.
        </p>
      </div>
    );
  }

  if (!materials || materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">공유된 자료가 없습니다</h3>
        <p className="text-muted-foreground mb-4">
          팀과 공유할 자료를 추가하세요.
        </p>
        <Button onClick={() => { setShowAddDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          자료 추가
        </Button>

        {/* Add material dialog placeholder */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>자료 추가</DialogTitle>
              <DialogDescription>
                팀과 공유할 자료를 선택하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                자료 선택 컴포넌트가 여기에 표시됩니다.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with add button */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">
            공유 자료 {materials.length}개
          </span>
        </div>
        <Button onClick={() => { setShowAddDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          자료 추가
        </Button>
      </div>

      {/* Materials list */}
      <div className="grid gap-4 p-4">
        {materials.map((material) => (
          <Card key={material.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <Link
                  href={`/courses/${material.courseId}/materials/${material.id}`}
                  className="hover:underline"
                >
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {material.title}
                    <ExternalLink className="h-3 w-3" />
                  </CardTitle>
                </Link>
                {isCurrentUserLeader && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { removeMaterial(); }}
                    disabled={isRemoving}
                    aria-label="자료 삭제"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline">{material.courseName}</Badge>
                <span>{material.authorName} 공유</span>
                <span>{formatDate(material.linkedAt)} 연결</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add material dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>자료 추가</DialogTitle>
            <DialogDescription>
              팀과 공유할 자료를 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              자료 선택 컴포넌트가 여기에 표시됩니다.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
