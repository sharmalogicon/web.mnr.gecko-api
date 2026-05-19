"use client";

/**
 * /parts/new — Phase 7.9-D native gecko form primitives.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout";

export default function NewPartPage() {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minimum, setMinimum] = useState("");
  const [location, setLocation] = useState("");
  const [supplier, setSupplier] = useState("");

  const handleSubmit = () => {
    router.push("/parts");
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="gecko-card">
            <div className="gecko-card-body flex flex-col gap-4">
              <h2 className="gecko-card-title">Part Information</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="gecko-field">
                  <label htmlFor="sku" className="gecko-field-label">
                    SKU <span className="gecko-field-required">*</span>
                  </label>
                  <input
                    id="sku"
                    className="gecko-input"
                    placeholder="e.g., VLV-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
                <div className="gecko-field">
                  <label htmlFor="category" className="gecko-field-label">
                    Category <span className="gecko-field-required">*</span>
                  </label>
                  <select
                    id="category"
                    className="gecko-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select category...</option>
                    <option value="valves">Valves</option>
                    <option value="seals">Seals &amp; Gaskets</option>
                    <option value="heating">Heating</option>
                    <option value="sensors">Sensors</option>
                    <option value="frame">Frame Parts</option>
                  </select>
                </div>
              </div>

              <div className="gecko-field">
                <label htmlFor="name" className="gecko-field-label">
                  Part Name <span className="gecko-field-required">*</span>
                </label>
                <input
                  id="name"
                  className="gecko-input"
                  placeholder="Enter part name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="gecko-field">
                <label htmlFor="description" className="gecko-field-label">Description</label>
                <textarea
                  id="description"
                  className="gecko-textarea"
                  placeholder="Enter part description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="gecko-card">
            <div className="gecko-card-body flex flex-col gap-4">
              <h2 className="gecko-card-title">Inventory &amp; Pricing</h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="gecko-field">
                  <label htmlFor="price" className="gecko-field-label">
                    Unit Price ($) <span className="gecko-field-required">*</span>
                  </label>
                  <input
                    id="price"
                    type="number"
                    className="gecko-input"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="gecko-field">
                  <label htmlFor="stock" className="gecko-field-label">
                    Initial Stock <span className="gecko-field-required">*</span>
                  </label>
                  <input
                    id="stock"
                    type="number"
                    className="gecko-input"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
                <div className="gecko-field">
                  <label htmlFor="minimum" className="gecko-field-label">
                    Minimum Level <span className="gecko-field-required">*</span>
                  </label>
                  <input
                    id="minimum"
                    type="number"
                    className="gecko-input"
                    placeholder="0"
                    value={minimum}
                    onChange={(e) => setMinimum(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="gecko-field">
                  <label htmlFor="location" className="gecko-field-label">Storage Location</label>
                  <input
                    id="location"
                    className="gecko-input"
                    placeholder="e.g., A-3"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="gecko-field">
                  <label htmlFor="supplier" className="gecko-field-label">Preferred Supplier</label>
                  <select
                    id="supplier"
                    className="gecko-select"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  >
                    <option value="">Select supplier...</option>
                    <option value="supplier1">Tank Parts Co.</option>
                    <option value="supplier2">Industrial Supply Ltd.</option>
                    <option value="supplier3">Container Components Inc.</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="gecko-card sticky top-6">
            <div className="gecko-card-body flex flex-col gap-4">
              <h2 className="gecko-card-title">Summary</h2>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="gecko-field-helper">SKU:</span>
                  <span className="gecko-text-mono">{sku || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="gecko-field-helper">Name:</span>
                  <span>{name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="gecko-field-helper">Category:</span>
                  <span className="capitalize">{category || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="gecko-field-helper">Price:</span>
                  <span>{price ? `$${price}` : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="gecko-field-helper">Stock:</span>
                  <span>{stock || "-"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!sku || !name || !category}
                  className="gecko-btn gecko-btn-primary gecko-btn-sm"
                >
                  Add Part
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/parts")}
                  className="gecko-btn gecko-btn-outline gecko-btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
