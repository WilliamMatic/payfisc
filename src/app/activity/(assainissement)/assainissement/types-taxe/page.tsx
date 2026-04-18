import { Suspense } from "react";
import TypesTaxeClient from "./_components/TypesTaxeClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function TypesTaxePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TypesTaxeClient />
    </Suspense>
  );
}
