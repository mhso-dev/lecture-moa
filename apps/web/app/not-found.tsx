import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

/**
 * 404 Not Found Page
 *
 * Displayed when a route is not found.
 * Provides navigation back to home page.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-muted p-6">
        <FileQuestion className="h-16 w-16 text-muted-foreground" />
      </div>

      <h1 className="mb-2 text-4xl font-bold tracking-tight">
        404
      </h1>

      <h2 className="mb-3 text-2xl font-semibold">
        Page Not Found
      </h2>

      <p className="mb-8 max-w-md text-muted-foreground">
        The page you are looking for does not exist or has been moved.
        Please check the URL or navigate back to the home page.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button asChild variant="default" className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </Button>

        <Button asChild variant="outline" className="gap-2">
          <Link href="javascript:history.back()">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Link>
        </Button>
      </div>
    </div>
  );
}
