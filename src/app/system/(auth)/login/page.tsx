// app/login/page.tsx - Corrections
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "../styles/Login.module.css";
import { LoginForm } from "../components/LoginForm";
import { StarsBackground } from "../components/StarsBackground";
import { useAuth } from "../../../contexts/AuthContext";

interface LoginCredentials {
  identifiant: string;
  password: string;
}

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirection si déjà authentifié - SEULEMENT au chargement initial
  useEffect(() => {
    if (!authLoading && isAuthenticated && userType) {
      if (userType === "agent") {
        router.push("/system/welcom/");
      } else if (userType === "utilisateur") {
        router.push("/activity/speed/");
      }
    }
  }, [isAuthenticated, userType, authLoading, router]);

  // Année courante (client-side only)
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(
        credentials.identifiant,
        credentials.password
      );

      if (result.success) {
        // Ne pas rediriger ici, la redirection se fera via l'effet ci-dessus
        // car l'état d'authentification va être mis à jour
      } else {
        setError(result.message || "Identifiants incorrects");
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError("Une erreur est survenue lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un loader pendant le chargement initial
  if (authLoading) {
    return (
      <div className={styles.container}>
        <StarsBackground />
        <div className={styles.overlay}></div>
        <div className={styles.content}>
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si déjà authentifié, afficher un message de redirection
  if (isAuthenticated && userType) {
    return (
      <div className={styles.container}>
        <StarsBackground />
        <div className={styles.overlay}></div>
        <div className={styles.content}>
          <div className={styles.card}>
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <p>Redirection en cours...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <StarsBackground />
      <div className={styles.overlay}></div>

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logoContainer}>
              <Image
                src="/logo.png"
                alt="Mpako Logo"
                width={80}
                height={80}
                priority
                className={styles.logoImage}
              />
            </div>
            <p className={styles.subtitle}>
              Plateforme de gestion fiscale
            </p>
          </div>

          <div className={styles.formContainer}>
            {error && (
              <div className={styles.errorMessage}>
                <svg
                  className={styles.errorIcon}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoading}
            />
          </div>

          {isLoading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <p>Connexion en cours...</p>
            </div>
          )}
        </div>

        <div className={styles.copyright}>
          {year && (
            <p>
              © {year} Mpako. Tous droits réservés.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}