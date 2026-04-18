import { Suspense } from "react";
import ConfigurationClient from "./_components/ConfigurationClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function ConfigurationPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ConfigurationClient />
    </Suspense>
  );
}
