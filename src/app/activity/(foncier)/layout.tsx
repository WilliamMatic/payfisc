import type { Metadata } from "next";
import FoncierLayoutClient from "./FoncierLayoutClient";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Foncier — Taxe foncière",
  description: "Gestion de la taxe foncière",
};

export default function FoncierLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FoncierLayoutClient>{children}</FoncierLayoutClient>
    </ThemeProvider>
  );
}
