import { Suspense } from "react";
import RangsClient from "./_components/RangsClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
export default function RangsPage() {
  return (<Suspense fallback={<LoadingSkeleton />}><RangsClient /></Suspense>);
}
