"use client";

/**
 * /settings/profile — Phase 7.9-E native gecko form primitives.
 */

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfileSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handlePasswordChange = async () => {
    setIsChangingPassword(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsChangingPassword(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Photo */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">Profile Photo</h2>
            <p className="gecko-card-description">Update your profile picture</p>
          </div>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt="Profile" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
                  <Icon name="camera" size={16} />
                  Change Photo
                </button>
                <button type="button" className="gecko-btn gecko-btn-ghost gecko-btn-sm">
                  Remove
                </button>
              </div>
              <p className="gecko-field-helper">JPG, PNG, GIF up to 2MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">Personal Information</h2>
            <p className="gecko-card-description">Update your personal details</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gecko-field">
              <label htmlFor="firstName" className="gecko-field-label">First Name</label>
              <input id="firstName" className="gecko-input" defaultValue="John" />
            </div>
            <div className="gecko-field">
              <label htmlFor="lastName" className="gecko-field-label">Last Name</label>
              <input id="lastName" className="gecko-input" defaultValue="Doe" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gecko-field">
              <label htmlFor="email" className="gecko-field-label">Email Address</label>
              <input
                id="email"
                type="email"
                className="gecko-input"
                defaultValue="john@example.com"
                disabled
              />
              <span className="gecko-field-helper">Contact admin to change email</span>
            </div>
            <div className="gecko-field">
              <label htmlFor="phone" className="gecko-field-label">Phone Number</label>
              <input id="phone" type="tel" className="gecko-input" defaultValue="+66 812 345 678" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gecko-field">
              <label htmlFor="jobTitle" className="gecko-field-label">Job Title</label>
              <input id="jobTitle" className="gecko-input" defaultValue="Operations Manager" />
            </div>
            <div className="gecko-field">
              <label htmlFor="department" className="gecko-field-label">Department</label>
              <select id="department" className="gecko-select" defaultValue="operations">
                <option value="operations">Operations</option>
                <option value="survey">Survey</option>
                <option value="repair">Repair</option>
                <option value="cleaning">Cleaning</option>
                <option value="admin">Administration</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              Cancel
            </button>
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
      </div>

      {/* Change Password */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">Change Password</h2>
            <p className="gecko-card-description">Update your password to keep your account secure</p>
          </div>

          <PasswordField
            id="currentPassword"
            label="Current Password"
            placeholder="Enter current password"
            show={showCurrentPassword}
            toggle={() => setShowCurrentPassword(!showCurrentPassword)}
          />
          <PasswordField
            id="newPassword"
            label="New Password"
            placeholder="Enter new password"
            show={showNewPassword}
            toggle={() => setShowNewPassword(!showNewPassword)}
            helper="Must be at least 8 characters"
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm New Password"
            placeholder="Confirm new password"
            show={showConfirmPassword}
            toggle={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
              className="gecko-btn gecko-btn-primary gecko-btn-sm"
            >
              {isChangingPassword ? (
                <>
                  <span className="gecko-spinner gecko-spinner-sm gecko-spinner-white" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  show,
  toggle,
  helper,
}: {
  id: string;
  label: string;
  placeholder: string;
  show: boolean;
  toggle: () => void;
  helper?: string;
}) {
  return (
    <div className="gecko-field">
      <label htmlFor={id} className="gecko-field-label">{label}</label>
      <div className="gecko-input-wrap">
        <input
          id={id}
          type={show ? "text" : "password"}
          className="gecko-input"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={toggle}
          className="gecko-input-affix"
          aria-label={show ? "Hide password" : "Show password"}
        >
          <Icon name={show ? "eyeOff" : "eye"} size={16} />
        </button>
      </div>
      {helper && <span className="gecko-field-helper">{helper}</span>}
    </div>
  );
}
