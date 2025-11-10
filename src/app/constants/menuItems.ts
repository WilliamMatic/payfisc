// constants/menuItems.ts
export interface MenuItem {
  icon: string;
  label: string;
  href: string;
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export type MenuEntry = MenuItem | MenuCategory;

export const menuItems: MenuEntry[] = [
  { icon: "🏠", label: "Dashboard", href: "/system/ia-fiscale" },

  {
    category: "Contribuables",
    items: [
      { icon: "👤", label: "Particuliers", href: "/system/particuliers" },
      { icon: "🏢", label: "Entreprises", href: "/system/entreprises" },
    ],
  },

  {
    category: "Administrative",
    items: [
      { icon: "🗺️", label: "Provinces", href: "/system/provinces" },
      { icon: "🌍", label: "Sites", href: "/system/sites" },
      { icon: "👥", label: "Utilisateurs", href: "/system/utilisateurs" },
      { icon: "🧑‍💼", label: "Agents", href: "/system/agents" },
      { icon: "🤝", label: "Bénéficiaires", href: "/system/beneficiaires" },
      { icon: "👑", label: "Admin", href: "/system/admins" },
    ],
  },
  {
    category: "Parc Roulant",
    items: [
      { icon: "🚗", label: "Types d'Engins", href: "/system/type-engins" },
      { icon: "🏷️", label: "Marques", href: "/system/marques-engins" },
      { icon: "⚡", label: "Énergies", href: "/system/energies" },
      { icon: "🎨", label: "Couleurs", href: "/system/couleurs" },
      {
        icon: "💪",
        label: "Puissances Fiscales",
        href: "/system/puissances-fiscales",
      },
      { icon: "🔄", label: "Usages", href: "/system/usages" },
    ],
  },
  {
    category: "Fiscale",
    items: [
      { icon: "💰", label: "Impôts", href: "/system/categories" },
      { icon: "📊", label: "Taux", href: "/system/taux" },
      {
        icon: "📑",
        label: "Création Impôt",
        href: "http://localhost/Impot/backend/impotCreate.php",
      },
      {
        icon: "🔢",
        label: "Séries Plaques",
        href: "/system/series",
      },
    ],
  },

  {
    category: "Monitoring",
    items: [
      { icon: "🔔", label: "Notifications", href: "/system/notifications" },
      { icon: "📈", label: "Web Vitals", href: "/system/web-vitals" },
      {
        icon: "📜",
        label: "Historique des activités",
        href: "/system/audit-logs",
      },
    ],
  },
];