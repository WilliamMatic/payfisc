import { Suspense } from "react";
import ContribuablesClient from "./_components/ContribuablesClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function ContribuablesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ContribuablesClient />
    </Suspense>
  );
}
