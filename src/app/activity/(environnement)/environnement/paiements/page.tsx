import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import PaiementsClient from "./_components/PaiementsClient";

export default function PaiementsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PaiementsClient />
    </Suspense>
  );
}
