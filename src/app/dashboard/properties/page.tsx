"use client";

import { useState } from "react";

export default function DashboardPropertiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState([
    {
      id: 1,
      title: "The Glasshouse Penthouse",
      location: "1204 Skyline Blvd, Seattle WA",
      price: "$2,450,000",
      status: "Published",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-k-FEW34noMIWSYTFBGgvEiazbZdQNmsoUl5zLA82IyA1-tn96chZQSvscO9D0JK5DFq_qt1u5a-xkwpTKT8zwObazbqyc35A2W_1K1nIYwRrogDxBj-P_qOmlaIG_RDlSMFW7lSfStOf9NoQk6wdrLo5PY97cxqIh7vE9f9fxC1Qt_C25ht1PL90aZ0tuRwWXIIa-Z87cAYI0wnxMU5jaqJxakWsZaHMQ_KbBE0QCocFWP9X4JHb",
    },
    {
      id: 2,
      title: "Metro Tech Hub - Floor 3",
      location: "88 Innovation Way, Austin TX",
      price: "$8,500 / mo",
      status: "Draft",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwVEX2P4hz7RHU8jk2iem4q4oquVsPYsmkEixIdt-GOZKYmhZg8-uLu16gkRB_Sp7O-KckQyZJ-C15lgMB2yOBXV92EPhOIyanOxxsIcXTg4HtTMqmIBXl-oNt3M0mnTxwYA8gqphjmW5JjIruIYDyihK-EijxK_D08E0GSMOer_pPhA215g5kEcKdqaiFwxrzTDmGqc8BWnBwqICeQtVaz25i2x-_12RnNI17LLyK7tv1P5d3lwPI",
    },
    {
      id: 3,
      title: "The Foundry Lofts Unit B",
      location: "450 Industrial Blvd, Chicago IL",
      price: "$1,250,000",
      status: "Published",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwcNQSWZvYXEjihGFF-QErLbkZdPi-1tiBLj8aaiPdhkiIFRHLtUVarDLcyjTDFy3iukWkbhO4MJJg4i9g1UnVR3GMwqW2CtGF4bqeJEcK85H3GZIfJdfWreZoSpTNcb666OhFYw4FZHP6mz18-axqx0xu6XHpl3sKUmxKJGIn0uyHQrCnJP_bAMtUF2l4El3jqVMONcl2QVRhiUnecAJHBbRxcDwgU9SmEJRiOsj2LQPy8VTeaexs",
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({
    title: "",
    location: "",
    price: "",
    status: "Published",
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this property?")) {
      setProperties(properties.filter((p) => p.id !== id));
    }
  };

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProperty.title || !newProperty.price) return;
    const randomImg = properties[Math.floor(Math.random() * properties.length)].imageUrl;
    setProperties([
      ...properties,
      {
        id: Date.now(),
        title: newProperty.title,
        location: newProperty.location || "123 Main St, USA",
        price: newProperty.price,
        status: newProperty.status,
        imageUrl: randomImg,
      },
    ]);
    setNewProperty({ title: "", location: "", price: "", status: "Published" });
    setModalOpen(false);
  };

  const filteredProperties = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
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
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#f97316] text-white font-bold py-sm px-md rounded-lg hover:bg-[#ea580c] transition-colors shadow-sm flex items-center shrink-0 font-sm text-sm"
          >
            <span className="material-symbols-outlined mr-sm text-[20px]">add</span>
            Add Property
          </button>
        </div>
      </header>

      {/* Main content scrollable container */}
      <div className="p-lg flex-grow">
        {/* Filters & Actions Bar */}
        <div className="bg-surface-container-lowest p-md rounded-lg border border-border-gray shadow-sm mb-lg flex flex-wrap gap-md items-center justify-between">
          <div className="flex gap-sm">
            <button className="px-md py-sm border border-border-gray rounded-lg font-sm text-sm text-text-primary bg-surface-container-lowest hover:bg-surface-gray transition-colors flex items-center gap-sm">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              All Statuses
            </button>
            <button className="px-md py-sm border border-border-gray rounded-lg font-sm text-sm text-text-primary bg-surface-container-lowest hover:bg-surface-gray transition-colors flex items-center gap-sm">
              <span className="material-symbols-outlined text-[18px]">sort</span>
              Newest First
            </button>
          </div>
          <p className="font-sm text-sm text-text-secondary">
            Showing {filteredProperties.length} properties
          </p>
        </div>

        {/* Properties Table */}
        <div className="bg-surface-container-lowest rounded-lg border border-border-gray shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border-gray bg-surface-gray">
                  <th className="py-md px-lg font-xs text-xs text-text-secondary uppercase tracking-wider font-bold w-[100px]">
                    Property
                  </th>
                  <th className="py-md px-lg font-xs text-xs text-text-secondary uppercase tracking-wider font-bold">
                    Details
                  </th>
                  <th className="py-md px-lg font-xs text-xs text-text-secondary uppercase tracking-wider font-bold">
                    Price
                  </th>
                  <th className="py-md px-lg font-xs text-xs text-text-secondary uppercase tracking-wider font-bold">
                    Status
                  </th>
                  <th className="py-md px-lg font-xs text-xs text-text-secondary uppercase tracking-wider font-bold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="font-sm text-sm text-text-primary">
                {filteredProperties.map((prop) => (
                  <tr
                    key={prop.id}
                    className="border-b border-border-gray hover:bg-surface-gray/50 transition-colors group"
                  >
                    <td className="py-md px-lg">
                      <div className="w-16 h-12 rounded bg-surface-variant overflow-hidden border border-border-gray shadow-sm">
                        <img
                          src={prop.imageUrl}
                          alt="Property Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-md px-lg">
                      <div className="font-bold text-primary-navy mb-base">
                        {prop.title}
                      </div>
                      <div className="text-text-secondary font-xs text-xs flex items-center">
                        <span className="material-symbols-outlined text-[14px] mr-base">
                          location_on
                        </span>
                        {prop.location}
                      </div>
                    </td>
                    <td className="py-md px-lg font-bold text-primary-navy">
                      {prop.price}
                    </td>
                    <td className="py-md px-lg">
                      {prop.status === "Published" ? (
                        <span className="inline-flex items-center px-sm py-base rounded-full bg-secondary-container/20 text-secondary font-xs text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-sm"></span>
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-sm py-base rounded-full bg-surface-variant text-text-secondary font-xs text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-text-secondary mr-sm"></span>
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-md px-lg text-right">
                      <div className="flex justify-end space-x-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => alert(`Edit property: ${prop.title}`)}
                          className="p-sm text-text-secondary hover:text-primary-navy bg-surface-container-lowest border border-border-gray rounded shadow-sm hover:shadow transition-all"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(prop.id)}
                          className="p-sm text-text-secondary hover:text-error bg-surface-container-lowest border border-border-gray rounded shadow-sm hover:shadow transition-all"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="border-t border-border-gray p-md flex items-center justify-between bg-surface-gray/30">
            <button className="px-md py-sm border border-border-gray rounded-lg font-sm text-sm text-text-secondary hover:bg-surface-gray transition-colors disabled:opacity-50">
              Previous
            </button>
            <div className="font-sm text-sm text-text-secondary">Page 1 of 3</div>
            <button className="px-md py-sm border border-border-gray rounded-lg font-sm text-sm text-text-secondary hover:bg-surface-gray transition-colors">
              Next
            </button>
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
                  value={newProperty.location}
                  onChange={(e) =>
                    setNewProperty({ ...newProperty, location: e.target.value })
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
                  placeholder="e.g. $4,250,000"
                  value={newProperty.price}
                  onChange={(e) =>
                    setNewProperty({ ...newProperty, price: e.target.value })
                  }
                  className="w-full rounded border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-accent-emerald outline-none font-sm text-sm"
                />
              </div>
              <div>
                <label className="block font-xs text-xs text-text-secondary mb-base font-bold">
                  Status
                </label>
                <select
                  value={newProperty.status}
                  onChange={(e) =>
                    setNewProperty({ ...newProperty, status: e.target.value })
                  }
                  className="w-full rounded border border-border-gray bg-surface-container-lowest px-md py-sm focus:ring-2 focus:ring-accent-emerald outline-none font-sm text-sm bg-white"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
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
                  className="bg-[#f97316] text-white font-bold py-sm px-md rounded-lg hover:bg-[#ea580c] transition-colors"
                >
                  Add Property
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
