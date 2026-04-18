import { Suspense } from "react";
import ZonesClient from "./_components/ZonesClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function ZonesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ZonesClient />
    </Suspense>
  );
}
