import { Suspense } from "react";
import GestionClient from "./_components/GestionClient";
import TableSkeleton from "../_shared/TableSkeleton";

export const metadata = {
  title: "Gestion Patentes",
};

export default function GestionPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <GestionClient />
    </Suspense>
  );
}
