import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import ControlesClient from "./_components/ControlesClient";

export default function ControlesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ControlesClient />
    </Suspense>
  );
}
