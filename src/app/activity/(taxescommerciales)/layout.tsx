import type { Metadata } from "next";
import PatenteLayoutClient from "./PatenteLayoutClient";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Patente — Taxes Commerciales",
  description: "Gestion des patentes et taxes commerciales",
};

export default function TaxesCommercialesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <PatenteLayoutClient>{children}</PatenteLayoutClient>
    </ThemeProvider>
  );
}
