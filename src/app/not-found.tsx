import { Home, SearchX } from 'lucide-react'
import Link from 'next/link'
import BackButton from './_components/ui/BackButton'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Illustration */}
        <div className="mb-8">
          <div className="relative inline-flex">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center">
              <SearchX className="w-11 h-11 text-blue-600" />
            </div>
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              404
            </span>
          </div>
        </div>

        {/* Contenu */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Page introuvable
          </h1>
          <p className="text-gray-500 leading-relaxed">
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Home size={16} />
            Accueil
          </Link>
          <BackButton />
        </div>
      </div>
    </div>
  )
}