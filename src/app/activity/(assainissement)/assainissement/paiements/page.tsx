import { Suspense } from "react";
import PaiementsClient from "./_components/PaiementsClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function PaiementsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PaiementsClient />
    </Suspense>
  );
}
