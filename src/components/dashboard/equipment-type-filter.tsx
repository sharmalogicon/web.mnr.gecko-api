"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const equipmentTypes = [
  { id: "ALL", label: "All", icon: null },
  { id: "TANK", label: "ISO Tank", icon: "🛢" },
  { id: "DRY", label: "Dry", icon: "📦" },
  { id: "REEF", label: "Reefer", icon: "❄️" },
  { id: "GENS", label: "Genset", icon: "⚡" },
  { id: "CHAS", label: "Chassis", icon: "🚛" },
];

interface EquipmentTypeFilterProps {
  selected: string[];
  onChange: (types: string[]) => void;
}

export function EquipmentTypeFilter({
  selected,
  onChange,
}: EquipmentTypeFilterProps) {
  const toggleType = (typeId: string) => {
    if (typeId === "ALL") {
      onChange(["ALL"]);
      return;
    }

    let newSelected = selected.filter((s) => s !== "ALL");

    if (newSelected.includes(typeId)) {
      newSelected = newSelected.filter((s) => s !== typeId);
    } else {
      newSelected = [...newSelected, typeId];
    }

    if (newSelected.length === 0) {
      onChange(["ALL"]);
    } else {
      onChange(newSelected);
    }
  };

  const isSelected = (typeId: string) => {
    if (typeId === "ALL") {
      return selected.includes("ALL") || selected.length === 0;
    }
    return selected.includes(typeId);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Equipment Type:</span>
      <div className="flex flex-wrap gap-1">
        {equipmentTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => toggleType(type.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isSelected(type.id)
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {type.icon && <span>{type.icon}</span>}
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}
