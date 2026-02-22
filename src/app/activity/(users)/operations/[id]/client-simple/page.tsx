import ClientSimpleClient from "./ClientSimpleClient";

// Required for dynamic routes - no prerender
export function generateStaticParams() {
  return [{ id: '0' }];
}

export default function ClientSimplePage() {
  return <ClientSimpleClient />;
}