'use client'
import { useState, ChangeEvent, FormEvent } from "react";
import styles from '../styles/Login.module.css';
import { EyeIcon } from "./EyeIcon";
import { EyeOffIcon } from "./EyeOffIcon";
import Link from "next/link";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  isLoading: boolean;
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!credentials.email || !credentials.password) {
      return;
    }
    
    onSubmit(credentials);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <label htmlFor="email" className={styles.label}>Adresse email</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required 
          value={credentials.email} 
          onChange={handleChange} 
          className={styles.input} 
          placeholder="votre@email.com" 
          disabled={isLoading}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="password" className={styles.label}>Mot de passe</label>
        <div className={styles.passwordContainer}>
          <input 
            id="password" 
            name="password" 
            type={showPassword ? "text" : "password"} 
            required 
            value={credentials.password} 
            onChange={handleChange} 
            className={styles.input} 
            placeholder="Votre mot de passe" 
            disabled={isLoading}
          />
          <button 
            type="button" 
            className={styles.eyeButton} 
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? <EyeOffIcon className={styles.eyeIcon} /> : <EyeIcon className={styles.eyeIcon} />}
          </button>
        </div>
      </div>

      <div className={styles.optionsContainer}>
        <div className={styles.rememberMe}>
          <input 
            id="remember-me" 
            name="remember-me" 
            type="checkbox" 
            className={styles.checkbox} 
            disabled={isLoading}
          />
          <label htmlFor="remember-me" className={styles.rememberLabel}>Se souvenir de moi</label>
        </div>
        <div className={styles.forgotPassword}>
          <Link href="/system/forgot-password" className={styles.forgotLink}>
            Mot de passe oublié?
          </Link>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isLoading} 
        className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
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
    </form>
  );
};