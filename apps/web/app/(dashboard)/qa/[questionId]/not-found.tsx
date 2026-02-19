/**
 * Q&A Detail Not Found State
 */

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function QANotFound() {
  return (
    <div className="container py-12 max-w-4xl">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">질문을 찾을 수 없습니다</h1>
        <p className="text-muted-foreground mb-6">
          요청하신 질문이 삭제되었거나 존재하지 않습니다.
        </p>
        <Button asChild>
          <Link href="/qa">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Q&A 목록으로
          </Link>
        </Button>
      </div>
    </div>
  );
}
