import { Suspense } from "react";
import EnginsClient from "./_components/EnginsClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function EnginsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EnginsClient />
    </Suspense>
  );
}
