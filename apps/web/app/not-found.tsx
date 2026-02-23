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
        페이지를 찾을 수 없습니다
      </h2>

      <p className="mb-8 max-w-md text-muted-foreground">
        찾으시는 페이지가 존재하지 않거나 이동되었습니다.
        URL을 확인하거나 홈 페이지로 돌아가 주세요.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button asChild variant="default" className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            홈으로 이동
          </Link>
        </Button>

        <Button asChild variant="outline" className="gap-2">
          <Link href="javascript:history.back()">
            <ArrowLeft className="h-4 w-4" />
            뒤로 가기
          </Link>
        </Button>
      </div>
    </div>
  );
}
