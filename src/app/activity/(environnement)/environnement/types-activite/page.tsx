import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import TypesActiviteClient from "./_components/TypesActiviteClient";

export default function TypesActivitePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TypesActiviteClient />
    </Suspense>
  );
}
