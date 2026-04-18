import { Suspense } from "react";
import SanctionsClient from "./_components/SanctionsClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function SanctionsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SanctionsClient />
    </Suspense>
  );
}
