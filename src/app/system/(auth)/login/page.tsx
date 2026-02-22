// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "../styles/Login.module.css";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../../../contexts/AuthContext";

interface LoginCredentials {
  identifiant: string;
  password: string;
}

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated && userType) {
      if (userType === "agent") {
        router.push("/system/welcom/");
      } else if (userType === "utilisateur") {
        router.push("/activity/speed/");
      }
    }
  }, [isAuthenticated, userType, authLoading, router]);

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
            <h2>Gestion des plaques minéralogiques</h2>
            <p>Plateforme officielle d'immatriculation des motos et gestion des taxes</p>
          </div>

          <div className={styles.statsCards}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>5000+</span>
              <span className={styles.statLabel}>Motos immatriculées</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>98%</span>
              <span className={styles.statLabel}>Taux de satisfaction</span>
            </div>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🏍️</div>
              <div>
                <h3>Immatriculation rapide</h3>
                <p>Traitement express de vos demandes</p>
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