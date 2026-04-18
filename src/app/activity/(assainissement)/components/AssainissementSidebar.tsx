"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronDown } from "lucide-react";
import { useState, useCallback } from "react";

interface MenuItem {
  icon: string;
  label: string;
  href: string;
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

type MenuEntry = MenuItem | MenuCategory;

const menuItems: MenuEntry[] = [
  { icon: "📊", label: "Dashboard", href: "/activity/assainissement/dashboard" },

  {
    category: "Configuration",
    items: [
      { icon: "🛣️", label: "Axes", href: "/activity/assainissement/communes" },
      { icon: "📋", label: "Types de taxe", href: "/activity/assainissement/types-taxe" },
      { icon: "🧑‍🔧", label: "Agents Terrain", href: "/activity/assainissement/agents-terrain" },
    ],
  },

  {
    category: "Gestion",
    items: [
      { icon: "👤", label: "Contribuables", href: "/activity/assainissement/contribuables" },
      { icon: "📄", label: "Factures", href: "/activity/assainissement/factures" },
    ],
  },

  {
    category: "Financier",
    items: [
      { icon: "💰", label: "Paiements", href: "/activity/assainissement/paiements" },
      { icon: "💸", label: "Répartitions", href: "/activity/assainissement/repartitions" },
    ],
  },

  {
    category: "Services",
    items: [
      { icon: "🚛", label: "Passages", href: "/activity/assainissement/passages" },
    ],
  },

  {
    category: "Contrôle",
    items: [
      { icon: "🔍", label: "Contrôles", href: "/activity/assainissement/controles" },
      { icon: "⚠️", label: "Sanctions", href: "/activity/assainissement/sanctions" },
    ],
  },
];

const defaultOpenCategories = new Set<string>(
  menuItems
    .filter((item): item is MenuCategory => "category" in item)
    .map((item) => item.category)
);

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function AssainissementSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(defaultOpenCategories)
  );

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const isActive = useCallback((href: string) => pathname === href, [pathname]);
  const isCategoryActive = useCallback(
    (items: MenuItem[]) => items.some((item) => pathname === item.href),
    [pathname]
  );
  const isCategoryOpen = useCallback(
    (category: string) => openCategories.has(category),
    [openCategories]
  );

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] lg:hidden z-20 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static lg:translate-x-0 z-30 w-64 h-full bg-white dark:bg-gray-800 shadow-sm transition-transform duration-300 ease-in-out border-r border-gray-100 dark:border-gray-700 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-5 h-[73px] border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-r from-[#153258] to-[#23A974] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <span className="text-gray-800 dark:text-white font-semibold text-lg">
                Assainissement
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Taxe d&apos;assainissement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuItems.map((item) => (
            <div key={"category" in item ? item.category : item.href}>
              {"category" in item ? (
                <div className="mt-4">
                  <button
                    onClick={() => toggleCategory(item.category)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        isCategoryActive(item.items)
                          ? "text-[#153258] dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.category}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                        isCategoryOpen(item.category) ? "" : "-rotate-90"
                      }`}
                    />
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
                              ? "bg-[#153258] text-white shadow-sm font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:text-[#153258] dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <span className="text-base">{subItem.icon}</span>
                          <span className="flex-1">{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    isActive(item.href)
                      ? "bg-[#153258] text-white shadow-sm font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:text-[#153258] dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
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
            <p className="text-xs text-gray-500">PayFisc — Assainissement</p>
            <p className="text-xs text-gray-400 mt-1">© 2026 PayFisc</p>
          </div>
        </div>
      </aside>
    </>
  );
}
