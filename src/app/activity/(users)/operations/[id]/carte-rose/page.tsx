import CarteRoseClient from "./CarteRoseClient";

// Required for dynamic routes - no prerender
export function generateStaticParams() {
  return [{ id: '0' }];
}

export default function CarteRosePage() {
  return <CarteRoseClient />;
}