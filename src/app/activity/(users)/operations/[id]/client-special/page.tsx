import ClientSpecialClient from "./ClientSpecialClient";

// Required for dynamic routes - no prerender
export function generateStaticParams() {
  return [{ id: '0' }];
}

export default function ClientSpecialPage() {
  return <ClientSpecialClient />;
}
