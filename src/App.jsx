import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { supabase } from "./lib/supabaseClient";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewJob from "./pages/NewJob";
import JobDetail from "./pages/JobDetail";
import Analytics from "./pages/Analytics";

function App() {
  const [jobs, setJobs] = useState([]);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (user) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setRole(data?.role || "tech");
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user);
      else { setRole(null); setLoading(false); }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from("import_jobs")
        .select("*")
        .eq("archived", false)
        .order("id", { ascending: false });

      if (error) { console.error(error); return; }
      setJobs(data.map(job => ({
  ...job,
  assignedTo: job.assigned_to,
  photoUrl: job.photo_url,
  photoUploadedAt: job.photo_uploaded_at,
  statusHistory: job.status_history || [],
  createdAt: job.created_at
})));
    };

    fetchJobs();
    const channel = supabase.channel("jobs-realtime").on("postgres_changes", { event: "*", schema: "public", table: "import_jobs" }, () => fetchJobs()).subscribe();
    return () => supabase.removeChannel(channel);
  }, [session]);

  // FIXED: assigned_to now uses empty string instead of null
  const addJob = async (newJob) => {
    const { data, error } = await supabase
      .from("import_jobs")
      .insert([{
        ro: newJob.ro.trim(),
        shop: newJob.shop.trim(),
        status: "Pending",
        issue: newJob.issue.trim(),
        assigned_to: newJob.assignedTo || "",        // ← Fixed here
        notes: newJob.notes?.trim() || "",
        photo_url: newJob.photoUrl || null,
photo_uploaded_at: newJob.photoUploadedAt || null,
archived: false,
status_history: [{ status: "Pending", timestamp: new Date().toISOString() }]
      }])
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  };

  const updateJobStatus = async (jobId, newStatus) => {
    const job = jobs.find(j => j.id === jobId);
    const updatedHistory = [...(job?.statusHistory || []), { status: newStatus, timestamp: new Date().toISOString() }];
    await supabase.from("import_jobs").update({ status: newStatus, status_history: updatedHistory }).eq("id", jobId);
  };

  const archiveAllCompleted = async () => {
    const completedJobs = jobs.filter(j => j.status === "Complete");
    
    if (completedJobs.length === 0) {
      alert("No completed jobs found to archive.");
      return;
    }

    const timestamp = new Date().toISOString();
    const updatePromises = completedJobs.map(job => {
      const updatedHistory = [...(job.statusHistory || []), { status: "Archived", timestamp }];
      return supabase
        .from("import_jobs")
        .update({ archived: true, status_history: updatedHistory })
        .eq("id", job.id);
    });

    const results = await Promise.all(updatePromises);
    const hasError = results.some(r => r.error);
    
    if (hasError) {
      alert("Error archiving some jobs. Check console.");
    } else {
      alert(`${completedJobs.length} jobs archived and cleared from dashboard.`);
    }
  };

  const updateJobFields = async (jobId, updates) => {
    const { error } = await supabase.from("import_jobs").update({ 
      assigned_to: updates.assignedTo || "", 
      notes: updates.notes 
    }).eq("id", jobId);
    if (error) console.error(error);
    return { success: !error };
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <BrowserRouter>
      {!session ? (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Login /></div>
      ) : (
        <Layout role={role}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard jobs={jobs} archiveAllCompleted={archiveAllCompleted} />} />
            <Route path="/jobs/new" element={role === "tech" ? <NewJob addJob={addJob} /> : <Navigate to="/" />} />
            <Route path="/jobs/:id" element={<JobDetail jobs={jobs} updateJobStatus={updateJobStatus} updateJobFields={updateJobFields} role={role} />} />
            <Route path="/analytics" element={role === "manager" ? <Analytics jobs={jobs} /> : <Navigate to="/" />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
}

export default App;