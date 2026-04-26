import { Suspense } from "react";
import PenalitesClient from "./_components/PenalitesClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
export default function PenalitesPage() {
  return (<Suspense fallback={<LoadingSkeleton />}><PenalitesClient /></Suspense>);
}
