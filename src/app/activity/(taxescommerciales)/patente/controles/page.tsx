import { Suspense } from "react";
import ControlesClient from "./_components/ControlesClient";
import TableSkeleton from "../_shared/TableSkeleton";

export const metadata = {
  title: "Contrôle & Conformité",
};

export default function ControlesPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ControlesClient />
    </Suspense>
  );
}
