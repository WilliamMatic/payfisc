import { Suspense } from "react";
import BiensClient from "./_components/BiensClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
export default function Page() {
  return (<Suspense fallback={<LoadingSkeleton />}><BiensClient /></Suspense>);
}
