import { Suspense } from "react";
import DeclarationsClient from "./_components/DeclarationsClient";
import TableSkeleton from "../_shared/TableSkeleton";

export const metadata = {
  title: "Déclarations Patente",
};

export default function DeclarationsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <DeclarationsClient />
    </Suspense>
  );
}
