'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Login.module.css';
import { LoginForm } from '../components/LoginForm';
import { StarsBackground } from '../components/StarsBackground';
import { useAuth } from '../../../contexts/AuthContext';

interface LoginCredentials {
  email: string;
  password: string;
}

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirection si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      router.push('/system/welcom/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await login(credentials.email, credentials.password);
      
      if (result.success) {
        console.log('Connexion réussie');
        router.push('/system/welcom/');
      } else {
        setError(result.message || 'Email ou mot de passe incorrect');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Connexion - PayFisc</title>
        <meta name="description" content="Connectez-vous à votre compte PayFisc pour gérer vos paiements fiscaux" />
      </Head>

      <div className={styles.container}>
        <StarsBackground />
        <div className={styles.overlay}></div>
        <div className={styles.content}>
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.logoContainer}>
                <Image
                  src="/logo.png"
                  alt="PayFisc Logo"
                  width={80}
                  height={80}
                  priority
                  className={styles.logoImage}
                />
              </div>
              {/* <h1 className={styles.title}>PayFisc</h1> */}
              <p className={styles.subtitle}>Gestion des paiements fiscaux</p>
            </div>

            <div className={styles.formContainer}>
              {error && (
                <div className={styles.errorMessage}>
                  <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
            </div>

            {isLoading && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner}></div>
                <p>Connexion en cours...</p>
              </div>
            )}
          </div>

          <div className={styles.copyright}>
            <p>© {new Date().getFullYear()} PayFisc. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </>
  );
}