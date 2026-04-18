import { Suspense } from "react";
import PaiementsClient from "./_components/PaiementsClient";
import TableSkeleton from "../_shared/TableSkeleton";

export const metadata = {
  title: "Paiements Patente",
};

export default function PaiementsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <PaiementsClient />
    </Suspense>
  );
}
