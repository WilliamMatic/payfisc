import { Suspense } from "react";
import ContribuablesClient from "./_components/ContribuablesClient";
import TableSkeleton from "../_shared/TableSkeleton";

export const metadata = {
  title: "Contribuables Patente",
};

export default function ContribuablesPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ContribuablesClient />
    </Suspense>
  );
}
