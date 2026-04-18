import { Suspense } from "react";
import AvenuesClient from "./_components/AvenuesClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function AvenuesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AvenuesClient />
    </Suspense>
  );
}
