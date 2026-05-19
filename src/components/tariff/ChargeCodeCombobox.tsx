"use client";

/**
 * <ChargeCodeCombobox> — typeable filter + popover list for the ~40
 * charge codes. Pairs with <ChargeCodeBrowser> (button on the right)
 * for the user who'd rather scan all codes side-by-side.
 *
 * Phase 7.2.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  chargeCodes,
  findChargeCode,
  type ChargeCode,
} from "@/data/seed/_shared/charge-codes";

export interface ChargeCodeComboboxProps {
  value: string;
  onChange: (code: string) => void;
  onBrowseClick: () => void;
  placeholder?: string;
  /** Optional id for the wrapping input — for label htmlFor binding. */
  id?: string;
}

export function ChargeCodeCombobox({
  value,
  onChange,
  onBrowseClick,
  placeholder = "Type a code or service name…",
  id,
}: ChargeCodeComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // When `value` changes externally, mirror it into the visible text.
  useEffect(() => {
    if (!open) {
      const meta = findChargeCode(value);
      setQuery(meta ? `${meta.code} — ${meta.label}` : value);
    }
  }, [value, open]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered: ChargeCode[] = useMemo(() => {
    if (!query.trim()) return chargeCodes;
    const q = query.trim().toLowerCase();
    return chargeCodes.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.chargeType.toLowerCase().includes(q),
    );
  }, [query]);

  const pick = (c: ChargeCode) => {
    onChange(c.code);
    setQuery(`${c.code} — ${c.label}`);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[activeIdx]) pick(filtered[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          id={id}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid var(--gecko-border)",
            borderRadius: 8,
            fontSize: 13,
            background: "var(--gecko-bg-surface)",
            color: "var(--gecko-text-primary)",
            outline: "none",
          }}
          onBlur={(e) => {
            // Restore the resolved label on blur if user typed garbage
            const meta = findChargeCode(value);
            if (meta && !filtered.find((c) => c.code === value)) {
              setQuery(`${meta.code} — ${meta.label}`);
            }
            e.currentTarget.style.borderColor = "var(--gecko-border)";
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = "var(--gecko-primary-400)";
          }}
        />
        <button
          type="button"
          onClick={onBrowseClick}
          className="gecko-btn gecko-btn-outline gecko-btn-sm"
          title="Browse all charge codes"
          style={{ flexShrink: 0 }}
        >
          <Icon name="grid" size={14} /> Browse all
        </button>
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "var(--gecko-bg-surface)",
            border: "1px solid var(--gecko-border)",
            borderRadius: 8,
            boxShadow: "var(--gecko-shadow-md)",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: 12, fontSize: 13, color: "var(--gecko-text-secondary)" }}>
              No charge codes match “{query}”.
            </div>
          ) : (
            filtered.map((c, i) => {
              const active = i === activeIdx;
              return (
                <button
                  key={c.code}
                  type="button"
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => pick(c)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    background: active ? "var(--gecko-bg-subtle)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--gecko-font-mono)",
                      fontWeight: 600,
                      color: "var(--gecko-primary-700)",
                      minWidth: 110,
                    }}
                  >
                    {c.code}
                  </span>
                  <span style={{ color: "var(--gecko-text-primary)", flex: 1 }}>{c.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--gecko-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {c.chargeType}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
