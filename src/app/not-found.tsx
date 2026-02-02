import { Home, MoveRight } from 'lucide-react'
import BackButton from './_components/ui/BackButton'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Animation d'icône */}
        <div className="mb-8">
          <div className="relative inline-flex opacity-100 scale-100">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-blue-200 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                </div>
                <MoveRight className="w-6 h-6 text-blue-600 absolute -right-1 -top-1 transform rotate-45" />
              </div>
            </div>
          </div>
        </div>
        {/* Contenu */}
        <div className="mb-8 opacity-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Page introuvable
          </h1>
          <p className="text-gray-600 mb-4">
            Nous avons cherché partout, mais cette page semble avoir disparu.
          </p>
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
            <span className="text-sm text-gray-500">Erreur</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <code className="text-sm text-gray-700 font-medium">404</code>
          </div>
        </div>
        {/* Bouton de navigation */}
        <div className="flex justify-center">
          <BackButton />
        </div>
      </div>
    </div>
  )
}