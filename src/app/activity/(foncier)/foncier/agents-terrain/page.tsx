import { Suspense } from "react";
import AgentsTerrainClient from "./_components/AgentsTerrainClient";
import LoadingSkeleton from "../_shared/LoadingSkeleton";
export default function Page() {
  return (<Suspense fallback={<LoadingSkeleton />}><AgentsTerrainClient /></Suspense>);
}
