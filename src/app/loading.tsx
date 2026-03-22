export default function RootLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        {/* Logo animé */}
        <div className="mb-10">
          <div className="relative inline-flex">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              {/* Spinner */}
              <div className="w-10 h-10 border-[3px] border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 w-20 h-20 bg-blue-200/30 rounded-2xl animate-ping" />
          </div>
        </div>

        {/* Texte */}
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Chargement en cours
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          Veuillez patienter un instant…
        </p>

        {/* Barre de progression */}
        <div className="mx-auto max-w-[200px] h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>

        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(50%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    </div>
  );
}
