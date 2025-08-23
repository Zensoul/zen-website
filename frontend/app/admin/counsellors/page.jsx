// frontend/app/admin/counsellors/page.jsx
"use client";
import { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

export default function AdminCounsellorsPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: "", specialization: "", feePerSessionINR: 0 });
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");

  const load = () =>
    apiGet("/admin/counsellors")
      .then((res) => setRows(res.counsellors || []))
      .catch((e) => setErr(e.message || "Failed"));

  useEffect(() => { load(); }, []);

  const save = async () => {
    setErr("");
    try {
      if (editing) {
        await apiPut(`/admin/counsellors/${editing}`, form);
      } else {
        await apiPost("/admin/counsellors", form);
      }
      setForm({ name: "", specialization: "", feePerSessionINR: 0 });
      setEditing(null);
      load();
    } catch (e) {
      setErr(e.message || "Save failed");
    }
  };

  const startEdit = (c) => {
    setEditing(c._id);
    setForm({
      name: c.name || "",
      specialization: c.specialization || "",
      feePerSessionINR: c.feePerSessionINR || 0,
    });
  };

  const remove = async (id) => {
    if (!confirm("Delete counsellor?")) return;
    setErr("");
    try {
      await apiDelete(`/admin/counsellors/${id}`);
      load();
    } catch (e) {
      setErr(e.message || "Delete failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Counsellors</h1>
      {err && <p className="text-red-600">{err}</p>}

      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">{editing ? "Edit counsellor" : "Add counsellor"}</h2>
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
            onChange={(e) => setForm((f) => ({ ...f, feePerSessionINR: Number(e.target.value) }))}
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-black text-white" onClick={save}>
            {editing ? "Update" : "Create"}
          </button>
          {editing && (
            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => { setEditing(null); setForm({ name: "", specialization: "", feePerSessionINR: 0 }); }}
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
            {rows.map((c) => (
              <tr key={c._id} className="border-t">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.specialization}</td>
                <td className="p-3">₹{c.feePerSessionINR}</td>
                <td className="p-3 text-right space-x-2">
                  <button className="px-3 py-1 rounded border" onClick={() => startEdit(c)}>Edit</button>
                  <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => remove(c._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan={4}>No counsellors yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
