import { Suspense } from "react";
import VehiculesClient from "./_components/VehiculesClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function VehiculesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <VehiculesClient />
    </Suspense>
  );
}
