"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wrench, Eye, EyeOff, Loader2, Globe, ChevronDown, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For demo, accept any credentials
    if (email && password) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (Desktop Only) */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{
          background:
            "linear-gradient(to bottom right, var(--gecko-primary-600), var(--gecko-primary-800))",
          color: "var(--gecko-text-inverse)",
        }}
      >
        {/* Logo & Tagline */}
        <div>
          <div className="flex items-center gap-3">
            <Wrench className="h-10 w-10" />
            <span
              className="text-2xl"
              style={{ fontWeight: "var(--gecko-font-weight-bold)" }}
            >
              logicon-mnr
            </span>
          </div>
          <p
            className="mt-2"
            style={{
              color: "color-mix(in srgb, var(--gecko-text-inverse) 80%, transparent)",
            }}
          >
            Equipment M&R Made Simple
          </p>
        </div>

        {/* Testimonial */}
        <div className="max-w-md">
          <blockquote
            className="text-xl leading-relaxed"
            style={{ fontWeight: "var(--gecko-font-weight-medium)" }}
          >
            &quot;logicon-mnr has transformed how we manage our depot operations.
            Survey times reduced by 40% and billing errors virtually eliminated.&quot;
          </blockquote>
          <div className="mt-6 flex items-center gap-4">
            <div
              className="h-12 w-12 flex items-center justify-center"
              style={{
                background:
                  "color-mix(in srgb, var(--gecko-text-inverse) 20%, transparent)",
                borderRadius: "var(--gecko-radius-full)",
                fontWeight: "var(--gecko-font-weight-semibold)",
              }}
            >
              SP
            </div>
            <div>
              <p style={{ fontWeight: "var(--gecko-font-weight-medium)" }}>
                Somchai Prasert
              </p>
              <p
                className="text-sm"
                style={{
                  color:
                    "color-mix(in srgb, var(--gecko-text-inverse) 70%, transparent)",
                }}
              >
                Operations Manager, CMA CGM Thailand
              </p>
            </div>
          </div>
        </div>

        {/* Decorative */}
        <div className="opacity-10">
          <div
            className="w-64 h-64 absolute bottom-10 -left-20"
            style={{
              borderRadius: "var(--gecko-radius-full)",
              border: "20px solid var(--gecko-text-inverse)",
            }}
          />
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24"
        style={{ background: "var(--gecko-bg-surface)" }}
      >
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Wrench
              className="h-8 w-8"
              style={{ color: "var(--gecko-primary-600)" }}
            />
            <span
              className="text-xl"
              style={{ fontWeight: "var(--gecko-font-weight-bold)" }}
            >
              logicon-mnr
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-2xl"
              style={{
                color: "var(--gecko-text-primary)",
                fontWeight: "var(--gecko-font-weight-bold)",
              }}
            >
              Welcome back
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--gecko-text-secondary)" }}
            >
              Sign in to your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="gecko-alert gecko-alert-error mb-6 flex items-start gap-3">
              <AlertCircle
                className="h-5 w-5 flex-shrink-0 mt-0.5"
                style={{ color: "var(--gecko-error-600)" }}
              />
              <div>
                <p
                  className="text-sm"
                  style={{ fontWeight: "var(--gecko-font-weight-medium)" }}
                >
                  Login failed
                </p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--gecko-text-disabled)" }}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked as boolean)}
                />
                <span
                  className="text-sm"
                  style={{ color: "var(--gecko-text-secondary)" }}
                >
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm"
                style={{ color: "var(--gecko-text-link)" }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>


          {/* No Account */}
          <p
            className="mt-8 text-center text-sm"
            style={{ color: "var(--gecko-text-secondary)" }}
          >
            Don&apos;t have an account?{" "}
            <span style={{ color: "var(--gecko-primary-600)" }}>
              Contact your administrator
            </span>
          </p>

          {/* Language Selector */}
          <div className="mt-6 flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ color: "var(--gecko-text-secondary)" }}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {currentLanguage.flag} {currentLanguage.name}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                    {language === lang.code && <Check className="ml-auto h-4 w-4" />}
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
