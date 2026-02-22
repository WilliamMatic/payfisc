// components/LoginForm.tsx
'use client';

import { useState, ChangeEvent, FormEvent } from "react";
import styles from '../styles/Login.module.css';
import Link from "next/link";

interface LoginCredentials {
  identifiant: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  isLoading: boolean;
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({ 
    identifiant: '', 
    password: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!credentials.identifiant || !credentials.password) return;
    onSubmit(credentials);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <div className={styles.inputGroup}>
        <label 
          htmlFor="identifiant" 
          className={`${styles.label} ${focusedField === 'identifiant' ? styles.labelFocused : ''}`}
        >
          Identifiant
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="identifiant"
            name="identifiant"
            type="text"
            required
            value={credentials.identifiant}
            onChange={handleChange}
            onFocus={() => setFocusedField('identifiant')}
            onBlur={() => setFocusedField(null)}
            className={styles.input}
            placeholder="Email ou numéro de téléphone"
            disabled={isLoading}
          />
          <span className={styles.inputFocusRing}></span>
        </div>
        <p className={styles.inputHint}>
          Agent: email • Utilisateur: téléphone
        </p>
      </div>

      <div className={styles.inputGroup}>
        <label 
          htmlFor="password" 
          className={`${styles.label} ${focusedField === 'password' ? styles.labelFocused : ''}`}
        >
          Mot de passe
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            value={credentials.password}
            onChange={handleChange}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            className={styles.input}
            placeholder="••••••••"
            disabled={isLoading}
          />
          <button
            type="button"
            className={styles.eyeButton}
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
          <span className={styles.inputFocusRing}></span>
        </div>
      </div>

      <div className={styles.formOptions}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" className={styles.checkbox} disabled={isLoading} />
          <span>Se souvenir de moi</span>
        </label>
        <Link href="/system/forgot-password" className={styles.forgotLink}>
          Mot de passe oublié?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={styles.submitButton}
      >
        {isLoading ? (
          <>
            <span className={styles.buttonSpinner}></span>
            Connexion...
          </>
        ) : (
          'Se connecter'
        )}
      </button>

      <div className={styles.loginInfo}>
        <div className={styles.infoBadge}>
          <span className={styles.badge} style={{ background: '#153258' }}>Agent</span>
          <span>email@exemple.com</span>
        </div>
        <div className={styles.infoBadge}>
          <span className={styles.badge} style={{ background: '#23A974' }}>User</span>
          <span>243 XX XXX XXXX</span>
        </div>
      </div>
    </form>
  );
};