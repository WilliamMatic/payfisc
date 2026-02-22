import DelivranceVignetteClient from "./DelivranceVignetteClient";

export function generateStaticParams() {
  return [{ id: '0' }];
}

export default function DelivranceVignettePage() {
  return <DelivranceVignetteClient />;
}
