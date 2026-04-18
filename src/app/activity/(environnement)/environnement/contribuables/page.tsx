import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import ContribuablesClient from "./_components/ContribuablesClient";

export default function ContribuablesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ContribuablesClient />
    </Suspense>
  );
}
