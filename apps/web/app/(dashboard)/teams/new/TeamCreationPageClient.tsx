/**
 * TeamCreationPageClient Component
 * TASK-020, TASK-021: Client component for team creation page
 * REQ-FE-717, REQ-FE-718: Form submission with auth check
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "~/stores/auth.store";
import { useCreateTeam } from "~/hooks/team/useTeamMutations";
import { TeamCreationForm } from "~/components/team/TeamCreationForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { toast } from "sonner";
import type { CreateTeamSchema } from "@shared/validators";
import type { Team } from "@shared";

/**
 * TeamCreationPageClient handles team creation form submission
 * with authentication check and success/error handling
 */
export function TeamCreationPageClient() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
  }));

  const createTeamMutation = useCreateTeam();

  // Auth guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?next=/teams/new");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = (data: CreateTeamSchema) => {
    createTeamMutation.mutate(data, {
      onSuccess: (team: Team) => {
        toast.success("Team created successfully");
        // Invalidate teams cache (handled by mutation)
        // Redirect to the new team's detail page
        router.push(`/teams/${team.id}`);
      },
      onError: (error) => {
        // Check if it's a validation error from the server
        const message = error instanceof Error ? error.message : "Failed to create team";
        toast.error(message);
      },
    });
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render form if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container max-w-2xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Team</CardTitle>
          <CardDescription>
            Create a study team to collaborate with others on courses and materials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamCreationForm
            onSubmit={handleSubmit}
            isSubmitting={createTeamMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
