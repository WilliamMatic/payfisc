import { Suspense } from "react";
import AmendesClient from "./_components/AmendesClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function AmendesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AmendesClient />
    </Suspense>
  );
}
