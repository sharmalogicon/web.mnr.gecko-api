"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useEffect, useState } from "react";

function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

const dataSpec = [
  { name: "ISO Tank", value: 112, token: "--gecko-mnr-eq-tank", fallback: "#2563eb" },
  { name: "Dry Container", value: 86, token: "--gecko-mnr-eq-dry", fallback: "#7c3aed" },
  { name: "Reefer", value: 49, token: "--gecko-mnr-eq-reefer", fallback: "#0891b2" },
  { name: "Genset", value: 8, token: "--gecko-mnr-eq-genset", fallback: "#ea580c" },
  { name: "Chassis", value: 4, token: "--gecko-mnr-eq-chassis", fallback: "#16a34a" },
];

export function EquipmentTypeChart() {
  const [data, setData] = useState(
    dataSpec.map((d) => ({ name: d.name, value: d.value, color: d.fallback })),
  );
  const [surface, setSurface] = useState("#ffffff");
  const [border, setBorder] = useState("#e5e7eb");

  useEffect(() => {
    setData(
      dataSpec.map((d) => ({
        name: d.name,
        value: d.value,
        color: readToken(d.token, d.fallback),
      })),
    );
    setSurface(readToken("--gecko-bg-surface", "#ffffff"));
    setBorder(readToken("--gecko-border", "#e5e7eb"));
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div
      className="gecko-card"
      style={{ padding: "var(--gecko-space-6)" }}
    >
      <h3
        className="mb-4 text-lg"
        style={{ fontWeight: "var(--gecko-font-weight-semibold)" }}
      >
        Equipment by Type
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `${value} (${((value / total) * 100).toFixed(1)}%)`,
                "Count",
              ]}
              contentStyle={{
                backgroundColor: surface,
                border: `1px solid ${border}`,
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value) => (
                <span
                  className="text-sm"
                  style={{ color: "var(--gecko-text-primary)" }}
                >
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center">
        <span
          className="text-2xl"
          style={{ fontWeight: "var(--gecko-font-weight-bold)" }}
        >
          {total}
        </span>
        <span
          className="ml-2 text-sm"
          style={{ color: "var(--gecko-text-secondary)" }}
        >
          Total Equipment
        </span>
      </div>
    </div>
  );
}
