import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import QuartiersClient from "./_components/QuartiersClient";

export default function QuartiersPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <QuartiersClient />
    </Suspense>
  );
}
