"use client";

/**
 * /settings/language — Phase 7.9-E native gecko form primitives.
 * Phase 7.13-C3 — wrapped in <FormPageShell>.
 */

import { useState } from "react";
import { FormPageShell } from "@/components/page-shells";

const languages = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "\u{1F1FA}\u{1F1F8}",
    description: "Default system language",
  },
  {
    code: "th",
    name: "Thai",
    nativeName: "ไทย",
    flag: "\u{1F1F9}\u{1F1ED}",
    description: "ภาษาไทย",
  },
  {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "\u{1F1FB}\u{1F1F3}",
    description: "Vietnamese language",
  },
];

export default function LanguageSettingsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [timeFormat, setTimeFormat] = useState("24");
  const [timezone, setTimezone] = useState("asia_bangkok");
  const [currency, setCurrency] = useState("thb");
  const [numberFormat, setNumberFormat] = useState("comma_dot");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const formatPreview = () => {
    const currencySymbol = currency === "thb" ? "฿" : currency === "usd" ? "$" : "€";
    if (numberFormat === "comma_dot") return `${currencySymbol}1,234.56`;
    if (numberFormat === "dot_comma") return `${currencySymbol}1.234,56`;
    return `${currencySymbol}1234.56`;
  };

  return (
    <FormPageShell
      title="Language"
      subtitle="Display language and regional formatting."
      onSave={handleSave}
      saving={isSaving}
      saveLabel="Save Preferences"
      narrow={false}
    >
      {/* Display Language */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">Display Language</h2>
            <p className="gecko-card-description">Choose the language for the interface</p>
          </div>
          {languages.map((lang) => (
            <label key={lang.code} className="gecko-bordered-group flex items-center gap-4">
              <input
                type="radio"
                name="language"
                value={lang.code}
                checked={selectedLanguage === lang.code}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              />
              <span className="gecko-language-flag">{lang.flag}</span>
              <div className="flex-1">
                <p className="gecko-field-label">
                  {lang.nativeName} ({lang.name})
                </p>
                <p className="gecko-field-helper">{lang.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Regional Settings */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-6">
          <div>
            <h2 className="gecko-card-title">Regional Settings</h2>
            <p className="gecko-card-description">Configure date, time, and number formats</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gecko-field">
              <label htmlFor="dateFormat" className="gecko-field-label">Date Format</label>
              <select
                id="dateFormat"
                className="gecko-select"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
              >
                <option value="dd/mm/yyyy">DD/MM/YYYY (31/12/2024)</option>
                <option value="mm/dd/yyyy">MM/DD/YYYY (12/31/2024)</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD (2024-12-31)</option>
              </select>
            </div>
            <div className="gecko-field">
              <label htmlFor="timeFormat" className="gecko-field-label">Time Format</label>
              <select
                id="timeFormat"
                className="gecko-select"
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
              >
                <option value="24">24-hour (14:30)</option>
                <option value="12">12-hour (2:30 PM)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gecko-field">
              <label htmlFor="timezone" className="gecko-field-label">Timezone</label>
              <select
                id="timezone"
                className="gecko-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="asia_bangkok">Asia/Bangkok (UTC+7)</option>
                <option value="asia_singapore">Asia/Singapore (UTC+8)</option>
                <option value="asia_ho_chi_minh">Asia/Ho Chi Minh (UTC+7)</option>
                <option value="utc">UTC (UTC+0)</option>
              </select>
            </div>
            <div className="gecko-field">
              <label htmlFor="currency" className="gecko-field-label">Currency</label>
              <select
                id="currency"
                className="gecko-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="thb">THB ({"฿"})</option>
                <option value="usd">USD ($)</option>
                <option value="eur">EUR ({"€"})</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gecko-field">
              <label htmlFor="numberFormat" className="gecko-field-label">Number Format</label>
              <select
                id="numberFormat"
                className="gecko-select"
                value={numberFormat}
                onChange={(e) => setNumberFormat(e.target.value)}
              >
                <option value="comma_dot">1,234.56</option>
                <option value="dot_comma">1.234,56</option>
                <option value="space_comma">1 234,56</option>
              </select>
            </div>
            <div className="gecko-field">
              <span className="gecko-field-label">Preview</span>
              <div className="gecko-input gecko-bg-subtle flex items-center">
                {formatPreview()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormPageShell>
  );
}
