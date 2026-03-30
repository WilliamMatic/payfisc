import InscriptionVignetteClient from "./InscriptionVignetteClient";

export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function InscriptionVignettePage() {
  return <InscriptionVignetteClient />;
}
