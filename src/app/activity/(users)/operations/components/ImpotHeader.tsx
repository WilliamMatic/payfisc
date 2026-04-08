import { Landmark, Search } from "lucide-react";

interface ImpotHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  impotsCount: number;
  // onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function ImpotHeader({
  searchTerm,
  onSearchChange,
  impotsCount,
  // onRefresh,
  isRefreshing = false,
}: ImpotHeaderProps) {
  return (
    <div className="mb-6">
      <div className="bg-[#2D5B7A] rounded-xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 p-2.5 rounded-lg">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Opérations Fiscales
              </h1>
              <p className="text-white/70 text-sm mt-0.5">
                {impotsCount} {impotsCount <= 1 ? "service disponible" : "services disponibles"}
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un impôt..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2.5 border-0 rounded-lg bg-white/95 w-full focus:outline-none focus:ring-2 focus:ring-white/40 text-gray-800 placeholder-gray-400 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
