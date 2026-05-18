"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench, ArrowLeft, Loader2, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--gecko-bg-subtle)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
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

        <div className="gecko-card p-8">
          {!isSubmitted ? (
            <>
              {/* Form */}
              <div className="text-center mb-8">
                <h1
                  className="text-2xl"
                  style={{
                    color: "var(--gecko-text-primary)",
                    fontWeight: "var(--gecko-font-weight-bold)",
                  }}
                >
                  Forgot password?
                </h1>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--gecko-text-secondary)" }}
                >
                  Enter your email to receive a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div
                  className="mx-auto w-16 h-16 flex items-center justify-center mb-6"
                  style={{
                    background: "var(--gecko-success-100)",
                    borderRadius: "var(--gecko-radius-full)",
                  }}
                >
                  <Mail
                    className="h-8 w-8"
                    style={{ color: "var(--gecko-success-600)" }}
                  />
                </div>
                <h1
                  className="text-2xl"
                  style={{
                    color: "var(--gecko-text-primary)",
                    fontWeight: "var(--gecko-font-weight-bold)",
                  }}
                >
                  Check your email
                </h1>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--gecko-text-secondary)" }}
                >
                  We&apos;ve sent a password reset link to
                </p>
                <p
                  style={{
                    color: "var(--gecko-text-primary)",
                    fontWeight: "var(--gecko-font-weight-medium)",
                  }}
                >
                  {email}
                </p>

                <div className="mt-8 space-y-4">
                  <p
                    className="text-sm"
                    style={{ color: "var(--gecko-text-secondary)" }}
                  >
                    Didn&apos;t receive the email?
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => setIsLoading(false), 1500);
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Resend
                    </Button>
                    <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                      Try different email
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm"
              style={{ color: "var(--gecko-text-link)" }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
