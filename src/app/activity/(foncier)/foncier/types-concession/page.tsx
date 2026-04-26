import { Suspense } from "react";
import TypesConcessionClient from "./_components/TypesConcessionClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
export default function TypesConcessionPage() {
  return (<Suspense fallback={<LoadingSkeleton />}><TypesConcessionClient /></Suspense>);
}
