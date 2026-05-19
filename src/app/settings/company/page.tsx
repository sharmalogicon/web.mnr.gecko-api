"use client";

/**
 * /settings/company — Phase 7.9-E native gecko form primitives.
 */

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export default function CompanySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Company Logo */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">Company Logo</h2>
            <p className="gecko-card-description">Upload your company logo for branding</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="gecko-logo-placeholder">
              <Icon name="package" size={32} />
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
                <Icon name="upload" size={16} />
                Change Logo
              </button>
              <p className="gecko-field-helper">Recommended: 200x200px, PNG or SVG</p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">Company Details</h2>
            <p className="gecko-card-description">Update your company information</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gecko-field">
              <label htmlFor="companyName" className="gecko-field-label">
                Company Name <span className="gecko-field-required">*</span>
              </label>
              <input id="companyName" className="gecko-input" defaultValue="ABC Depot Co., Ltd." />
            </div>
            <div className="gecko-field">
              <label htmlFor="taxId" className="gecko-field-label">Tax ID</label>
              <input id="taxId" className="gecko-input" defaultValue="0-1234-56789-01-2" />
            </div>
          </div>

          <div className="gecko-field">
            <label htmlFor="address" className="gecko-field-label">Address</label>
            <textarea
              id="address"
              className="gecko-textarea"
              defaultValue="123 Depot Road, Laem Chabang"
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="gecko-field">
              <label htmlFor="city" className="gecko-field-label">City</label>
              <input id="city" className="gecko-input" defaultValue="Laem Chabang" />
            </div>
            <div className="gecko-field">
              <label htmlFor="province" className="gecko-field-label">Province</label>
              <input id="province" className="gecko-input" defaultValue="Chonburi" />
            </div>
            <div className="gecko-field">
              <label htmlFor="postalCode" className="gecko-field-label">Postal Code</label>
              <input id="postalCode" className="gecko-input" defaultValue="20230" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gecko-field">
              <label htmlFor="phone" className="gecko-field-label">Phone</label>
              <input id="phone" type="tel" className="gecko-input" defaultValue="+66 38 123 456" />
            </div>
            <div className="gecko-field">
              <label htmlFor="email" className="gecko-field-label">Email</label>
              <input id="email" type="email" className="gecko-input" defaultValue="info@abcdepot.com" />
            </div>
          </div>
        </div>
      </div>

      {/* Default Settings */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">Default Settings</h2>
            <p className="gecko-card-description">Set default values for new users and operations</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gecko-field">
              <label htmlFor="defaultLanguage" className="gecko-field-label">Default Language</label>
              <select id="defaultLanguage" className="gecko-select" defaultValue="th">
                <option value="en">{"🇺🇸"} English</option>
                <option value="th">{"🇹🇭"} Thai</option>
                <option value="vi">{"🇻🇳"} Vietnamese</option>
              </select>
            </div>
            <div className="gecko-field">
              <label htmlFor="defaultCurrency" className="gecko-field-label">Default Currency</label>
              <select id="defaultCurrency" className="gecko-select" defaultValue="thb">
                <option value="thb">THB (฿)</option>
                <option value="usd">USD ($)</option>
                <option value="eur">EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="gecko-field">
            <label htmlFor="defaultTimezone" className="gecko-field-label">Default Timezone</label>
            <select
              id="defaultTimezone"
              className="gecko-select w-full sm:w-[250px]"
              defaultValue="asia_bangkok"
            >
              <option value="asia_bangkok">Asia/Bangkok (UTC+7)</option>
              <option value="asia_singapore">Asia/Singapore (UTC+8)</option>
              <option value="asia_ho_chi_minh">Asia/Ho Chi Minh (UTC+7)</option>
              <option value="utc">UTC (UTC+0)</option>
            </select>
          </div>
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
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
