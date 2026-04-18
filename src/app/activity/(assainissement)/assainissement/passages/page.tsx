import { Suspense } from "react";
import PassagesClient from "./_components/PassagesClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function PassagesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PassagesClient />
    </Suspense>
  );
}
