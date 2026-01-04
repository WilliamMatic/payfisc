"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

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
    { icon: "📊", label: "Dashboard", href: "/activity/dashboard" },

    {
      category: "Contribuables",
      items: [
        { icon: "👤", label: "Assujettis", href: "/activity/particuliers" },
      ],
    },

    {
      category: "Opérations",
      items: [
        // { icon: "💳", label: "Mouvement", href: "/activity/paiement" },
        // { icon: "📑", label: "Déclaration", href: "/activity/declaration" },
        { icon: "🔢", label: "Séries de plaques", href: "/activity/series" },
        {
          icon: "⚙️",
          label: "Opérations diverses",
          href: "/activity/operations",
        },
      ],
    },

    {
      category: "Impressions",
      items: [
        {
          icon: "🖨️",
          label: "Réimpression des cartes",
          href: "/activity/reimpression",
        },
      ],
    },
    {
      category: "Création de données",
      items: [
        { icon: "🏷️", label: "Marques", href: "/activity/marques-engins" },
        { icon: "⚡", label: "Énergies", href: "/activity/energies" },
        { icon: "🎨", label: "Couleurs", href: "/activity/couleurs" },
        {
          icon: "💪",
          label: "Puissances Fiscales",
          href: "/activity/puissances-fiscales",
        },
        { icon: "🔄", label: "Usages", href: "/activity/usages" },
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
        className={`fixed lg:static lg:translate-x-0 z-30 w-64 h-full bg-white shadow-sm transition-transform duration-300 ease-in-out border-r border-gray-100 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-r from-[#2D5B7A] to-[#3A7A5F] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <span className="text-gray-800 font-semibold text-lg">
                PayFisc
              </span>
              <p className="text-xs text-gray-500">Système fiscal</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
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
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      {item.category}
                    </span>
                    {isCategoryOpen(item.category) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>

                  {isCategoryOpen(item.category) && (
                    <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            isActive(subItem.href)
                              ? "bg-[#2D5B7A] text-white shadow-sm"
                              : "text-gray-700 hover:text-[#2D5B7A] hover:bg-gray-50"
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
                      : "text-gray-700 hover:text-[#2D5B7A] hover:bg-gray-50"
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
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">Version 1.2</p>
            <p className="text-xs text-gray-400 mt-1">© 2026 PayFisc</p>
          </div>
        </div>
      </aside>
    </>
  );
}
