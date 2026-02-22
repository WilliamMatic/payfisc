import AchatsGrossistesClient from "./AchatsGrossistesClient";

// Required for dynamic routes - no prerender
export function generateStaticParams() {
  return [{ id: '0' }];
}

export default function AchatsGrossistesPage() {
  return <AchatsGrossistesClient />;
}