// src/app/activity/(users)/commandes-plaques/[id]/page.tsx
import { Metadata } from "next";
import DeleteMessageClient from "./components/DeleteMessageClient";

export const metadata: Metadata = {
  title: "Suppression non disponible",
  description: "Cette fonctionnalité n'est pas disponible",
};

interface CommandesPlaquesPageProps {
  params: {
    id: string;
  };
}

export default function CommandesPlaquesPage({
  params,
}: CommandesPlaquesPageProps) {
  return <DeleteMessageClient />;
}
