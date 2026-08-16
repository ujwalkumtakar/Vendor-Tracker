'use client';

import { useState, useEffect } from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { getVendors, createVendor, deleteVendor, updateVendor } from '@/lib/api';
import { Vendor } from '@/types/vendor';

// withAuthenticator injects `signOut` and `user` as props automatically
function Home({ signOut, user }: { signOut?: () => void; user?: any }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState({ name: '', category: '', contactEmail: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', contactEmail: '' });

  const loadVendors = async () => {
    try {
      const data = await getVendors();
      setVendors(data);
    } catch {
      setError('Failed to load vendors.');
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createVendor(form);
      setForm({ name: '', category: '', contactEmail: '' });
      await loadVendors();
    } catch {
      setError('Failed to add vendor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vendorId: string) => {
    try {
      await deleteVendor(vendorId);
      await loadVendors();
    } catch {
      setError('Failed to delete vendor.');
    }
  };

  const handleUpdate = async (vendorId: string) => {
    setLoading(true);
    setError('');
    try {
      await updateVendor(vendorId, editForm);
      setEditingId(null);
      await loadVendors();
    } catch {
      setError('Failed to update vendor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-10 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <header className="flex justify-between items-center mb-8 p-4 bg-gray-100 rounded">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendor Tracker</h1>
          <p className="text-sm text-gray-500">Signed in as: {user?.signInDetails?.loginId}</p>
        </div>
        <button
          onClick={signOut}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* ── Add Vendor Form ── */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-white">Add New Vendor</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full p-2 border rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Vendor Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="w-full p-2 border rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Category (e.g. SaaS, Hardware)"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              required
            />
            <input
              className="w-full p-2 border rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Contact Email"
              type="email"
              value={form.contactEmail}
              onChange={e => setForm({ ...form, contactEmail: e.target.value })}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Add Vendor'}
            </button>
          </form>
        </section>

        {/* ── Vendor List ── */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-white">
            Current Vendors ({vendors.length})
          </h2>
          <div className="space-y-3">
            {vendors.length === 0 ? (
              <p className="text-gray-400 italic">No vendors yet.</p>
            ) : (
                vendors.map(v => (
                  <div
                    key={v.vendorId}
                    className="p-4 border rounded shadow-sm bg-white"
                  >
                    {editingId === v.vendorId ? (
                      // ── Edit Mode ──
                      <div className="space-y-2">
                        <input
                          className="w-full p-1 border rounded text-black text-sm"
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Vendor Name"
                        />
                        <input
                          className="w-full p-1 border rounded text-black text-sm"
                          value={editForm.category}
                          onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                          placeholder="Category"
                        />
                        <input
                          className="w-full p-1 border rounded text-black text-sm"
                          value={editForm.contactEmail}
                          onChange={e => setEditForm({ ...editForm, contactEmail: e.target.value })}
                          placeholder="Email"
                          type="email"
                        />
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => v.vendorId && handleUpdate(v.vendorId)}
                            disabled={loading}
                            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-sm text-gray-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // ── View Mode ──
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{v.name}</p>
                          <p className="text-sm text-gray-500">{v.category} · {v.contactEmail}</p>
                        </div>
                        <div className="flex gap-3 ml-4">
                          <button
                            onClick={() => {
                              setEditingId(v.vendorId ?? null);
                              setEditForm({
                                name: v.name,
                                category: v.category,
                                contactEmail: v.contactEmail,
                              });
                            }}
                            className="text-sm text-blue-500 hover:text-blue-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => v.vendorId && handleDelete(v.vendorId)}
                            className="text-sm text-red-500 hover:text-red-700 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </section>

      </div>
    </main>
  );
}

// Wrapping Home with withAuthenticator means any user who is not logged in
// will see Amplify's built-in login/signup screen instead of this component.
export default withAuthenticator(Home);
