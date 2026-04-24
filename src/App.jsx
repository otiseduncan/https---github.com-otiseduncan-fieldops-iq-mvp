import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { supabase } from "./lib/supabaseClient";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewJob from "./pages/NewJob";
import JobDetail from "./pages/JobDetail";
import Analytics from "./pages/Analytics";

function App() {
  const [jobs, setJobs] = useState([]);
  const [role, setRole] = useState("manager");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from("import_jobs")
          .select("*")
          .order("id", { ascending: false });

        if (error) {
          console.error("Error fetching jobs:", error);
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
      } catch (err) {
        console.error("Supabase fetch crashed:", err);
      }
    };

    fetchJobs();

    const channel = supabase
      .channel("import_jobs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "import_jobs" },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
          photo_url: newJob.photoUrl || null,
          photo_path: newJob.photoPath || null,
          status_history: initialHistory,
          photo_uploaded_at: newJob.photoUrl ? timestamp : null,
        },
      ])
      .select()
      .single();

    if (error) return { success: false, error };

    const formattedJob = {
      ...data,
      assignedTo: data.assigned_to,
      photoUrl: data.photo_url,
      statusHistory: data.status_history || [],
    };

    setJobs((currentJobs) => [formattedJob, ...currentJobs]);
    return { success: true, job: formattedJob };
  };

  const updateJobStatus = async (jobId, newStatus) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const timestamp = new Date().toISOString();
    const updatedHistory = [
      ...(job.statusHistory || []),
      { status: newStatus, timestamp }
    ];

    const { data, error } = await supabase
      .from("import_jobs")
      .update({ 
        status: newStatus, 
        status_history: updatedHistory 
      })
      .eq("id", jobId)
      .select()
      .single();

    if (error) {
      console.error("Error updating status:", error);
      return;
    }

    setJobs((currentJobs) =>
      currentJobs.map((j) =>
        j.id === jobId ? { ...j, status: data.status, statusHistory: data.status_history } : j
      )
    );
  };

  // NEW: Bulk Archive Function for End of Day
  const archiveAllCompleted = async () => {
    const completedJobs = jobs.filter(j => j.status === "Complete");
    if (completedJobs.length === 0) return;

    const timestamp = new Date().toISOString();
    
    // We update them one by one to ensure the status_history is preserved correctly for each
    const updatePromises = completedJobs.map(job => {
      const updatedHistory = [
        ...(job.statusHistory || []),
        { status: "Archived", timestamp }
      ];
      return supabase
        .from("import_jobs")
        .update({ status: "Archived", status_history: updatedHistory })
        .eq("id", job.id);
    });

    await Promise.all(updatePromises);
    // Realtime listener will handle the UI refresh
  };

  const updateJobFields = async (jobId, updates) => {
    const dbUpdates = {};
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.issue !== undefined) dbUpdates.issue = updates.issue;

    const { data, error } = await supabase
      .from("import_jobs")
      .update(dbUpdates)
      .eq("id", jobId)
      .select()
      .single();

    if (error) return { success: false, error };

    setJobs((currentJobs) =>
      currentJobs.map((job) =>
        job.id === jobId ? { ...job, ...updates } : job
      )
    );
    return { success: true };
  };

  return (
    <BrowserRouter>
      <Layout role={role} setRole={setRole}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={<Dashboard jobs={jobs} archiveAllCompleted={archiveAllCompleted} updateJobStatus={updateJobStatus} />} 
          />
          <Route
            path="/jobs/new"
            element={role === "tech" ? <NewJob addJob={addJob} jobs={jobs} /> : <div className="p-6 text-red-400">Access denied</div>}
          />
          <Route
            path="/jobs/:id"
            element={<JobDetail jobs={jobs} updateJobStatus={updateJobStatus} updateJobFields={updateJobFields} />}
          />
          <Route 
            path="/analytics" 
            element={role === "manager" ? <Analytics jobs={jobs} /> : <div className="p-6 text-red-400">Access denied</div>} 
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;