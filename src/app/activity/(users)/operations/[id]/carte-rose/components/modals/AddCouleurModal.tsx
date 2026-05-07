"use client";
import { useState, useEffect } from "react";
import { X, Loader, Plus } from "lucide-react";

interface AddCouleurModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (nom: string, codeHex: string) => Promise<void>;
  defaultNom?: string;
}

export default function AddCouleurModal({
  isOpen,
  onClose,
  onAdd,
  defaultNom = "",
}: AddCouleurModalProps) {
  const [nom, setNom] = useState("");
  const [codeHex, setCodeHex] = useState("#000000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNom(defaultNom);
      setCodeHex("#000000");
    }
  }, [isOpen, defaultNom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd(nom, codeHex);
      setNom("");
      setCodeHex("#000000");
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la couleur:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Ajouter une nouvelle couleur
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Nom de la couleur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Rouge vif, Bleu nuit..."
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Code couleur <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                value={codeHex}
                onChange={(e) => setCodeHex(e.target.value)}
                className="w-12 h-12 cursor-pointer rounded-lg border border-gray-300"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={codeHex}
                  onChange={(e) => setCodeHex(e.target.value)}
                  placeholder="#000000"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  title="Code hexadécimal (ex: #FF0000)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Code hexadécimal (ex: #FF0000 pour rouge)
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-semibold"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !nom.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter la couleur
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
