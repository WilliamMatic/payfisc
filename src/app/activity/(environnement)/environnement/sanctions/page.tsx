import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import SanctionsClient from "./_components/SanctionsClient";

export default function SanctionsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SanctionsClient />
    </Suspense>
  );
}
