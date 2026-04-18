import { Suspense } from "react";
import RepartitionsClient from "./_components/RepartitionsClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function RepartitionsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RepartitionsClient />
    </Suspense>
  );
}
