// components/ForgotPasswordForm.tsx
"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import styles from "../styles/ForgotPassword.module.css"; // Nouveau fichier CSS dédié
import {
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from "../../../services/auth/authService";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

type Step = 1 | 2 | 3;

export const ForgotPasswordForm = ({
  onBackToLogin,
}: ForgotPasswordFormProps) => {
  const [step, setStep] = useState<Step>(1);
  const [identifiant, setIdentifiant] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState<'agent' | 'utilisateur' | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Timer pour le renvoi de code
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await requestPasswordReset(identifiant);

      if (result.status === "success") {
        setStep(2);
        setResendTimer(60);
        setSuccess(
          "Un code de vérification a été envoyé"
        );
      } else {
        setError(result.message || "Erreur lors de l'envoi du code");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Une erreur est survenue lors de l'envoi du code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus suivant
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError("Veuillez entrer le code complet à 6 chiffres");
      setIsLoading(false);
      return;
    }

    try {
      const result = await verifyResetCode(identifiant, fullCode);

      if (result.status === "success") {
        setUserId(result.agent_id || result.utilisateur_id || null);
        setUserType(result.user_type || null);
        setStep(3);
        setSuccess("Code vérifié avec succès");
      } else {
        setError(result.message || "Code invalide");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Une erreur est survenue lors de la vérification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validation des mots de passe
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      setIsLoading(false);
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError("Le mot de passe doit contenir au moins une majuscule");
      setIsLoading(false);
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError("Le mot de passe doit contenir au moins un chiffre");
      setIsLoading(false);
      return;
    }

    if (!userId || !userType) {
      setError("Erreur de session. Veuillez recommencer");
      setIsLoading(false);
      return;
    }

    try {
      const fullCode = code.join('');
      const result = await resetPassword(userId, userType, fullCode, newPassword);

      if (result.status === "success") {
        setSuccess("Mot de passe réinitialisé avec succès!");
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      } else {
        setError(result.message || "Erreur lors de la réinitialisation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await requestPasswordReset(identifiant);

      if (result.status === "success") {
        setResendTimer(60);
        setSuccess("Un nouveau code a été envoyé");
      } else {
        setError(result.message || "Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour déterminer le type d'identifiant
  const getIdentifiantType = (identifiant: string): 'email' | 'telephone' => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s\-\(\)]{8,20}$/;
    
    if (emailRegex.test(identifiant)) return 'email';
    if (phoneRegex.test(identifiant)) return 'telephone';
    return 'email';
  };

  const identifiantType = getIdentifiantType(identifiant);

  return (
    <div className={styles.container}>
      {/* Header avec icône */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 className={styles.title}>Mot de passe oublié ?</h2>
        <p className={styles.subtitle}>
          {step === 1 && "Recevez un code de vérification"}
          {step === 2 && "Vérifions votre identité"}
          {step === 3 && "Créez un nouveau mot de passe"}
        </p>
      </div>

      {/* Steps progress */}
      <div className={styles.steps}>
        <div className={`${styles.step} ${step >= 1 ? styles.active : ''} ${step > 1 ? styles.completed : ''}`}>
          <div className={styles.stepNumber}>
            {step > 1 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <span>1</span>
            )}
          </div>
          <span className={styles.stepLabel}>Identifiant</span>
        </div>
        <div className={styles.stepLine}></div>
        <div className={`${styles.step} ${step >= 2 ? styles.active : ''} ${step > 2 ? styles.completed : ''}`}>
          <div className={styles.stepNumber}>
            {step > 2 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <span>2</span>
            )}
          </div>
          <span className={styles.stepLabel}>Code</span>
        </div>
        <div className={styles.stepLine}></div>
        <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
          <div className={styles.stepNumber}>
            <span>3</span>
          </div>
          <span className={styles.stepLabel}>Nouveau mot de passe</span>
        </div>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className={`${styles.message} ${error ? styles.error : styles.success}`}>
          {error ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          )}
          <p>{error || success}</p>
        </div>
      )}

      <form onSubmit={
          step === 1
            ? handleSendCode
            : step === 2
            ? handleVerifyCode
            : handleResetPassword
        } 
        className={styles.form}
      >
        {/* Étape 1 - Identifiant */}
        {step === 1 && (
          <div className={styles.field}>
            <label htmlFor="identifiant" className={styles.label}>
              {identifiantType === 'email' ? 'Adresse email' : 'Numéro de téléphone'}
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="identifiant"
                type={identifiantType === 'email' ? 'email' : 'tel'}
                required
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                onFocus={() => setFocusedField('identifiant')}
                onBlur={() => setFocusedField(null)}
                className={styles.input}
                placeholder={identifiantType === 'email' ? "exemple@email.com" : "+243 00 000 0000"}
                disabled={isLoading}
              />
            </div>
            <div className={styles.hint}>
              <span className={`${styles.hintBadge} ${identifiantType === 'email' ? styles.active : ''}`}>
                <span className={styles.hintDot}></span>
                Agents: utilisez votre email professionnel
              </span>
              <span className={`${styles.hintBadge} ${identifiantType === 'telephone' ? styles.active : ''}`}>
                <span className={styles.hintDot}></span>
                Utilisateurs: utilisez votre téléphone
              </span>
            </div>
          </div>
        )}

        {/* Étape 2 - Code de vérification */}
        {step === 2 && (
          <div className={styles.field}>
            <label className={styles.label}>
              Code de vérification
            </label>
            <div className={styles.codeGrid}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className={styles.codeInput}
                  disabled={isLoading}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <div className={styles.codeHelp}>
              <p>Code envoyé à {identifiantType === 'email' ? 'votre email' : 'votre téléphone'}</p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading || resendTimer > 0}
                className={styles.resendButton}
              >
                {resendTimer > 0 ? (
                  <>Renvoyer dans {resendTimer}s</>
                ) : (
                  'Renvoyer le code'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Étape 3 - Nouveau mot de passe */}
        {step === 3 && (
          <>
            <div className={styles.field}>
              <label htmlFor="newPassword" className={styles.label}>
                Nouveau mot de passe
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setFocusedField('newPassword')}
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
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirmer le mot de passe
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  className={styles.input}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Indicateur de force */}
            {newPassword && (
              <div className={styles.strengthMeter}>
                <div className={styles.strengthBars}>
                  <div className={`${styles.strengthBar} ${newPassword.length >= 8 ? styles.active : ''}`}></div>
                  <div className={`${styles.strengthBar} ${/[A-Z]/.test(newPassword) ? styles.active : ''}`}></div>
                  <div className={`${styles.strengthBar} ${/[0-9]/.test(newPassword) ? styles.active : ''}`}></div>
                </div>
                <p className={styles.strengthText}>
                  {newPassword.length < 8 && "Minimum 8 caractères"}
                  {newPassword.length >= 8 && !/[A-Z]/.test(newPassword) && "Ajoutez une majuscule"}
                  {newPassword.length >= 8 && /[A-Z]/.test(newPassword) && !/[0-9]/.test(newPassword) && "Ajoutez un chiffre"}
                  {newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && "Mot de passe fort ✓"}
                </p>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={step === 1 ? onBackToLogin : () => setStep(step === 2 ? 1 : 2)}
            className={styles.backButton}
            disabled={isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Retour
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Chargement...
              </>
            ) : (
              <>
                {step === 1 && "Envoyer le code"}
                {step === 2 && "Vérifier le code"}
                {step === 3 && "Réinitialiser"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};