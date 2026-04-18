import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import RepartitionsClient from "./_components/RepartitionsClient";

export default function RepartitionsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RepartitionsClient />
    </Suspense>
  );
}
