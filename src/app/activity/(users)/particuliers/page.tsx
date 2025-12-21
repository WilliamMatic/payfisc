"use client";
import {
  getParticuliers,
  Particulier as ParticulierType,
  PaginationResponse,
} from "@/services/particuliers/particulierService";
import ParticuliersClient from "./components/ParticulierClient";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

// Composant Loader professionnel avec charte graphique
const ProfessionalLoader = () => {
  return (
    <div className="loader-overlay">
      {/* Arrière-plan flouté */}
      <div className="backdrop-blur"></div>
      
      <div className="loader-container">
        {/* Logo de l'application */}
        <div className="loader-logo">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="28" fill="url(#gradient)" stroke="white" strokeWidth="2"/>
            <path d="M25 22L30 27L35 22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="30" cy="38" r="3" fill="white"/>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0070F3" />
                <stop offset="100%" stopColor="#00B4D8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Animation principale */}
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-center">
            <div className="spinner-inner"></div>
          </div>
        </div>
        
        {/* Texte avec animation */}
        <div className="loader-text">
          <span className="loader-title">Chargement des particuliers</span>
          <span className="loading-dots">
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </span>
        </div>
        
        {/* Barre de progression */}
        <div className="progress-container">
          <div className="progress-track">
            <div className="progress-indicator"></div>
          </div>
        </div>
        
        {/* Message d'information */}
        <p className="loader-subtitle">
          Récupération des données en cours
        </p>
      </div>
      
      <style jsx>{`
        .loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease-out;
        }
        
        .backdrop-blur {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        
        .loader-container {
          position: relative;
          background: rgba(255, 255, 255, 0.95);
          padding: 2.5rem;
          border-radius: 16px;
          box-shadow: 
            0 10px 40px rgba(0, 112, 243, 0.15),
            0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: center;
          min-width: 320px;
          max-width: 400px;
          border: 1px solid rgba(0, 112, 243, 0.1);
          z-index: 1;
        }
        
        .loader-logo {
          margin-bottom: 1.5rem;
          animation: pulse 2s ease-in-out infinite;
        }
        
        .spinner {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
        }
        
        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            #0070F3 20%,
            transparent 30%
          );
          animation: rotate 1.8s linear infinite;
          filter: drop-shadow(0 4px 12px rgba(0, 112, 243, 0.3));
        }
        
        .spinner-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .spinner-inner {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #0070F3, #00B4D8);
          border-radius: 50%;
          animation: scale 1.5s ease-in-out infinite alternate;
        }
        
        .loader-text {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-bottom: 1.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .loader-title {
          color: #0070F3;
        }
        
        .loading-dots {
          display: inline-flex;
          align-items: flex-end;
          height: 1em;
          margin-left: 4px;
        }
        
        .dot {
          animation: bounce 1.4s infinite ease-in-out both;
          font-size: 1.5rem;
          line-height: 0;
          color: #0070F3;
        }
        
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        .dot:nth-child(3) { animation-delay: 0s; }
        
        .progress-container {
          width: 100%;
          margin: 1.5rem 0;
        }
        
        .progress-track {
          width: 100%;
          height: 6px;
          background: #e6f2ff;
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }
        
        .progress-indicator {
          position: absolute;
          height: 100%;
          width: 40%;
          background: linear-gradient(90deg, 
            #0070F3 0%,
            #00B4D8 50%,
            #0070F3 100%
          );
          border-radius: 3px;
          animation: progress 2s ease-in-out infinite;
        }
        
        .loader-subtitle {
          color: #666;
          font-size: 0.875rem;
          margin-top: 1rem;
          opacity: 0.8;
          font-weight: 400;
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes scale {
          0% { transform: scale(0.8); opacity: 0.7; }
          100% { transform: scale(1.1); opacity: 1; }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: translateY(0);
            opacity: 0.6;
          }
          40% { 
            transform: translateY(-6px);
            opacity: 1;
          }
        }
        
        @keyframes progress {
          0% { 
            transform: translateX(-100%);
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
          100% { 
            transform: translateX(250%);
            opacity: 0.6;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
        
        @keyframes fadeIn {
          from { 
            opacity: 0;
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default function ParticuliersPage() {
  const { utilisateur, isLoading: authLoading } = useAuth();
  const [particuliers, setParticuliers] = useState<ParticulierType[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadParticuliers() {
      try {
        setLoading(true);
        const utilisateurId = utilisateur?.id;
        const result = await getParticuliers(1, 10, utilisateurId);

        if (result.status === "success" && result.data) {
          const filteredParticuliers = (result.data.particuliers || []).filter(
            (particulier: ParticulierType | null | undefined): particulier is ParticulierType =>
              particulier !== null && particulier !== undefined
          );
          setParticuliers(filteredParticuliers);
          setPagination(result.data.pagination || pagination);
        } else if (result.status === "error") {
          setError(result.message ?? "Erreur inconnue");
        }
      } catch (error) {
        console.error("Error loading particuliers:", error);
        setError("Erreur lors du chargement des particuliers");
      } finally {
        // Petit délai pour éviter le flash du loader
        setTimeout(() => setLoading(false), 500);
      }
    }

    if (!authLoading) {
      loadParticuliers();
    }
  }, [utilisateur, authLoading]);

  if (authLoading || loading) {
    return <ProfessionalLoader />;
  }

  return (
    <ParticuliersClient
      initialParticuliers={particuliers}
      initialError={error}
      initialPagination={pagination}
    />
  );
}