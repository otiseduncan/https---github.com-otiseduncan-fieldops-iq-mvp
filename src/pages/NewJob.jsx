import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function NewJob({ addJob }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ro: "",
    shop: "",
    issue: "",
    notes: "",
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setPhotoFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // === UPDATED VALIDATION - Photo and Notes are now REQUIRED ===
    if (!formData.ro || !formData.shop || !formData.issue) {
      alert("RO, Shop, and Issue are required");
      return;
    }

    if (!formData.notes || formData.notes.trim() === "") {
      alert("Notes are required. Please add detailed notes for this job.");
      return;
    }

    if (!photoFile) {
      alert("Job Photo is required. Please upload a photo.");
      return;
    }

    setUploading(true);

    let photoUrl = null;

    try {
      // Photo Upload
      const fileExt = photoFile.name.split(".").pop();
      const safeRo = formData.ro.trim().replace(/[^a-z0-9]/gi, '_') || `job-${Date.now()}`;
      const fileName = `${safeRo}-${Date.now()}.${fileExt}`;
      const filePath = `job-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("job-photos")
        .upload(filePath, photoFile);

      if (uploadError) {
        console.error("Photo upload error:", uploadError);
        alert(`Photo upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("job-photos")
        .getPublicUrl(filePath);

      photoUrl = publicUrlData.publicUrl;
const photoUploadedAt = new Date().toISOString();

// Prepare job data
const newJob = {
  ro: formData.ro.trim(),
  shop: formData.shop.trim(),
  issue: formData.issue.trim(),
  notes: formData.notes.trim(),
  assignedTo: "",
  photoUrl,
  photoUploadedAt,
};

      const result = await addJob(newJob);

      if (result?.success) {
        alert("✅ Job created successfully!");
        navigate("/dashboard");
      } else {
        alert(`❌ Failed to save job: ${result?.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Critical Error:", err);
      alert("An unexpected error occurred. Check the console.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">New Job</h1>
      <p className="text-slate-400 mb-6">Create a new field service job</p>

      <div className="max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">RO Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="ro"
              value={formData.ro}
              onChange={handleChange}
              placeholder="2400912345"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Shop Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="shop"
              value={formData.shop}
              onChange={handleChange}
              placeholder="Macon"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Issue Type <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              placeholder="Calibration Required"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Notes <span className="text-red-500">*</span></label>
            <textarea
              rows="5"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add detailed notes here... (Required)"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-slate-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Job Photo <span className="text-red-500">*</span></label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">Must upload a photo of the vehicle/setup</p>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 transition px-4 py-3 font-semibold disabled:opacity-50 text-white mt-4"
          >
            {uploading ? "Creating Job..." : "Create Job"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewJob;