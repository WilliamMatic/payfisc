import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import FacturesClient from "./_components/FacturesClient";

export default function FacturesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <FacturesClient />
    </Suspense>
  );
}
