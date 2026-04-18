import { Suspense } from "react";
import ClassificationClient from "./_components/ClassificationClient";
import TableSkeleton from "../_shared/TableSkeleton";

export const metadata = {
  title: "Classification MERI",
};

export default function ClassificationPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ClassificationClient />
    </Suspense>
  );
}
