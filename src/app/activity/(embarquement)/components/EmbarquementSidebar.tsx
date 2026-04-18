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
  { icon: "📈", label: "Dashboard", href: "/activity/embarquement/dashboard" },

  {
    category: "Configuration",
    items: [
      { icon: "🚗", label: "Types d'engins", href: "/activity/embarquement/configuration" },
      { icon: "🏍️", label: "Engins", href: "/activity/embarquement/engins" },
    ],
  },

  {
    category: "Contribuables",
    items: [
      { icon: "👤", label: "Chauffeurs / Propriétaires", href: "/activity/embarquement/contribuables" },
    ],
  },

  {
    category: "Financier",
    items: [
      { icon: "💰", label: "Paiements", href: "/activity/embarquement/paiements" },
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

export default function EmbarquementSidebar({
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
        className={`fixed lg:static lg:translate-x-0 z-30 w-[260px] h-full bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-700/80 transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-gray-200/80 dark:border-gray-700/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#153258] to-[#23A974] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <div className="leading-tight">
              <span className="text-gray-900 dark:text-white font-semibold text-[15px] tracking-tight">
                Embarquement
              </span>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                Taxe d&apos;embarquement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 -mr-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {menuItems.map((item) => (
            <div key={"category" in item ? item.category : item.href}>
              {"category" in item ? (
                <div className="mt-4">
                  <button
                    onClick={() => toggleCategory(item.category)}
                    className="w-full flex items-center justify-between px-2 py-1.5 group"
                  >
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider ${
                        isCategoryActive(item.items)
                          ? "text-[#153258] dark:text-blue-300"
                          : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                      } transition-colors`}
                    >
                      {item.category}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-transform duration-200 ${
                        isCategoryOpen(item.category) ? "" : "-rotate-90"
                      }`}
                    />
                  </button>

                  {isCategoryOpen(item.category) && (
                    <div className="mt-0.5 space-y-0.5">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-all duration-150 ${
                            isActive(subItem.href)
                              ? "bg-[#153258] text-white font-medium shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          <span className="text-[15px] leading-none w-5 text-center shrink-0">
                            {subItem.icon}
                          </span>
                          <span className="truncate">{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-all duration-150 ${
                    isActive(item.href)
                      ? "bg-[#153258] text-white font-medium shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <span className="text-[15px] leading-none w-5 text-center shrink-0">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <p className="text-[11px] text-gray-300 dark:text-gray-600 text-center font-medium">
            PayFisc — Embarquement v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
