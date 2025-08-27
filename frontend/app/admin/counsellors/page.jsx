'use client';
import { useEffect, useState } from 'react';
import {
  adminListCounsellors,
  adminCreateCounsellor,
  adminUpdateCounsellor,
  adminDeleteCounsellor,
} from '@/lib/api';

function pickId(c, fallbackIndex) {
  return (
    c?.counsellorId ??
    c?.counselorId ??   // just in case of alt spelling
    c?.id ??
    c?._id ??
    (c?.email ? `email:${c.email}` : `row-${fallbackIndex}`) // last resort
  );
}

export default function AdminCounsellorsPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', specialization: '', feePerSessionINR: 0 });
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');

  const load = async () => {
    setErr('');
    try {
      const res = await adminListCounsellors();
      // backend returns { ok, items, nextKey }
      const items = Array.isArray(res?.items) ? res.items : [];
      setRows(items);
    } catch (e) {
      setErr(e?.message || 'Failed to load');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setErr('');
    try {
      if (editingId) {
        await adminUpdateCounsellor({ counsellorId: editingId, ...form });
      } else {
        await adminCreateCounsellor(form);
      }
      setForm({ name: '', specialization: '', feePerSessionINR: 0 });
      setEditingId(null);
      await load();
    } catch (e) {
      setErr(e?.message || 'Save failed');
    }
  };

  const startEdit = (c) => {
    const id = pickId(c, 0);
    setEditingId(id);
    setForm({
      name: c?.name || '',
      specialization: c?.specialization || '',
      feePerSessionINR: c?.feePerSessionINR ?? 0,
    });
  };

  const remove = async (c) => {
    const id = pickId(c, 0);
    if (!id) return setErr('Unable to determine counsellor id.');
    if (!confirm('Delete counsellor?')) return;
    setErr('');
    try {
      await adminDeleteCounsellor(id);
      await load();
    } catch (e) {
      setErr(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Counsellors</h1>
      {err && <p className="text-red-600">{err}</p>}

      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">{editingId ? 'Edit counsellor' : 'Add counsellor'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="border rounded-lg p-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="border rounded-lg p-2"
            placeholder="Specialization"
            value={form.specialization}
            onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
          />
          <input
            className="border rounded-lg p-2"
            type="number"
            placeholder="Fee (INR)"
            value={form.feePerSessionINR}
            onChange={(e) =>
              setForm((f) => ({ ...f, feePerSessionINR: Number(e.target.value) }))
            }
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-black text-white" onClick={save}>
            {editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => {
                setEditingId(null);
                setForm({ name: '', specialization: '', feePerSessionINR: 0 });
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Specialization</th>
              <th className="text-left p-3">Fee</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => {
              const key = pickId(c, i);
              return (
                <tr key={key} className="border-t">
                  <td className="p-3">{c?.name}</td>
                  <td className="p-3">{c?.specialization}</td>
                  <td className="p-3">₹{c?.feePerSessionINR ?? 0}</td>
                  <td className="p-3 text-right space-x-2">
                    <button className="px-3 py-1 rounded border" onClick={() => startEdit(c)}>
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white"
                      onClick={() => remove(c)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan={4}>
                  No counsellors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
