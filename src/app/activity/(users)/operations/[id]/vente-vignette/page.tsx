import VenteVignetteClient from "./VenteVignetteClient";

export function generateStaticParams() {
  return [{ id: '0' }];
}

export default function VenteVignettePage() {
  return <VenteVignetteClient />;
}
