import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import EvaluationsClient from "./_components/EvaluationsClient";

export default function EvaluationsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EvaluationsClient />
    </Suspense>
  );
}
