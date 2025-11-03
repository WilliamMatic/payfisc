'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, Car } from 'lucide-react';
import { Serie as SerieType, SerieItem, getSerieItems } from '@/services/plaques/plaqueService';

interface ItemsSerieModalProps {
  serie: SerieType;
  onClose: () => void;
}

export default function ItemsSerieModal({ serie, onClose }: ItemsSerieModalProps) {
  const [items, setItems] = useState<SerieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const result = await getSerieItems(serie.id);
        
        if (result.status === 'success') {
          setItems(result.data || []);
          setError(null);
        } else {
          setError(result.message || 'Erreur lors du chargement des plaques');
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [serie.id]);

  const getItemBadge = (statut: '0' | '1') => {
    return statut === '0' 
      ? 'bg-green-50 text-green-700 border border-green-100' 
      : 'bg-red-50 text-red-700 border border-red-100';
  };

  const getItemLabel = (statut: '0' | '1') => {
    return statut === '0' ? 'Disponible' : 'Utilisée';
  };

  // Grouper les items par centaines pour un affichage plus organisé
  const groupedItems = items.reduce((groups, item) => {
    const groupKey = Math.floor((item.value - 1) / 100);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<number, SerieItem[]>);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] animate-in fade-in-90 zoom-in-90 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE MODALE */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center">
            <div className="bg-[#2D5B7A] p-2 rounded-lg mr-3">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Plaques de la série {serie.nom_serie}
              </h3>
              <p className="text-sm text-gray-500">
                {serie.items_disponibles} disponibles sur {serie.total_items} plaques
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* CORPS DE LA MODALE - MAIN CONTENT AREA */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-full py-16">
              <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
              <span className="ml-3 text-gray-600">Chargement des plaques...</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full py-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* STATISTIQUES - FIXED SECTION */}
              <div className="p-5 pb-0 flex-shrink-0">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{serie.total_items}</div>
                    <div className="text-gray-500 text-sm">Total plaques</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{serie.items_disponibles}</div>
                    <div className="text-green-600 text-sm">Disponibles</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-700">{serie.items_utilises}</div>
                    <div className="text-red-600 text-sm">Utilisées</div>
                  </div>
                </div>
              </div>

              {/* LISTE DES PLAQUES - SCROLLABLE SECTION */}
              <div className="flex-1 overflow-y-auto px-5">
                <div className="space-y-6 pb-5">
                  {Object.entries(groupedItems).map(([groupKey, groupItems]) => {
                    const start = parseInt(groupKey) * 100 + 1;
                    const end = start + 99;
                    
                    return (
                      <div key={groupKey} className="border border-gray-200 rounded-lg">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h4 className="font-semibold text-gray-800">
                            Plaques {start.toString().padStart(3, '0')} à {end.toString().padStart(3, '0')}
                          </h4>
                        </div>
                        <div className="grid grid-cols-10 gap-2 p-4">
                          {groupItems.map((item) => (
                            <div
                              key={item.id}
                              className={`p-2 rounded-lg text-center border transition-colors ${
                                item.statut === '0' 
                                  ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                                  : 'bg-red-50 border-red-200 hover:bg-red-100 cursor-not-allowed'
                              }`}
                              title={`${serie.nom_serie} ${item.value.toString().padStart(3, '0')} - ${getItemLabel(item.statut)}`}
                            >
                              <div className="text-xs font-mono font-bold">
                                {serie.nom_serie} {item.value.toString().padStart(3, '0')}
                              </div>
                              <div className={`text-xs mt-1 px-1 py-0.5 rounded-full ${getItemBadge(item.statut)}`}>
                                {getItemLabel(item.statut)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* LÉGENDE - FIXED AT BOTTOM OF SCROLLABLE AREA */}
                <div className="sticky bottom-0 bg-white pt-4 pb-5 border-t border-gray-200 mt-2">
                  <div className="flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-gray-600">Disponible</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-gray-600">Utilisée</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PIED DE PAGE */}
        <div className="flex items-center justify-end space-x-3 p-5 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}