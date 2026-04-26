// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import styles from "../styles/Login.module.css";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

interface LoginCredentials {
  identifiant: string;
  password: string;
}

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated, userType, utilisateur, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read error from URL params (e.g. proxy redirect)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && userType) {
      if (userType === "agent") {
        router.push("/system/welcom/");
      } else if (userType === "utilisateur") {
        // Redirect based on user's first site tax
        const redirectByTax = async () => {
          if (utilisateur?.site_id) {
            try {
              const res = await fetch(
                `${API_BASE_URL}/site_taxe/lister_taxes_site.php?site_id=${utilisateur.site_id}`,
                { credentials: "include", headers: { "Content-Type": "application/json" } }
              );
              const data = await res.json();
              if (data.status === "success" && Array.isArray(data.data) && data.data.length > 0) {
                const firstTax = (data.data[0].taxe_nom || "").toLowerCase();
                if (firstTax.includes("patente")) {
                  router.push("/activity/patente/dashboard");
                  return;
                }
                if (firstTax.includes("embarquement")) {
                  router.push("/activity/embarquement/dashboard");
                  return;
                }
                if (firstTax.includes("stationnement")) {
                  router.push("/activity/stationnement/dashboard");
                  return;
                }
                if (firstTax.includes("assainissement")) {
                  router.push("/activity/assainissement/dashboard");
                  return;
                }
                if (firstTax.includes("environnement")) {
                  router.push("/activity/environnement/dashboard");
                  return;
                }
                if (firstTax.includes("foncier") || firstTax.includes("foncière")) {
                  router.push("/activity/foncier/dashboard");
                  return;
                }
              }
            } catch (e) {
              console.error("Erreur récupération taxes site:", e);
            }
          }
          // Default: immatriculation / plaque or fallback
          // router.push("/activity/speed/");
          router.push("/activity/dashboard/");
        };
        redirectByTax();
      }
    }
  }, [isAuthenticated, userType, authLoading, utilisateur, router]);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(
        credentials.identifiant,
        credentials.password
      );

      if (!result.success) {
        setError(result.message || "Identifiants incorrects");
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError("Une erreur est survenue lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loaderWrapper}>
          <div className={styles.spinner}></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Section gauche - Branding avec dégradé bleu/vert */}
      <div className={styles.brandSection}>
        <div className={styles.brandContent}>
          <div className={styles.logoWrapper}>
            <Image
              src="/logo.png"
              alt="Mpako Logo"
              width={70}
              height={70}
              priority
              className={styles.logo}
            />
            <h1 className={styles.brandTitle}>Mpako</h1>
          </div>
          
          <div className={styles.brandDescription}>
            <h2>Gestion des recettes nationales & internationales</h2>
            <p>Plateforme officielle de gestion fiscale et de recouvrement des recettes</p>
          </div>

          <div className={styles.statsCards}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>300+</span>
              <span className={styles.statLabel}>Recettes gérées</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>98%</span>
              <span className={styles.statLabel}>Taux de satisfaction</span>
            </div>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💰</div>
              <div>
                <h3>Recouvrement efficace</h3>
                <p>Collecte rapide et sécurisée des recettes</p>
              </div>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <div>
                <h3>Suivi en temps réel</h3>
                <p>Consultez l'état de vos dossiers</p>
              </div>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💳</div>
              <div>
                <h3>Paiement sécurisé</h3>
                <p>Réglez vos taxes en ligne</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section droite - Formulaire */}
      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          <div className={styles.mobileBrand}>
            <Image
              src="/logo.png"
              alt="Mpako Logo"
              width={40}
              height={40}
              className={styles.mobileLogo}
            />
            <h2>Mpako</h2>
          </div>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Content de vous revoir</h2>
            <p className={styles.formSubtitle}>
              Connectez-vous pour accéder à votre espace personnel
            </p>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

          <div className={styles.formFooter}>
            <p className={styles.footerNote}>
              En vous connectant, vous acceptez nos{" "}
              <a href="#" className={styles.footerLink}>conditions générales</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}