import ControleTechniqueClient from "./ControleTechniqueClient";

// Required for dynamic routes - no prerender
export function generateStaticParams() {
  return [{ id: '0' }];
}

export default function ControleTechniquePage() {
  return <ControleTechniqueClient />;
}
