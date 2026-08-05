"use client";

import { useState, useTransition } from "react";
import { addProperty, deleteProperty } from "@/lib/actions/dashboard";
import type { Property, PropertyType } from "@/lib/supabase/types";

const PROPERTY_TYPES: PropertyType[] = [
  "house",
  "condo",
  "apartment",
  "villa",
  "office",
  "land",
  "other",
];

function formatPrice(property: Property) {
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(property.price);
  return property.price_period === "sale" ? amount : `${amount} / ${property.price_period}`;
}

export default function PropertiesTable({
  organizationId,
  properties,
  isAdmin,
}: {
  organizationId: string;
  properties: Property[];
  isAdmin: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [newProperty, setNewProperty] = useState({
    title: "",
    addressLine: "",
    price: "",
    propertyType: "house" as PropertyType,
    status: "published" as "draft" | "published",
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    startTransition(async () => {
      const result = await deleteProperty(id);
      if ("error" in result) setError(result.error);
    });
  };

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(newProperty.price.replace(/[^0-9.]/g, ""));
    if (!newProperty.title || !price) return;

    const formData = new FormData();
    formData.set("title", newProperty.title);
    formData.set("addressLine", newProperty.addressLine);
    formData.set("price", String(price));
    formData.set("propertyType", newProperty.propertyType);
    formData.set("status", newProperty.status);
    for (const file of selectedImages) {
      formData.append("images", file);
    }

    startTransition(async () => {
      const result = await addProperty(organizationId, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setNewProperty({
        title: "",
        addressLine: "",
        price: "",
        propertyType: "house",
        status: "published",
      });
      setSelectedImages([]);
      setModalOpen(false);
    });
  };

  const filteredProperties = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.address_line ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex flex-col min-h-full">
      {/* Page Header */}
      <header className="bg-surface-container-lowest border-b border-border-gray px-lg py-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md sticky top-0 z-40 shadow-sm shrink-0">
        <div>
          <h1 className="font-h1 text-h1 text-primary-navy font-bold">Properties</h1>
          <p className="font-sm text-sm text-text-secondary mt-base">
            Manage and organize your real estate listings.
          </p>
        </div>
        <div className="flex items-center gap-md w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-text-secondary">
              search
            </span>
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-xl pr-md py-sm border border-border-gray rounded-lg font-sm text-sm text-text-primary bg-surface-container-lowest hover:bg-surface-gray focus:ring-2 focus:ring-accent-emerald focus:outline-none transition-colors w-full sm:w-64"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#f97316] text-white font-bold py-sm px-md rounded-lg hover:bg-[#ea580c] transition-colors shadow-sm flex items-center shrink-0 font-sm text-sm"
            >
              <span className="material-symbols-outlined mr-sm text-[20px]">add</span>
              Add Property
            </button>
          )}
        </div>
      </header>

      <div className="p-lg flex-grow">
        {error && (
          <div className="mb-lg bg-error/10 border border-error text-error rounded-lg p-md font-sm text-sm">
            {error}
          </div>
        )}

        <div className="bg-surface-container-lowest p-md rounded-lg border border-border-gray shadow-sm mb-lg flex flex-wrap gap-md items-center justify-between">
          <p className="font-sm text-sm text-text-secondary">
            Showing {filteredProperties.length} properties
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-lg border border-border-gray shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border-gray bg-surface-gray">
                  <th className="py-md px-lg font-xs text-xs text-text-secondary uppercase tracking-wider font-bold">
                    Details
                  </th>
                  <th className="py-md px-lg font-xs text-xs text-text-secondary uppercase tracking-wider font-bold">
                    Price
                  </th>
                  <th className="py-md px-lg font-xs text-xs text-text-secondary uppercase tracking-wider font-bold">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="py-md px-lg font-xs text-xs text-text-secondary uppercase tracking-wider font-bold text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="font-sm text-sm text-text-primary">
                {filteredProperties.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-xl text-center text-text-secondary">
                      No properties yet.
                    </td>
                  </tr>
                )}
                {filteredProperties.map((prop) => (
                  <tr
                    key={prop.id}
                    className="border-b border-border-gray hover:bg-surface-gray/50 transition-colors group"
                  >
                    <td className="py-md px-lg">
                      <div className="font-bold text-primary-navy mb-base">
                        {prop.title}
                      </div>
                      {prop.address_line && (
                        <div className="text-text-secondary font-xs text-xs flex items-center">
                          <span className="material-symbols-outlined text-[14px] mr-base">
                            location_on
                          </span>
                          {prop.address_line}
                        </div>
                      )}
                    </td>
                    <td className="py-md px-lg font-bold text-primary-navy">
                      {formatPrice(prop)}
                    </td>
                    <td className="py-md px-lg">
                      {prop.status === "published" ? (
                        <span className="inline-flex items-center px-sm py-base rounded-full bg-secondary-container/20 text-secondary font-xs text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-sm"></span>
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-sm py-base rounded-full bg-surface-variant text-text-secondary font-xs text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-text-secondary mr-sm"></span>
                          {prop.status === "draft" ? "Draft" : "Archived"}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-md px-lg text-right">
                        <div className="flex justify-end space-x-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDelete(prop.id, prop.title)}
                            disabled={pending}
                            className="p-sm text-text-secondary hover:text-error bg-surface-container-lowest border border-border-gray rounded shadow-sm hover:shadow transition-all"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Property Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md">
          <div className="bg-surface-container-lowest rounded-xl border border-border-gray shadow-md w-full max-w-[448px] overflow-hidden">
            <header className="bg-surface-gray px-lg py-md border-b border-border-gray flex justify-between items-center">
              <h3 className="font-h3 text-h3 text-primary-navy font-bold">
                Add Property
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-text-secondary hover:text-primary-navy"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleAddProperty} className="p-lg space-y-md">
              <div>
                <label className="block font-xs text-xs text-text-secondary mb-base font-bold">
                  Property Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Penthouse"
                  value={newProperty.title}
                  onChange={(e) =>
                    setNewProperty({ ...newProperty, title: e.target.value })
                  }
                  className="w-full rounded border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-accent-emerald outline-none font-sm text-sm"
                />
              </div>
              <div>
                <label className="block font-xs text-xs text-text-secondary mb-base font-bold">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. 150 W 56th St, New York"
                  value={newProperty.addressLine}
                  onChange={(e) =>
                    setNewProperty({ ...newProperty, addressLine: e.target.value })
                  }
                  className="w-full rounded border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-accent-emerald outline-none font-sm text-sm"
                />
              </div>
              <div>
                <label className="block font-xs text-xs text-text-secondary mb-base font-bold">
                  Price *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4250000"
                  value={newProperty.price}
                  onChange={(e) =>
                    setNewProperty({ ...newProperty, price: e.target.value })
                  }
                  className="w-full rounded border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-accent-emerald outline-none font-sm text-sm"
                />
              </div>
              <div>
                <label className="block font-xs text-xs text-text-secondary mb-base font-bold">
                  Property Type
                </label>
                <select
                  value={newProperty.propertyType}
                  onChange={(e) =>
                    setNewProperty({
                      ...newProperty,
                      propertyType: e.target.value as PropertyType,
                    })
                  }
                  className="w-full rounded border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-accent-emerald outline-none font-sm text-sm bg-white"
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-xs text-xs text-text-secondary mb-base font-bold">
                  Status
                </label>
                <select
                  value={newProperty.status}
                  onChange={(e) =>
                    setNewProperty({
                      ...newProperty,
                      status: e.target.value as "draft" | "published",
                    })
                  }
                  className="w-full rounded border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-accent-emerald outline-none font-sm text-sm bg-white"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block font-xs text-xs text-[#0F172A] font-bold uppercase tracking-wider">
                    Property Photos
                  </label>
                  {selectedImages.length > 0 && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {selectedImages.length} {selectedImages.length === 1 ? "photo" : "photos"} selected
                    </span>
                  )}
                </div>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-[#10B981] rounded-xl bg-slate-50/60 p-4 transition-all duration-150 text-center cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (!e.target.files) return;
                      const newFiles = Array.from(e.target.files);
                      setSelectedImages((prev) => [...prev, ...newFiles]);
                      e.target.value = "";
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Click or drag photos here"
                  />
                  <div className="flex flex-col items-center justify-center pointer-events-none space-y-1">
                    <span className="material-symbols-outlined text-[28px] text-slate-400 group-hover:text-[#10B981] transition-colors">
                      add_photo_alternate
                    </span>
                    <p className="text-xs font-semibold text-slate-700">
                      Click to choose photos <span className="font-normal text-slate-500">or drag and drop</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Select multiple PNG, JPG, or WEBP images
                    </p>
                  </div>
                </div>

                {selectedImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[240px] overflow-y-auto p-2 border border-slate-200/80 rounded-xl bg-slate-50/40 shadow-inner">
                    {selectedImages.map((file, i) => {
                      const previewUrl = URL.createObjectURL(file);
                      return (
                        <div
                          key={`${file.name}-${i}-${file.size}`}
                          className="relative group rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs h-24 flex flex-col items-center justify-center"
                        >
                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onLoad={() => URL.revokeObjectURL(previewUrl)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-1.5 pointer-events-none">
                            <div className="flex justify-end pointer-events-auto">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedImages(selectedImages.filter((_, idx) => idx !== i))
                                }
                                className="h-5 w-5 rounded-full bg-black/60 text-white hover:bg-red-600 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                                title="Remove photo"
                              >
                                <span className="material-symbols-outlined text-[13px]">
                                  close
                                </span>
                              </button>
                            </div>
                            <span className="text-[10px] text-white font-medium truncate w-full px-1 block drop-shadow">
                              {file.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <footer className="pt-md flex justify-end gap-md">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-md py-sm border border-border-gray rounded-lg font-sm text-sm text-text-primary hover:bg-surface-gray"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="bg-[#f97316] text-white font-bold py-sm px-md rounded-lg hover:bg-[#ea580c] transition-colors disabled:opacity-60"
                >
                  {pending ? "Adding…" : "Add Property"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
