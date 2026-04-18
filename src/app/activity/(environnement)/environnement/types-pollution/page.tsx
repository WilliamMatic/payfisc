import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import TypesPollutionClient from "./_components/TypesPollutionClient";

export default function TypesPollutionPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TypesPollutionClient />
    </Suspense>
  );
}
