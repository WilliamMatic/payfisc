"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import styles from "../styles/Login.module.css";
import { EyeIcon } from "./EyeIcon";
import { EyeOffIcon } from "./EyeOffIcon";
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
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agentId, setAgentId] = useState<number | null>(null);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await requestPasswordReset(email);

      if (result.status === "success") {
        setStep(2);
        setSuccess(
          "Un code de vérification a été envoyé à votre adresse email."
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

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await verifyResetCode(email, code);

      if (result.status === "success") {
        // Changé ici - accédez à agent_id directement depuis result
        setAgentId(result.agent_id || null);
        setStep(3);
        setSuccess("Code vérifié avec succès.");
        console.log("Agent ID récupéré:", result.agent_id); // Pour debug
      } else {
        setError(result.message || "Code invalide");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Une erreur est survenue lors de la vérification du code");
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

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setIsLoading(false);
      return;
    }

    if (!agentId) {
      setError("Erreur de session. Veuillez recommencer le processus.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await resetPassword(agentId, code, newPassword);

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
      setError("Une erreur est survenue lors de la réinitialisation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await requestPasswordReset(email);

      if (result.status === "success") {
        setSuccess("Un nouveau code a été envoyé à votre adresse email.");
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

  const renderStepIndicator = () => (
    <div className={styles.stepIndicator}>
      <div className={`${styles.step} ${step >= 1 ? styles.active : ""}`}>
        <span>1</span>
        <p>Email</p>
      </div>
      <div className={styles.stepLine}></div>
      <div className={`${styles.step} ${step >= 2 ? styles.active : ""}`}>
        <span>2</span>
        <p>Code</p>
      </div>
      <div className={styles.stepLine}></div>
      <div className={`${styles.step} ${step >= 3 ? styles.active : ""}`}>
        <span>3</span>
        <p>Nouveau mot de passe</p>
      </div>
    </div>
  );

  return (
    <div className={styles.forgotPasswordContainer}>
      <div className={styles.forgotPasswordHeader}>
        <h2>Réinitialiser votre mot de passe</h2>
        <p>
          {step === 1 &&
            "Entrez votre adresse email pour recevoir un code de vérification"}
          {step === 2 &&
            "Entrez le code de vérification envoyé à votre adresse email"}
          {step === 3 && "Définissez votre nouveau mot de passe"}
        </p>
      </div>

      {renderStepIndicator()}

      {/* Messages d'erreur et de succès */}
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className={styles.successMessage}>
          <p>{success}</p>
        </div>
      )}

      <form
        onSubmit={
          step === 1
            ? handleSendCode
            : step === 2
            ? handleVerifyCode
            : handleResetPassword
        }
        className={styles.form}
      >
        {step === 1 && (
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="votre@email.com"
              disabled={isLoading}
            />
          </div>
        )}

        {step === 2 && (
          <div className={styles.inputGroup}>
            <label htmlFor="code" className={styles.label}>
              Code de vérification
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={styles.input}
              placeholder="Entrez le code reçu"
              disabled={isLoading}
              maxLength={6}
            />
            <div className={styles.codeHelp}>
              <p>
                Vous n'avez pas reçu le code?{" "}
                <button
                  type="button"
                  className={styles.resendLink}
                  onClick={handleResendCode}
                  disabled={isLoading}
                >
                  Renvoyer
                </button>
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <>
            <div className={styles.inputGroup}>
              <label htmlFor="newPassword" className={styles.label}>
                Nouveau mot de passe
              </label>
              <div className={styles.passwordContainer}>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Votre nouveau mot de passe (min. 6 caractères)"
                  disabled={isLoading}
                  minLength={6}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOffIcon className={styles.eyeIcon} />
                  ) : (
                    <EyeIcon className={styles.eyeIcon} />
                  )}
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirmer le mot de passe
              </label>
              <div className={styles.passwordContainer}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Confirmez votre mot de passe"
                  disabled={isLoading}
                  minLength={6}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className={styles.eyeIcon} />
                  ) : (
                    <EyeIcon className={styles.eyeIcon} />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        <div className={styles.formActions}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step === 2 ? 1 : 2)}
              className={styles.backButton}
              disabled={isLoading}
            >
              Retour
            </button>
          ) : (
            <button
              type="button"
              onClick={onBackToLogin}
              className={styles.backButton}
              disabled={isLoading}
            >
              Retour à la connexion
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`${styles.submitButton} ${
              isLoading ? styles.loading : ""
            }`}
          >
            {isLoading ? (
              <span>Chargement...</span>
            ) : (
              <span>
                {step === 1
                  ? "Envoyer le code"
                  : step === 2
                  ? "Vérifier le code"
                  : "Réinitialiser le mot de passe"}
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
