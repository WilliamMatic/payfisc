import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import AvenuesClient from "./_components/AvenuesClient";

export default function AvenuesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AvenuesClient />
    </Suspense>
  );
}
