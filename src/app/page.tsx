"use client";

import Link from "next/link";
import {
  Wrench,
  ArrowRight,
  Play,
  Search,
  Droplets,
  MapPin,
  Package,
  DollarSign,
  Globe,
  ChevronDown,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const features = [
  {
    icon: Search,
    title: "Survey & Inspection",
    description: "Digital checklists, photo capture, and instant report generation for all equipment types.",
  },
  {
    icon: Wrench,
    title: "Repair Management",
    description: "Quote builder, parts tracking, job scheduling, and real-time status updates.",
  },
  {
    icon: Droplets,
    title: "Cleaning Operations",
    description: "Bay management, chemical logs, certificates, and cleaning process tracking.",
  },
  {
    icon: MapPin,
    title: "Yard Management",
    description: "Visual yard map, slot assignment, gate control, and equipment tracking.",
  },
  {
    icon: Package,
    title: "Parts Inventory",
    description: "Stock tracking, reorder alerts, purchase orders, and supplier management.",
  },
  {
    icon: DollarSign,
    title: "Billing & Invoicing",
    description: "Auto invoicing, payment tracking, customer portal, and financial reports.",
  },
];

const equipmentTypes = [
  { icon: "🛢️", name: "ISO Tank", services: ["Survey", "Cleaning", "Repair", "Heating"] },
  { icon: "📦", name: "Dry Container", services: ["Survey", "Repair", "Floor Fix", "Repainting"] },
  { icon: "❄️", name: "Reefer", services: ["PTI Test", "Repair", "Gas Charge", "Compressor"] },
  { icon: "⚡", name: "Genset", services: ["Service", "Repair", "Fuel Mgmt", "Electrical"] },
  { icon: "🚛", name: "Chassis", services: ["DOT Insp", "Brake Svc", "Tire Repl", "Lights"] },
];

const steps = [
  { number: "1", title: "Gate In", description: "Equipment arrives at depot, capture photos, assign slot" },
  { number: "2", title: "Survey", description: "Inspect and document condition with mobile app" },
  { number: "3", title: "Service", description: "Perform cleaning, repair, or other requested services" },
  { number: "4", title: "Gate Out", description: "Release equipment with invoice and certificates" },
];

const stats = [
  { value: "50,000+", label: "Equipment Processed" },
  { value: "99.5%", label: "Uptime Guaranteed" },
  { value: "45%", label: "Time Saved on Paperwork" },
];

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#equipment", label: "Equipment" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#contact", label: "Contact" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--gecko-bg-base)" }}
    >
      {/* Navigation */}
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--gecko-bg-surface) 80%, transparent)",
          borderBottom: "1px solid var(--gecko-border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Wrench
                className="h-8 w-8"
                style={{ color: "var(--gecko-primary-600)" }}
              />
              <span
                className="text-xl"
                style={{
                  color: "var(--gecko-text-primary)",
                  fontWeight: "var(--gecko-font-weight-bold)",
                }}
              >
                logicon-mnr
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm transition-colors"
                  style={{ color: "var(--gecko-text-secondary)" }}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/login">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-6 mt-6">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="text-lg"
                      style={{
                        color: "var(--gecko-text-primary)",
                        fontWeight: "var(--gecko-font-weight-medium)",
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                  <div
                    className="pt-6 space-y-3"
                    style={{ borderTop: "1px solid var(--gecko-border)" }}
                  >
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link href="/login">Get Started</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="pt-32 pb-20"
        style={{
          background:
            "linear-gradient(to bottom, var(--gecko-bg-subtle), var(--gecko-bg-base))",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6"
            style={{
              background: "var(--gecko-primary-50)",
              borderRadius: "var(--gecko-radius-full)",
            }}
          >
            <span
              className="text-xs"
              style={{
                color: "var(--gecko-primary-700)",
                fontWeight: "var(--gecko-font-weight-medium)",
              }}
            >
              New: Reefer PTI Module
            </span>
            <ArrowRight
              className="h-3 w-3"
              style={{ color: "var(--gecko-primary-600)" }}
            />
          </div>

          {/* Headline */}
          <h1
            className="text-4xl md:text-6xl tracking-tight"
            style={{
              color: "var(--gecko-text-primary)",
              fontWeight: "var(--gecko-font-weight-bold)",
            }}
          >
            Equipment Maintenance & Repair
            <br />
            <span style={{ color: "var(--gecko-primary-600)" }}>Made Simple</span>
          </h1>

          {/* Subheadline */}
          <p
            className="mt-6 text-lg md:text-xl max-w-2xl mx-auto"
            style={{ color: "var(--gecko-text-secondary)" }}
          >
            Streamline your depot operations with a modern M&R management system.
            Track surveys, repairs, cleaning, and billing in one place.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/login">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>

          {/* Screenshot Placeholder */}
          <div
            className="mt-16 overflow-hidden aspect-video max-w-4xl mx-auto flex items-center justify-center"
            style={{
              background: "var(--gecko-gray-100)",
              border: "1px solid var(--gecko-border)",
              borderRadius: "var(--gecko-radius-xl)",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <span style={{ color: "var(--gecko-text-disabled)" }}>
              Dashboard Preview
            </span>
          </div>

          {/* Partner Logos */}
          <div className="mt-16">
            <p
              className="text-sm mb-6"
              style={{ color: "var(--gecko-text-secondary)" }}
            >
              Trusted by leading shipping lines
            </p>
            <div
              className="flex items-center justify-center gap-8 flex-wrap"
              style={{
                color: "var(--gecko-text-disabled)",
                fontWeight: "var(--gecko-font-weight-semibold)",
              }}
            >
              <span>CMA CGM</span>
              <span>MAERSK</span>
              <span>MSC</span>
              <span>Hapag-Lloyd</span>
              <span>ONE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20"
        style={{ background: "var(--gecko-bg-base)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl"
              style={{
                color: "var(--gecko-text-primary)",
                fontWeight: "var(--gecko-font-weight-bold)",
              }}
            >
              Everything you need to manage depot operations
            </h2>
            <p
              className="mt-4 text-lg"
              style={{ color: "var(--gecko-text-secondary)" }}
            >
              Comprehensive tools for every aspect of equipment maintenance and repair.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="gecko-card transition-shadow hover:shadow-lg"
                >
                  <div className="gecko-card-body">
                    <div
                      className="inline-flex items-center justify-center h-12 w-12 mb-4"
                      style={{
                        background: "var(--gecko-primary-50)",
                        borderRadius: "var(--gecko-radius-lg)",
                      }}
                    >
                      <Icon
                        className="h-6 w-6"
                        style={{ color: "var(--gecko-primary-600)" }}
                      />
                    </div>
                    <h3
                      className="text-lg"
                      style={{
                        color: "var(--gecko-text-primary)",
                        fontWeight: "var(--gecko-font-weight-semibold)",
                      }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className="mt-2 text-sm"
                      style={{ color: "var(--gecko-text-secondary)" }}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Equipment Types Section */}
      <section
        id="equipment"
        className="py-20"
        style={{ background: "var(--gecko-bg-subtle)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl"
              style={{
                color: "var(--gecko-text-primary)",
                fontWeight: "var(--gecko-font-weight-bold)",
              }}
            >
              One platform for all equipment
            </h2>
            <p
              className="mt-4 text-lg"
              style={{ color: "var(--gecko-text-secondary)" }}
            >
              Support for all major equipment types in your depot.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {equipmentTypes.map((equip) => (
              <div
                key={equip.name}
                className="gecko-card text-center transition-shadow hover:shadow-lg"
              >
                <div className="gecko-card-body">
                  <div className="text-4xl mb-3">{equip.icon}</div>
                  <h3
                    style={{
                      color: "var(--gecko-text-primary)",
                      fontWeight: "var(--gecko-font-weight-semibold)",
                    }}
                  >
                    {equip.name}
                  </h3>
                  <ul
                    className="mt-3 text-xs space-y-1"
                    style={{ color: "var(--gecko-text-secondary)" }}
                  >
                    {equip.services.map((service) => (
                      <li key={service}>• {service}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-20"
        style={{ background: "var(--gecko-bg-base)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl"
              style={{
                color: "var(--gecko-text-primary)",
                fontWeight: "var(--gecko-font-weight-bold)",
              }}
            >
              How it works
            </h2>
            <p
              className="mt-4 text-lg"
              style={{ color: "var(--gecko-text-secondary)" }}
            >
              Simple 4-step process for every job.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div
                  className="inline-flex items-center justify-center h-16 w-16 text-2xl mb-4"
                  style={{
                    background: "var(--gecko-primary-600)",
                    color: "var(--gecko-text-inverse)",
                    borderRadius: "var(--gecko-radius-full)",
                    fontWeight: "var(--gecko-font-weight-bold)",
                  }}
                >
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5"
                    style={{ background: "var(--gecko-border)" }}
                  />
                )}
                <h3
                  style={{
                    color: "var(--gecko-text-primary)",
                    fontWeight: "var(--gecko-font-weight-semibold)",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--gecko-text-secondary)" }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        className="py-20"
        style={{ background: "var(--gecko-bg-subtle)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-4xl md:text-5xl"
                  style={{
                    color: "var(--gecko-primary-600)",
                    fontWeight: "var(--gecko-font-weight-bold)",
                  }}
                >
                  {stat.value}
                </div>
                <p
                  className="mt-2"
                  style={{ color: "var(--gecko-text-secondary)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20"
        style={{
          background:
            "linear-gradient(to right, var(--gecko-primary-600), var(--gecko-primary-800))",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2
            className="text-3xl md:text-4xl"
            style={{
              color: "var(--gecko-text-inverse)",
              fontWeight: "var(--gecko-font-weight-bold)",
            }}
          >
            Ready to modernize your depot?
          </h2>
          <p
            className="mt-4 text-lg"
            style={{
              color: "color-mix(in srgb, var(--gecko-text-inverse) 80%, transparent)",
            }}
          >
            Start your free trial today. No credit card required.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link href="/login">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="py-16"
        style={{
          background: "var(--gecko-gray-900)",
          color: "var(--gecko-gray-400)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-5">
            {/* Brand */}
            <div className="md:col-span-2">
              <div
                className="flex items-center gap-2"
                style={{ color: "var(--gecko-text-inverse)" }}
              >
                <Wrench className="h-8 w-8" />
                <span
                  className="text-xl"
                  style={{ fontWeight: "var(--gecko-font-weight-bold)" }}
                >
                  logicon-mnr
                </span>
              </div>
              <p className="mt-4 text-sm">
                Equipment Maintenance & Repair System for modern container depots.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4
                className="mb-4"
                style={{
                  color: "var(--gecko-text-inverse)",
                  fontWeight: "var(--gecko-font-weight-semibold)",
                }}
              >
                Product
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
                <li><a href="#" className="hover:text-white">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4
                className="mb-4"
                style={{
                  color: "var(--gecko-text-inverse)",
                  fontWeight: "var(--gecko-font-weight-semibold)",
                }}
              >
                Company
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4
                className="mb-4"
                style={{
                  color: "var(--gecko-text-inverse)",
                  fontWeight: "var(--gecko-font-weight-semibold)",
                }}
              >
                Legal
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div
            className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ borderTop: "1px solid var(--gecko-gray-800)" }}
          >
            <p className="text-sm">&copy; 2024 logicon-mnr. All rights reserved.</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ color: "var(--gecko-gray-400)" }}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  English
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>🇺🇸 English</DropdownMenuItem>
                <DropdownMenuItem>🇹🇭 ไทย</DropdownMenuItem>
                <DropdownMenuItem>🇻🇳 Tiếng Việt</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </footer>
    </div>
  );
}
