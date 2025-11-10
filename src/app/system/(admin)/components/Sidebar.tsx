"use client";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface MenuItem {
  icon: string; // émoji
  label: string;
  href: string;
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

type MenuEntry = MenuItem | MenuCategory;

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set<string>()
  );

  // Ouvrir toutes les catégories par défaut au premier rendu
  useEffect(() => {
    const defaultOpenCategories = new Set<string>();
    menuItems.forEach((item) => {
      if ("category" in item) {
        defaultOpenCategories.add(item.category);
      }
    });
    setOpenCategories(defaultOpenCategories);
  }, []);

  const toggleCategory = (category: string) => {
    const newOpenCategories = new Set(openCategories);
    if (newOpenCategories.has(category)) {
      newOpenCategories.delete(category);
    } else {
      newOpenCategories.add(category);
    }
    setOpenCategories(newOpenCategories);
  };

  const menuItems: MenuEntry[] = [
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
          // href: "https://mpako.net/Backend/models/impotCreate.php",
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
        // { icon: "🧾", label: "Paiement", href: "/system/paiement" }
      ],
    },
  ];

  const isActive = (href: string) => pathname === href;

  const isCategoryOpen = (category: string) => openCategories.has(category);

  return (
    <>
      {/* Overlay pour mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 lg:hidden z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static lg:translate-x-0 z-30 w-64 h-full bg-white dark:bg-gray-800 shadow-sm transition-transform duration-300 ease-in-out border-r border-gray-100 dark:border-gray-700 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-r from-[#2D5B7A] to-[#3A7A5F] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <span className="text-gray-800 dark:text-white font-semibold text-lg">
                PayFisc
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Système fiscal
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuItems.map((item, index) => (
            <div key={index} className="mb-1">
              {"category" in item ? (
                <>
                  <button
                    onClick={() => toggleCategory(item.category)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {item.category}
                    </span>
                    {isCategoryOpen(item.category) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>

                  {isCategoryOpen(item.category) && (
                    <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            isActive(subItem.href)
                              ? "bg-[#2D5B7A] text-white shadow-sm"
                              : "text-gray-700 dark:text-gray-300 hover:text-[#2D5B7A] dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <span className="text-base">{subItem.icon}</span>
                          <span className="flex-1">{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    isActive(item.href)
                      ? "bg-[#2D5B7A] text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:text-[#2D5B7A] dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Version 1.0.0
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              © 2025 PayFisc
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
