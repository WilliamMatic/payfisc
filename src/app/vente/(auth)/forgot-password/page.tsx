'use client'
import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Login.module.css';
import { ForgotPasswordForm } from '../components/ForgotPassword';
import { StarsBackground } from '../components/StarsBackground';

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);

  const handleBackToLogin = () => {
    window.location.href = '/system/login';
  };

  return (
    <>
      <Head>
        <title>Mot de passe oublié - PayFisc</title>
      </Head>

      <div className={styles.container}>
        <StarsBackground />
        <div className={styles.overlay}></div>
        <div className={styles.content}>
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.logoContainer}>
                <Image src="/logo.png" alt="PayFisc Logo" width={80} height={80} priority className={styles.logoImage} />
              </div>
              <p className={styles.subtitle}>Gestion des paiements fiscaux</p>
            </div>

            <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
          </div>

          <div className={styles.copyright}>
            <p>© {new Date().getFullYear()} PayFisc. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </>
  );
}