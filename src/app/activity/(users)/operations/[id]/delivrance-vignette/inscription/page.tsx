import InscriptionDelivranceClient from "./InscriptionDelivranceClient";

export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function InscriptionDelivrancePage() {
  return <InscriptionDelivranceClient />;
}
