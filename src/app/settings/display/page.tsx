"use client";

import { useState } from "react";
import { Monitor } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const themes = [
  {
    id: "light",
    label: "Light",
    render: (cls: string) => <Icon name="sun" size={24} className={cls} />,
    description: "Light background with dark text",
  },
  {
    id: "dark",
    label: "Dark",
    render: (cls: string) => <Icon name="moon" size={24} className={cls} />,
    description: "Dark background with light text",
  },
  {
    // Monitor has no equivalent glyph in @/components/ui/Icon yet — keep lucide.
    id: "system",
    label: "System",
    render: (cls: string) => <Monitor className={cn("h-6 w-6", cls)} />,
    description: "Follow system preference",
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
    <div className="space-y-6">
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Select your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {themes.map((themeOption) => {
              return (
                <button
                  key={themeOption.id}
                  type="button"
                  onClick={() => setTheme(themeOption.id)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-colors",
                    theme === themeOption.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center"
                    style={
                      themeOption.id === "light"
                        ? {
                            background: "var(--gecko-warning-100)",
                            color: "var(--gecko-warning-700)",
                          }
                        : themeOption.id === "dark"
                        ? {
                            background: "var(--gecko-gray-800)",
                            color: "var(--gecko-gray-200)",
                          }
                        : {
                            background: "var(--gecko-gray-100)",
                            color: "var(--gecko-gray-600)",
                          }
                    }
                  >
                    {themeOption.render("")}
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{themeOption.label}</p>
                  </div>
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                      theme === themeOption.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {theme === themeOption.id && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Density */}
      <Card>
        <CardHeader>
          <CardTitle>Density</CardTitle>
          <CardDescription>Adjust the spacing and size of UI elements</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={density} onValueChange={setDensity} className="space-y-3">
            {densityOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-3">
                <RadioGroupItem value={option.id} id={option.id} />
                <div className="grid gap-0.5">
                  <Label htmlFor={option.id} className="font-medium">
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle>Sidebar</CardTitle>
          <CardDescription>Configure sidebar behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sidebarState">Default State</Label>
            <Select value={sidebarState} onValueChange={setSidebarState}>
              <SelectTrigger id="sidebarState" className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select default state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expanded">Expanded</SelectItem>
                <SelectItem value="collapsed">Collapsed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="rememberSidebar"
              checked={rememberSidebar}
              onCheckedChange={(checked) => setRememberSidebar(checked as boolean)}
            />
            <Label htmlFor="rememberSidebar" className="text-sm">
              Remember sidebar state between sessions
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <span className="gecko-spinner gecko-spinner-sm gecko-spinner-white mr-2" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
