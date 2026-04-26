import { Suspense } from "react";
import AuditClient from "./_components/AuditClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
export default function Page() {
  return (<Suspense fallback={<LoadingSkeleton />}><AuditClient /></Suspense>);
}
