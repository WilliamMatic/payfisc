import PlaqueCarteClient from "./PlaqueCarteClient";

export function generateStaticParams() {
  return [{ id: '0' }];
}

export default function PlaqueCartePage() {
  return <PlaqueCarteClient />;
}
