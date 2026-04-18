import { Suspense } from "react";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
import CategoriesTaxeClient from "./_components/CategoriesTaxeClient";

export default function CategoriesTaxePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CategoriesTaxeClient />
    </Suspense>
  );
}
