import { Suspense } from "react";
import TarifsClient from "./_components/TarifsClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
export default function Page() {
  return (<Suspense fallback={<LoadingSkeleton />}><TarifsClient /></Suspense>);
}
