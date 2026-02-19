import Link from "next/link";
import { Button } from "~/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

interface NotFoundProps {
  params: {
    courseId: string;
    materialId: string;
  };
}

/**
 * Material Viewer 404 State
 * REQ-FE-325: 404 state for material viewer
 *
 * Features:
 * - "Material not found" message
 * - Link back to course materials list
 */
export default function MaterialViewerNotFound({ params }: NotFoundProps) {
  const { courseId } = params;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <FileQuestion className="h-16 w-16 text-[var(--color-muted-foreground)] mb-4" />

      <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
        Material Not Found
      </h1>

      <p className="text-[var(--color-muted-foreground)] mb-6 max-w-md">
        The material you're looking for doesn't exist or has been removed.
      </p>

      <Button
        asChild
        variant="default"
        className="gap-2"
      >
        <Link href={`/courses/${courseId}/materials`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Materials
        </Link>
      </Button>
    </div>
  );
}
