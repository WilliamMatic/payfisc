import type { Metadata } from "next";
import EmbarquementLayoutClient from "./EmbarquementLayoutClient";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Embarquement — Taxe d'embarquement",
  description: "Gestion de la taxe d'embarquement",
};

export default function EmbarquementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <EmbarquementLayoutClient>{children}</EmbarquementLayoutClient>
    </ThemeProvider>
  );
}
