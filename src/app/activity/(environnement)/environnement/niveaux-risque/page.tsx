import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import NiveauxRisqueClient from "./_components/NiveauxRisqueClient";

export default function NiveauxRisquePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <NiveauxRisqueClient />
    </Suspense>
  );
}
