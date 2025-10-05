'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const pathname = usePathname();

  const menuItems: MenuEntry[] = [
    { icon: "🏠", label: "Dashboard", href: "/system/dashboard" },
    { 
      category: "Contribuables",
      items: [
        { icon: "👤", label: "Particuliers", href: "/system/particuliers" },
        { icon: "🏢", label: "Entreprises", href: "/system/entreprises" }
      ]
    },
    { 
      category: "Paramètrage",
      items: [
        { icon: "🗺️", label: "Provinces", href: "/system/provinces" },
        { icon: "🌍", label: "Sites", href: "/system/sites" },
        { icon: "👥", label: "Utilisateurs", href: "/system/utilisateurs" },
        { icon: "🧑‍💼", label: "Agents", href: "/system/agents" },
        { icon: "📑", label: "Création Impôt", href: "http://localhost/SOCOFIAPP/Impot/backend/impotCreate" },
        { icon: "💰", label: "Impôts", href: "/system/categories" },
        { icon: "📊", label: "Taux", href: "/system/taux" },
        // { icon: "🛡️", label: "Rôles & Permissions", href: "/system/roles" }
      ]
    }
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:relative lg:translate-x-0 z-30 w-64 h-full bg-white/95 shadow-2xl transition-transform duration-300 ease-in-out border-r border-gray-200/50 flex flex-col`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-[#153258] to-[#23A974] flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-[#153258] font-bold text-xl">P</span>
          </div>
          <span className="text-white font-bold text-xl">PayFisc</span>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white">
          ✖️
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-4 flex-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <div key={index}>
            {'category' in item ? (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">
                  {item.category}
                </div>
                {item.items.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-xl transition ${
                      isActive(subItem.href)
                        ? 'bg-gradient-to-r from-[#153258] to-[#23A974] text-white shadow-lg' 
                        : 'text-gray-700 hover:text-[#153258] hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{subItem.icon}</span>
                    <span>{subItem.label}</span>
                  </Link>
                ))}
              </>
            ) : (
              <Link
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-xl transition ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-[#153258] to-[#23A974] text-white shadow-lg' 
                    : 'text-gray-700 hover:text-[#153258] hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
