export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white py-4">
      <div className="text-center">
        <p className="text-sm opacity-90">
          © {new Date().getFullYear()} PayFisc. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
