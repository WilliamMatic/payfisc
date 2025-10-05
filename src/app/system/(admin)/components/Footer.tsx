export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-4">
      <div className="text-center">
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} PayFisc • 
          <span className="text-gray-400 mx-2">|</span>
          Tous droits réservés
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Version 1.0.0 • Système de gestion fiscale
        </p>
      </div>
    </footer>
  );
}