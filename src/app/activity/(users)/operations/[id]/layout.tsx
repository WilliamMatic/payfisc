export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function OperationIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
