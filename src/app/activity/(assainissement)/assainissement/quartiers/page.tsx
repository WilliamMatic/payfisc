import { Suspense } from "react";
import QuartiersClient from "./_components/QuartiersClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function QuartiersPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <QuartiersClient />
    </Suspense>
  );
}
