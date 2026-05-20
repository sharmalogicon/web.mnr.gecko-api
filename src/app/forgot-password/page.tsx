"use client";

/**
 * /forgot-password — Phase 7.9-F native gecko form primitives + module CSS.
 */

import { useState } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

import styles from "./page.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <div className={styles.root}>
      <div className={styles.wrap}>
        <div className={styles.brand}>
          <Wrench size={32} className={styles.brandIcon} />
          <span className={styles.brandName}>Gecko M&amp;R</span>
        </div>

        <div className="gecko-card">
          <div className={styles.cardInner}>
            {!isSubmitted ? (
              <>
                <div className={styles.head}>
                  <h1 className={styles.headTitle}>Forgot password?</h1>
                  <p className={styles.headSubtitle}>
                    Enter your email to receive a reset link
                  </p>
                </div>

                {error && (
                  <div className="gecko-alert gecko-alert-error mb-6" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="gecko-field">
                    <label htmlFor="email" className="gecko-field-label">Email</label>
                    <input
                      id="email"
                      type="email"
                      className="gecko-input gecko-input-lg"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <button
                    type="submit"
                    className="gecko-btn gecko-btn-primary gecko-btn-sm gecko-btn-block"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <span
                        className="gecko-spinner gecko-spinner-sm gecko-spinner-white"
                        aria-hidden="true"
                      />
                    )}
                    {isLoading ? "Sending reset link…" : "Send Reset Link"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className={styles.successIcon}>
                  <Icon name="mail" size={32} />
                </div>
                <h1 className={styles.headTitle}>Check your email</h1>
                <p className={styles.headSubtitle}>We&apos;ve sent a password reset link to</p>
                <p className={styles.emailHighlight}>{email}</p>

                <div className="mt-8 flex flex-col gap-4">
                  <p className="gecko-field-helper">Didn&apos;t receive the email?</p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => setIsLoading(false), 1500);
                      }}
                      disabled={isLoading}
                      className="gecko-btn gecko-btn-outline gecko-btn-sm"
                    >
                      {isLoading && (
                        <span
                          className="gecko-spinner gecko-spinner-sm"
                          aria-hidden="true"
                        />
                      )}
                      Resend
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="gecko-btn gecko-btn-outline gecko-btn-sm"
                    >
                      Try different email
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <Link href="/login" className={styles.backLink}>
                <Icon name="arrowLeft" size={16} />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
