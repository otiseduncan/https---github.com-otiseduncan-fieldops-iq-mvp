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
  const [role, setRole] = useState(null); // Changed: default to null while loading
  const [loading, setLoading] = useState(true); // Added: global loading state

  // 1. Auth & Profile Listener
  useEffect(() => {
    const fetchProfile = async (user) => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (data) {
        setRole(data.role);
      } else {
        console.error("Error fetching profile:", error);
        setRole("tech"); // Fallback if no profile exists
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchProfile(session.user);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch jobs + Realtime
  useEffect(() => {
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
        ...data,
        assignedTo: data.assigned_to,
        photoUrl: data.photo_url,
        photoPath: data.photo_path,
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

  // 3. Render Logic
  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <BrowserRouter>
      {!session ? (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
          <Login />
        </div>
      ) : (
        <Layout role={role}> {/* Removed setRole prop: No longer switchable manually */}
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
                  <div className="p-6 text-red-400 font-bold">Error: Only Techs can create new jobs.</div>
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
                  <div className="p-6 text-red-400 font-bold">Error: Manager access required.</div>
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