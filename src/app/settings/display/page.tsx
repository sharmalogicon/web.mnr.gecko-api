"use client";

/**
 * /settings/display — Phase 7.9-E native gecko form primitives.
 */

import { useState } from "react";
import { Monitor } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

const themes = [
  {
    id: "light",
    label: "Light",
    icon: <Icon name="sun" size={24} />,
    bubble: "gecko-theme-bubble-light",
  },
  {
    id: "dark",
    label: "Dark",
    icon: <Icon name="moon" size={24} />,
    bubble: "gecko-theme-bubble-dark",
  },
  {
    id: "system",
    label: "System",
    icon: <Monitor size={24} />,
    bubble: "gecko-theme-bubble-system",
  },
];

const densityOptions = [
  { id: "comfortable", label: "Comfortable", description: "More spacing, larger touch targets" },
  { id: "default", label: "Default", description: "Balanced spacing" },
  { id: "compact", label: "Compact", description: "Less spacing, more content visible" },
];

export default function DisplaySettingsPage() {
  const [theme, setTheme] = useState("light");
  const [density, setDensity] = useState("default");
  const [sidebarState, setSidebarState] = useState("expanded");
  const [rememberSidebar, setRememberSidebar] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Theme */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">Theme</h2>
            <p className="gecko-card-description">Select your preferred color theme</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {themes.map((themeOption) => (
              <label
                key={themeOption.id}
                className="gecko-bordered-group flex flex-col items-center gap-3"
              >
                <input
                  type="radio"
                  name="theme"
                  value={themeOption.id}
                  checked={theme === themeOption.id}
                  onChange={(e) => setTheme(e.target.value)}
                />
                <div className={`gecko-theme-bubble ${themeOption.bubble}`}>
                  {themeOption.icon}
                </div>
                <p className="gecko-field-label">{themeOption.label}</p>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Density */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">Density</h2>
            <p className="gecko-card-description">Adjust the spacing and size of UI elements</p>
          </div>
          <div className="flex flex-col gap-3">
            {densityOptions.map((option) => (
              <label key={option.id} className="flex items-start gap-3">
                <input
                  type="radio"
                  name="density"
                  value={option.id}
                  checked={density === option.id}
                  onChange={(e) => setDensity(e.target.value)}
                />
                <div className="flex flex-col">
                  <span className="gecko-field-label">{option.label}</span>
                  <span className="gecko-field-helper">{option.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">Sidebar</h2>
            <p className="gecko-card-description">Configure sidebar behavior</p>
          </div>

          <div className="gecko-field">
            <label htmlFor="sidebarState" className="gecko-field-label">Default State</label>
            <select
              id="sidebarState"
              className="gecko-select w-full sm:w-[200px]"
              value={sidebarState}
              onChange={(e) => setSidebarState(e.target.value)}
            >
              <option value="expanded">Expanded</option>
              <option value="collapsed">Collapsed</option>
            </select>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              id="rememberSidebar"
              checked={rememberSidebar}
              onChange={(e) => setRememberSidebar(e.target.checked)}
            />
            <span className="gecko-field-label">
              Remember sidebar state between sessions
            </span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">Cancel</button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="gecko-btn gecko-btn-primary gecko-btn-sm"
        >
          {isSaving ? (
            <>
              <span className="gecko-spinner gecko-spinner-sm gecko-spinner-white" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </button>
      </div>
    </div>
  );
}
