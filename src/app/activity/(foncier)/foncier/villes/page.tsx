import { Suspense } from "react";
import VillesClient from "./_components/VillesClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";

export default function VillesPage() {
  return (<Suspense fallback={<LoadingSkeleton />}><VillesClient /></Suspense>);
}
