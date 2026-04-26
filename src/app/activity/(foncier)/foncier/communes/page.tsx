import { Suspense } from "react";
import CommunesClient from "./_components/CommunesClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
export default function CommunesPage() {
  return (<Suspense fallback={<LoadingSkeleton />}><CommunesClient /></Suspense>);
}
