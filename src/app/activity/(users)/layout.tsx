// C:\laragon\www\Impot\Front\payfisc\src\app\activity\(users)\layout.tsx
import type { Metadata } from "next";
import MouvementsLayoutClient from "./UserLayoutClient";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Gestion des Mouvements",
  description:
    "Interface utilisateur pour suivre et gérer vos mouvements financiers : ventes, achats et transactions.",
};

export default function MouvementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <MouvementsLayoutClient>{children}</MouvementsLayoutClient>
    </ThemeProvider>
  );
}