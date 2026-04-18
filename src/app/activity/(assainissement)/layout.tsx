import type { Metadata } from "next";
import AssainissementLayoutClient from "./AssainissementLayoutClient";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Assainissement — Taxe d'assainissement",
  description: "Gestion de la taxe d'assainissement",
};

export default function AssainissementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AssainissementLayoutClient>{children}</AssainissementLayoutClient>
    </ThemeProvider>
  );
}
