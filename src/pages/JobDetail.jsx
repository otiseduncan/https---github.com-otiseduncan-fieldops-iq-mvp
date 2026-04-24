import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

function JobDetail({ jobs, updateJobStatus, updateJobFields, role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = jobs.find((item) => item.id === Number(id));

  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");

  useEffect(() => {
    if (job) {
      setAssignedTo(job.assignedTo || "");
      setNotes(job.notes || "");
    }
  }, [job]);

  useEffect(() => {
    if (!job) return;
    const timeout = setTimeout(async () => {
      if (notes === (job.notes || "")) return;
      setSaveStatus("saving");
      const result = await updateJobFields(job.id, { notes });
      if (result?.success) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      } else {
        setSaveStatus("error");
      }
    }, 800);
    return () => clearTimeout(timeout);
  }, [notes, job, updateJobFields]);

  if (!job) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Job Not Found</h1>
        <p className="text-slate-400">No job exists for this record.</p>
      </div>
    );
  }

  const handleStatusChange = (event) => {
    updateJobStatus(job.id, event.target.value);
  };

  const formatTime = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    }).format(date);
  };

  const handleArchive = async () => {
    if (window.confirm("Archive this job? It will be hidden from the dashboard.")) {
      const { error } = await supabase
        .from("import_jobs")
        .update({ archived: true }) //
        .eq("id", job.id);

      if (error) {
        console.error("Archive error:", error);
      } else {
        alert("Job archived"); //
        navigate("/dashboard");
      }
    }
  };

  return (
    <div className="pb-20">
      <div className="flex justify-between items-start mb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Detail</h1>
          <p className="text-slate-400">RO #{job.ro}</p>
        </div>
        <div className="text-right text-sm text-slate-400">
          <p>Created: <span className="text-slate-200">{formatTime(job.createdAt)}</span></p>
        </div>
      </div>

      <div className="max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 print:hidden">
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Shop</p>
            <p className="font-semibold mt-1">{job.shop}</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Status</p>
            <select
              value={job.status}
              onChange={handleStatusChange}
              className="w-full mt-2 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 outline-none focus:border-slate-500"
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Hold</option>
              <option>Complete</option>
              <option>Archived</option>
              <option>Cancelled</option>
            </select>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Assigned Technician</p>
            <select
              value={assignedTo}
              onChange={async (e) => {
                const value = e.target.value;
                setAssignedTo(value);
                setSaveStatus("saving");
                const result = await updateJobFields(job.id, { assignedTo: value });
                if (result?.success) {
                  setSaveStatus("saved");
                  setTimeout(() => setSaveStatus("idle"), 1500);
                } else {
                  setSaveStatus("error");
                }
              }}
              className="w-full mt-2 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 outline-none focus:border-slate-500"
            >
              <option value="">Unassigned</option>
              <option value="Tech A">Tech A</option>
              <option value="Tech B">Tech B</option>
              <option value="Tech C">Tech C</option>
            </select>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Issue Type</p>
            <p className="font-semibold mt-1">{job.issue}</p>
          </div>
        </div>

        <div className="mb-4 text-sm h-5 transition-all">
          {saveStatus === "saving" && <span className="text-yellow-400">Saving...</span>}
          {saveStatus === "saved" && <span className="text-green-400">Saved</span>}
          {saveStatus === "error" && <span className="text-red-400">Save failed</span>}
        </div>

        <div className="mb-6">
          <label className="block text-sm text-slate-300 mb-2">Notes</label>
          <textarea
            rows="5"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-slate-500 transition-colors"
            placeholder="Type here to auto-save notes..."
          ></textarea>
        </div>

        {job.photoUrl && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="block text-sm text-slate-300">Job Photo</p>
              <p className="text-xs text-slate-400">Uploaded: {formatTime(job.photoUploadedAt)}</p>
            </div>
            <img
              src={job.photoUrl}
              alt={`Job ${job.ro}`}
              className="w-full max-w-2xl rounded-xl border border-slate-700"
            />
          </div>
        )}
      </div>

      {/* ACTIVITY LOG */}
      <div className="max-w-4xl mb-8 print:hidden">
        <h2 className="text-lg font-semibold mb-4 text-slate-300">Activity Log</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          {job.statusHistory && job.statusHistory.length > 0 ? (
            <ul className="space-y-4">
              {job.statusHistory.map((log, index) => (
                <li key={index} className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-slate-200">Status changed to <span className="font-semibold text-white">{log.status}</span></span>
                  </span>
                  <span className="text-slate-500">{formatTime(log.timestamp)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">No status history available for this job.</p>
          )}
        </div>
      </div>

      {/* INVOICE PREVIEW BLOCK */}
      <div className="max-w-4xl bg-slate-950 border border-slate-700 rounded-xl p-6 print:bg-white print:text-black print:border-none print:m-0 print:p-0">
        <h2 className="text-xl font-semibold mb-4">Invoice</h2>

        <div className="space-y-2">
          <p><strong>RO:</strong> {job.ro}</p>
          <p><strong>Shop:</strong> {job.shop}</p>
          <p><strong>Issue:</strong> {job.issue}</p>
          <p><strong>Technician:</strong> {job.assignedTo || "Unassigned"}</p>
        </div>

        <p className="mt-4 text-lg">
          <strong>Total:</strong> $250.00
        </p>

        <div className="flex gap-4 mt-6 print:hidden">
          {/* PRINT BUTTON */}
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-semibold transition"
          >
            Print Invoice
          </button>

          {/* ARCHIVE BUTTON */}
          {role === "manager" && (
            <button
              onClick={handleArchive}
              className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-xl font-semibold transition"
            >
              Archive Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobDetail;