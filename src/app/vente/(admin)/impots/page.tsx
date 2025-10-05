'use client';
import { useState, useCallback } from 'react';
import { Home, Plus, Trash2, X, Save, RotateCcw, FileText, Hash, List, Paperclip } from 'lucide-react';

interface OptionItem {
  id: string;
  nom: string;
  type: 'valeur' | 'sous-rubrique';
  sousRubriques?: Rubrique[];
}

interface Rubrique {
  id: string;
  champ: string;
  type: 'texte' | 'nombre' | 'liste' | 'fichier';
  options?: OptionItem[];
  sousRubriques?: Rubrique[];
  level: number;
}

interface CalculParam {
  id: string;
  nom: string;
  valeur: string;
}

interface TaxData {
  id: number;
  nom: string;
  description: string;
  formulaire: Rubrique[];
  calcul: {
    formule: string;
    [key: string]: any;
  };
  dateCreation: string;
  version: string;
}

export default function CreateTaxePage() {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [formule, setFormule] = useState('');
  const [rubriques, setRubriques] = useState<Rubrique[]>([]);
  const [calculParams, setCalculParams] = useState<CalculParam[]>([
    { id: '1', nom: '', valeur: '' }
  ]);
  const [generatedJson, setGeneratedJson] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const showMessage = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const sanitizeInput = (input: string) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!nom.trim()) {
      newErrors.nom = 'Le nom de l\'impôt est requis';
    }
    
    if (rubriques.length === 0) {
      newErrors.rubriques = 'Au moins une rubrique est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createNewRubrique = (level: number = 0): Rubrique => ({
    id: generateId(),
    champ: '',
    type: 'texte',
    options: [],
    sousRubriques: [],
    level
  });

  const addRubrique = () => {
    setRubriques([...rubriques, createNewRubrique()]);
  };

  const addSousRubrique = (parentId: string) => {
    const updateRubriques = (items: Rubrique[]): Rubrique[] => {
      return items.map(rubrique => {
        if (rubrique.id === parentId) {
          return {
            ...rubrique,
            sousRubriques: [...(rubrique.sousRubriques || []), createNewRubrique(rubrique.level + 1)]
          };
        }
        if (rubrique.sousRubriques) {
          return {
            ...rubrique,
            sousRubriques: updateRubriques(rubrique.sousRubriques)
          };
        }
        return rubrique;
      });
    };
    setRubriques(updateRubriques(rubriques));
  };

  const removeRubrique = (id: string) => {
    const removeFromList = (items: Rubrique[]): Rubrique[] => {
      return items.filter(item => item.id !== id).map(item => ({
        ...item,
        sousRubriques: item.sousRubriques ? removeFromList(item.sousRubriques) : []
      }));
    };
    setRubriques(removeFromList(rubriques));
  };

  const updateRubrique = (id: string, updates: Partial<Rubrique>) => {
    const updateInList = (items: Rubrique[]): Rubrique[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        if (item.sousRubriques) {
          return {
            ...item,
            sousRubriques: updateInList(item.sousRubriques)
          };
        }
        return item;
      });
    };
    setRubriques(updateInList(rubriques));
  };

  const addOption = (rubriqueId: string) => {
    const newOption: OptionItem = {
      id: generateId(),
      nom: '',
      type: 'valeur',
      sousRubriques: []
    };
    
    updateRubrique(rubriqueId, {
      options: [...(rubriques.find(r => r.id === rubriqueId)?.options || []), newOption]
    });
  };

  const removeOption = (rubriqueId: string, optionId: string) => {
    const rubrique = rubriques.find(r => r.id === rubriqueId);
    if (rubrique) {
      updateRubrique(rubriqueId, {
        options: rubrique.options?.filter(opt => opt.id !== optionId) || []
      });
    }
  };

  const addCalculParam = () => {
    setCalculParams([...calculParams, { id: generateId(), nom: '', valeur: '' }]);
  };

  const removeCalculParam = (id: string) => {
    setCalculParams(calculParams.filter(param => param.id !== id));
  };

  const updateCalculParam = (id: string, field: 'nom' | 'valeur', value: string) => {
    setCalculParams(calculParams.map(param => 
      param.id === id ? { ...param, [field]: value } : param
    ));
  };

  const generateJson = () => {
    if (!validateForm()) {
      showMessage('Veuillez corriger les erreurs avant de générer le JSON', 'error');
      return;
    }

    try {
      const calculData: { formule: string; [key: string]: any } = { 
        formule: sanitizeInput(formule) 
      };
      
      calculParams.forEach(param => {
        if (param.nom.trim() && param.valeur.trim()) {
          const numValue = parseFloat(param.valeur);
          calculData[sanitizeInput(param.nom)] = isNaN(numValue) ? sanitizeInput(param.valeur) : numValue;
        }
      });

      const taxData: TaxData = {
        id: Date.now(),
        nom: sanitizeInput(nom),
        description: sanitizeInput(description),
        formulaire: rubriques,
        calcul: calculData,
        dateCreation: new Date().toISOString(),
        version: "1.0"
      };

      setGeneratedJson(JSON.stringify(taxData, null, 2));
      showMessage('JSON généré avec succès !', 'success');
    } catch (error) {
      showMessage('Erreur lors de la génération du JSON', 'error');
    }
  };

  const resetForm = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser le formulaire ? Toutes les données seront perdues.')) {
      setNom('');
      setDescription('');
      setFormule('');
      setRubriques([]);
      setCalculParams([{ id: '1', nom: '', valeur: '' }]);
      setGeneratedJson('');
      setErrors({});
      showMessage('Formulaire réinitialisé avec succès !', 'success');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'texte': return <FileText className="w-4 h-4" />;
      case 'nombre': return <Hash className="w-4 h-4" />;
      case 'liste': return <List className="w-4 h-4" />;
      case 'fichier': return <Paperclip className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const RubriqueComponent = ({ rubrique, onUpdate, onRemove, onAddSous }: {
    rubrique: Rubrique;
    onUpdate: (updates: Partial<Rubrique>) => void;
    onRemove: () => void;
    onAddSous: () => void;
  }) => (
    <div className="border border-gray-300 rounded-lg p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          {getTypeIcon(rubrique.type)}
          <input
            type="text"
            value={rubrique.champ}
            onChange={(e) => onUpdate({ champ: e.target.value })}
            placeholder="Nom de la rubrique"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        
        <select
          value={rubrique.type}
          onChange={(e) => onUpdate({ type: e.target.value as any })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 min-w-[140px]"
        >
          <option value="texte">📝 Texte</option>
          <option value="nombre">🔢 Nombre</option>
          <option value="liste">📋 Liste</option>
          <option value="fichier">📎 Fichier</option>
        </select>
        
        <div className="flex gap-2">
          <button
            onClick={onAddSous}
            className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
            style={{ backgroundColor: '#23A974' }}
          >
            <Plus className="w-4 h-4" />
            Sous
          </button>
          <button
            onClick={onRemove}
            className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Suppr.
          </button>
        </div>
      </div>

      {rubrique.type === 'liste' && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block font-medium text-gray-700 mb-3 text-sm">Options de la liste</label>
          <div className="space-y-2">
            {rubrique.options?.map((option) => (
              <div key={option.id} className="flex gap-2 items-start p-3 bg-white rounded-lg border border-gray-200">
                <input
                  type="text"
                  value={option.nom}
                  onChange={(e) => {
                    const updatedOptions = rubrique.options?.map(opt => 
                      opt.id === option.id ? { ...opt, nom: e.target.value } : opt
                    ) || [];
                    onUpdate({ options: updatedOptions });
                  }}
                  placeholder="Nom de l'option"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                />
                <select
                  value={option.type}
                  onChange={(e) => {
                    const updatedOptions = rubrique.options?.map(opt => 
                      opt.id === option.id ? { ...opt, type: e.target.value as any } : opt
                    ) || [];
                    onUpdate({ options: updatedOptions });
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100 min-w-[120px]"
                >
                  <option value="valeur">💭 Valeur</option>
                  <option value="sous-rubrique">📋 Sous-rub.</option>
                </select>
                <button
                  onClick={() => removeOption(rubrique.id, option.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => addOption(rubrique.id)}
              className="w-full px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
              style={{ backgroundColor: '#23A974' }}
            >
              <Plus className="w-4 h-4" />
              Ajouter une option
            </button>
          </div>
        </div>
      )}

      {rubrique.sousRubriques && rubrique.sousRubriques.length > 0 && (
        <div className="ml-6 mt-4 pl-4 border-l-2 border-blue-300">
          {rubrique.sousRubriques.map((sousRubrique) => (
            <RubriqueComponent
              key={sousRubrique.id}
              rubrique={sousRubrique}
              onUpdate={(updates) => updateRubrique(sousRubrique.id, updates)}
              onRemove={() => removeRubrique(sousRubrique.id)}
              onAddSous={() => addSousRubrique(sousRubrique.id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div 
      className="min-h-screen p-4 relative"
      style={{
        background: 'linear-gradient(135deg, #153258 0%, #23A974 100%)',
        minHeight: '100vh',
        overflow: 'auto'
      }}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(21, 50, 88, 0.7)' }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div 
            className="text-center py-6 px-6"
            style={{
              background: 'linear-gradient(to right, #153258, #23A974)'
            }}
          >
            <h1 className="text-2xl font-bold text-white mb-2">
              Créateur d'Impôts Dynamiques
            </h1>
            <p className="text-white opacity-90 text-sm">
              Créez des structures d'impôts avec des rubriques hiérarchiques
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`m-4 p-3 rounded-lg text-center font-medium ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="p-6 space-y-6 overflow-y-auto max-h-screen">
            {/* Informations de base */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#153258' }}>
                Informations de base
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Nom de l'impôt *</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex: Impôt foncier"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    style={{ 
                      borderColor: '#D1D5DB'
                    }}
                  />
                  {errors.nom && <div className="text-red-500 text-sm mt-1 p-2 bg-red-50 rounded border border-red-200">{errors.nom}</div>}
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Description de l'impôt"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                    style={{ 
                      borderColor: '#D1D5DB'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Rubriques */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#153258' }}>
                Rubriques du formulaire
              </h2>
              <div className="max-h-80 overflow-y-auto">
                {rubriques.length === 0 ? (
                  <div className="text-center p-8 text-gray-500 font-medium border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    Aucune rubrique ajoutée. Cliquez sur "Ajouter une rubrique" pour commencer.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rubriques.map((rubrique) => (
                      <RubriqueComponent
                        key={rubrique.id}
                        rubrique={rubrique}
                        onUpdate={(updates) => updateRubrique(rubrique.id, updates)}
                        onRemove={() => removeRubrique(rubrique.id)}
                        onAddSous={() => addSousRubrique(rubrique.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
              {errors.rubriques && <div className="text-red-500 text-sm mt-3 p-2 bg-red-50 rounded border border-red-200">{errors.rubriques}</div>}
              <div className="text-center mt-5">
                <button
                  onClick={addRubrique}
                  className="px-5 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
                  style={{ backgroundColor: '#23A974' }}
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une rubrique
                </button>
              </div>
            </div>

            {/* Configuration du calcul */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#153258' }}>
                Configuration du calcul
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Formule de calcul</label>
                  <input
                    type="text"
                    value={formule}
                    onChange={(e) => setFormule(e.target.value)}
                    placeholder="Ex: Montant = Superficie * taux_province"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    style={{ 
                      borderColor: '#D1D5DB'
                    }}
                  />
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-3" style={{ color: '#153258' }}>Paramètres de calcul</h3>
                  <div className="max-h-40 overflow-y-auto space-y-3">
                    {calculParams.map((param) => (
                      <div key={param.id} className="flex gap-3 items-center p-3 bg-white rounded-lg border border-gray-200">
                        <input
                          type="text"
                          value={param.nom}
                          onChange={(e) => updateCalculParam(param.id, 'nom', e.target.value)}
                          placeholder="Nom du paramètre"
                          className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                        />
                        <input
                          type="text"
                          value={param.valeur}
                          onChange={(e) => updateCalculParam(param.id, 'valeur', e.target.value)}
                          placeholder="Valeur"
                          className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                        />
                        <button
                          onClick={() => removeCalculParam(param.id)}
                          className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-4">
                    <button
                      onClick={addCalculParam}
                      className="px-5 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
                      style={{ backgroundColor: '#23A974' }}
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un paramètre
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={generateJson}
                className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-all flex items-center gap-2"
                style={{
                  background: 'linear-gradient(to right, #153258, #23A974)'
                }}
              >
                <Save className="w-5 h-5" />
                Générer JSON
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Réinitialiser
              </button>
            </div>

            {/* JSON Output */}
            {generatedJson && (
              <div 
                className="rounded-lg p-4 text-green-400 font-mono text-xs max-h-60 overflow-y-auto shadow-lg border"
                style={{ 
                  background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                  borderColor: '#374151'
                }}
              >
                <pre className="whitespace-pre-wrap leading-relaxed">{generatedJson}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}