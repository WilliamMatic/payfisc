import { Suspense } from "react";
import AffectationsClient from "./_components/AffectationsClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
export default function AffectationsPage() {
  return (<Suspense fallback={<LoadingSkeleton />}><AffectationsClient /></Suspense>);
}
