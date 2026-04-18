'use client'
import { useState } from 'react';
import Image from 'next/image';
import styles from '../styles/Login.module.css';
import { ForgotPasswordForm } from '../components/ForgotPassword';

export default function ForgotPassword() {
  const handleBackToLogin = () => {
    window.location.href = '/system/login';
  };

  return (
    <div className={styles.container}>
      {/* Section gauche - Branding (même que login) */}
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
                <p>Consultez l&apos;état de vos dossiers</p>
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
            <h2 className={styles.formTitle}>Mot de passe oublié</h2>
            <p className={styles.formSubtitle}>
              Récupérez l&apos;accès à votre compte
            </p>
          </div>

          <ForgotPasswordForm onBackToLogin={handleBackToLogin} />

          <div className={styles.formFooter}>
            <p className={styles.footerNote}>
              Vous vous souvenez ?{" "}
              <a href="/system/login" className={styles.footerLink}>
                Retour à la connexion
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}