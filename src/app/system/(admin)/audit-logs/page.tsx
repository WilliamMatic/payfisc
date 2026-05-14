import AuditLogsPageClient from './AuditLogsPageClient';

export const metadata = {
  title: "Historique des activités",
  description: "Consultez l'historique complet des activités du système.",
};

export default function AuditLogsPage() {
  return <AuditLogsPageClient />;
}