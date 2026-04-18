import { Suspense } from "react";
import ControlesClient from "./_components/ControlesClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function ControlesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ControlesClient />
    </Suspense>
  );
}
