import { Suspense } from "react";
import DashboardClient from "./_components/DashboardClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DashboardClient />
    </Suspense>
  );
}
