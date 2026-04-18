import { Suspense } from "react";
import StationnementsClient from "./_components/StationnementsClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function StationnementsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <StationnementsClient />
    </Suspense>
  );
}
