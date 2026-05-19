"use client";

/**
 * /login — Phase 7.9-F native gecko form primitives + co-located CSS module.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import styles from "./page.module.css";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "th", name: "ไทย", flag: "🇹🇭" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");

  const currentLanguage = languages.find((l) => l.code === language) || languages[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (email && password) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className={styles.root}>
      {/* Left Panel - Branding (Desktop Only) */}
      <div className={styles.leftPane}>
        <div>
          <div className={styles.brand}>
            <Wrench size={40} />
            <span className={styles.brandName}>Gecko M&amp;R</span>
          </div>
          <p className={styles.tagline}>Equipment M&amp;R Made Simple</p>
        </div>

        <div className={styles.testimonial}>
          <blockquote className={styles.quote}>
            &quot;Gecko gave our depot crew the standards alignment we&apos;d been
            chasing on spreadsheets for years.&quot;
          </blockquote>
          <div className={styles.attribRow}>
            <div className={styles.avatarBubble}>TW</div>
            <div>
              <p className={styles.attribName}>Tan Wei Ming</p>
              <p className={styles.attribRole}>
                Yard Operations Manager, PSA-affiliated ICD, Singapore
              </p>
            </div>
          </div>
        </div>

        <div className={styles.decoration}>
          <div className={styles.decorationCircle} />
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className={styles.rightPane}>
        <div className={styles.formContainer}>
          {/* Mobile Logo */}
          <div className={styles.mobileLogo}>
            <Wrench size={32} className={styles.brandIcon} />
            <span className={styles.brandMobile}>Gecko M&amp;R</span>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.headerTitle}>Welcome back</h1>
            <p className={styles.headerSubtitle}>Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="gecko-alert gecko-alert-error mb-6" role="alert">
              {error}
            </div>
          )}

          {/* Form */}
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

            <div className="gecko-field">
              <label htmlFor="password" className="gecko-field-label">Password</label>
              <div className="gecko-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="gecko-input gecko-input-lg"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="gecko-input-affix"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="gecko-field-helper">Remember me</span>
              </label>
              <Link href="/forgot-password" className="gecko-btn-link">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="gecko-btn gecko-btn-primary gecko-btn-block"
              disabled={isLoading}
            >
              {isLoading && (
                <span
                  className="gecko-spinner gecko-spinner-sm gecko-spinner-white"
                  aria-hidden="true"
                />
              )}
              {isLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className={styles.noAccount}>
            Don&apos;t have an account?{" "}
            <span className={styles.noAccountLink}>Contact your administrator</span>
          </p>

          {/* Language Selector */}
          <div className={styles.langWrap}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`gecko-btn gecko-btn-ghost gecko-btn-sm ${styles.langTrigger}`}
                >
                  <Icon name="globe" size={16} />
                  {currentLanguage.flag} {currentLanguage.name}
                  <Icon name="chevronDown" size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                  >
                    <span>{lang.flag}</span>
                    {lang.name}
                    {language === lang.code && <Icon name="check" size={16} />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
