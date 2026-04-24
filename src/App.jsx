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
  const [role, setRole] = useState("manager");

  // 1. Auth listener - Fixed to handle session state properly
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch jobs + Realtime (Restored with Timestamps/History)
  useEffect(() => {
    // Note: If you haven't set up Supabase Auth yet, you can comment 
    // out 'if (!session) return;' to see your dashboard locally
    if (!session) return;

    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from("import_jobs")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      const formattedJobs = (data || []).map((job) => ({
        id: job.id,
        ro: job.ro,
        shop: job.shop,
        status: job.status,
        issue: job.issue,
        assignedTo: job.assigned_to,
        notes: job.notes,
        photoUrl: job.photo_url,
        photoPath: job.photo_path,
        createdAt: job.created_at,
        photoUploadedAt: job.photo_uploaded_at,
        statusHistory: job.status_history || [],
      }));

      setJobs(formattedJobs);
    };

    fetchJobs();

    const channel = supabase
      .channel("jobs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "import_jobs" },
        () => fetchJobs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const addJob = async (newJob) => {
    const timestamp = new Date().toISOString();
    const initialStatus = newJob.status || "Pending";
    const initialHistory = [{ status: initialStatus, timestamp }];

    const { data, error } = await supabase
      .from("import_jobs")
      .insert([
        {
          ro: newJob.ro,
          shop: newJob.shop,
          status: initialStatus,
          issue: newJob.issue,
          assigned_to: newJob.assignedTo,
          notes: newJob.notes,
          photo_url: newJob.photoUrl,
          photo_path: newJob.photoPath,
          status_history: initialHistory,
          photo_uploaded_at: newJob.photoUrl ? timestamp : null,
        },
      ])
      .select()
      .single();

    if (error) return { success: false };

    setJobs((prev) => [
      {
        id: data.id,
        ro: data.ro,
        shop: data.shop,
        status: data.status,
        issue: data.issue,
        assignedTo: data.assigned_to,
        notes: data.notes,
        photoUrl: data.photo_url,
        photoPath: data.photo_path,
        createdAt: data.created_at,
        photoUploadedAt: data.photo_uploaded_at,
        statusHistory: data.status_history || [],
      },
      ...prev,
    ]);

    return { success: true };
  };

  const updateJobStatus = async (jobId, newStatus) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const timestamp = new Date().toISOString();
    const updatedHistory = [
      ...(job.statusHistory || []),
      { status: newStatus, timestamp }
    ];

    await supabase
      .from("import_jobs")
      .update({ 
        status: newStatus,
        status_history: updatedHistory 
      })
      .eq("id", jobId);

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus, statusHistory: updatedHistory } : j))
    );
  };

  const archiveAllCompleted = async () => {
    const completedJobs = jobs.filter(j => j.status === "Complete");
    if (completedJobs.length === 0) return;

    const timestamp = new Date().toISOString();
    const updatePromises = completedJobs.map(job => {
      const updatedHistory = [...(job.statusHistory || []), { status: "Archived", timestamp }];
      return supabase
        .from("import_jobs")
        .update({ status: "Archived", status_history: updatedHistory })
        .eq("id", job.id);
    });

    await Promise.all(updatePromises);
  };

  const updateJobFields = async (jobId, updates) => {
    const dbUpdates = {};
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { data, error } = await supabase
      .from("import_jobs")
      .update(dbUpdates)
      .eq("id", jobId)
      .select()
      .single();

    if (error) return { success: false };

    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, assignedTo: data.assigned_to, notes: data.notes } : j
      )
    );

    return { success: true };
  };

  return (
    <BrowserRouter>
      {/* If not logged in, we render Login inside the Router/Layout context */}
      {!session ? (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
          <Login />
        </div>
      ) : (
        <Layout role={role} setRole={setRole}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route 
              path="/dashboard" 
              element={<Dashboard jobs={jobs} archiveAllCompleted={archiveAllCompleted} />} 
            />
            <Route
              path="/jobs/new"
              element={
                role === "tech" ? (
                  <NewJob addJob={addJob} jobs={jobs} />
                ) : (
                  <div className="p-6 text-red-400">Access denied</div>
                )
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <JobDetail
                  jobs={jobs}
                  updateJobStatus={updateJobStatus}
                  updateJobFields={updateJobFields}
                />
              }
            />
            <Route
              path="/analytics"
              element={
                role === "manager" ? (
                  <Analytics jobs={jobs} />
                ) : (
                  <div className="p-6 text-red-400">Access denied</div>
                )
              }
            />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
}

export default App;