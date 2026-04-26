import { Suspense } from "react";
import FacturesClient from "./_components/FacturesClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
export default function Page() {
  return (<Suspense fallback={<LoadingSkeleton />}><FacturesClient /></Suspense>);
}
