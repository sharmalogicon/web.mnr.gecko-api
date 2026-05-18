"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
    nativeName: "\u0E44\u0E17\u0E22",
    flag: "\u{1F1F9}\u{1F1ED}",
    description: "\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22",
  },
  {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Ti\u1EBFng Vi\u1EC7t",
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
    const value = 1234.56;
    const currencySymbol = currency === "thb" ? "\u0E3F" : currency === "usd" ? "$" : "\u20AC";
    if (numberFormat === "comma_dot") {
      return `${currencySymbol}1,234.56`;
    } else if (numberFormat === "dot_comma") {
      return `${currencySymbol}1.234,56`;
    }
    return `${currencySymbol}1234.56`;
  };

  return (
    <div className="space-y-6">
      {/* Display Language */}
      <Card>
        <CardHeader>
          <CardTitle>Display Language</CardTitle>
          <CardDescription>Choose the language for the interface</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLanguage(lang.code)}
              className={cn(
                "flex items-center gap-4 w-full p-4 rounded-lg border-2 transition-colors text-left",
                selectedLanguage === lang.code
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="flex-1">
                <p className="font-medium">
                  {lang.nativeName} ({lang.name})
                </p>
                <p className="text-sm text-muted-foreground">{lang.description}</p>
              </div>
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                  selectedLanguage === lang.code
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {selectedLanguage === lang.code && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>Configure date, time, and number formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger id="dateFormat">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY (31/12/2024)</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY (12/31/2024)</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD (2024-12-31)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select value={timeFormat} onValueChange={setTimeFormat}>
                <SelectTrigger id="timeFormat">
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24-hour (14:30)</SelectItem>
                  <SelectItem value="12">12-hour (2:30 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asia_bangkok">Asia/Bangkok (UTC+7)</SelectItem>
                  <SelectItem value="asia_singapore">Asia/Singapore (UTC+8)</SelectItem>
                  <SelectItem value="asia_ho_chi_minh">Asia/Ho Chi Minh (UTC+7)</SelectItem>
                  <SelectItem value="utc">UTC (UTC+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thb">THB (\u0E3F)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (\u20AC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="numberFormat">Number Format</Label>
              <Select value={numberFormat} onValueChange={setNumberFormat}>
                <SelectTrigger id="numberFormat">
                  <SelectValue placeholder="Select number format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comma_dot">1,234.56</SelectItem>
                  <SelectItem value="dot_comma">1.234,56</SelectItem>
                  <SelectItem value="space_comma">1 234,56</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center">
                <span className="text-sm">{formatPreview()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
