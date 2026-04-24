import { useState } from "react";
import { Link } from "react-router-dom";

// ADDED: archiveAllCompleted as a prop
function Dashboard({ jobs = [], archiveAllCompleted }) {
  const [shopFilter, setShopFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roSearch, setRoSearch] = useState("");

  const filteredJobs = jobs.filter((job) => {
    const matchesShop = shopFilter === "All" || job.shop === shopFilter;
    const matchesRo = (job.ro || "").toLowerCase().includes(roSearch.toLowerCase());

    // UPDATED LOGIC: 
    // If "All Statuses" is selected, hide Archived and Cancelled jobs automatically.
    // If a user specifically selects "Archived" or "Cancelled" in the dropdown, show them.
    if (statusFilter === "All") {
      const isActive = !["Archived", "Cancelled"].includes(job.status);
      return matchesShop && matchesRo && isActive;
    }

    const matchesStatus = job.status === statusFilter;
    return matchesShop && matchesStatus && matchesRo;
  });

  const totalJobs = filteredJobs.length;

  const pendingJobs = filteredJobs.filter(
    (job) => job.status === "Pending"
  ).length;

  const completedJobs = filteredJobs.filter(
    (job) => job.status === "Complete"
  ).length;

  const documentedJobs = filteredJobs.filter(
    (job) => job.photoUrl && job.photoUrl.startsWith("http")
  ).length;

  const uniqueShops = ["All", ...new Set(jobs.map(job => job.shop).filter(Boolean))];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-slate-400 mb-6">Current field jobs overview</p>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Total Jobs</p>
          <h2 className="text-3xl font-bold mt-2">{totalJobs}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Pending</p>
          <h2 className="text-3xl font-bold mt-2">{pendingJobs}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Completed Jobs</p>
          <h2 className="text-3xl font-bold mt-2">{completedJobs}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Documented</p>
          <h2 className="text-3xl font-bold mt-2">{documentedJobs}</h2>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm text-slate-400 mb-2">Search RO</label>
          <input
            type="text"
            placeholder="e.g. 2400912345"
            value={roSearch}
            onChange={(e) => setRoSearch(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2 text-white outline-none focus:border-slate-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex-1">
          <label className="block text-sm text-slate-400 mb-2">Filter by Shop</label>
          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2 text-white outline-none focus:border-slate-500 focus:ring-1 focus:ring-blue-500"
          >
            {uniqueShops.map(shop => (
              <option key={shop} value={shop}>{shop}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm text-slate-400 mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2 text-white outline-none focus:border-slate-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Hold">Hold</option>
            <option value="Complete">Complete</option>
            {/* ADDED ARCHIVE/CANCEL TO FILTER */}
            <option value="Archived">Archived</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => {
            setShopFilter("All");
            setStatusFilter("All");
            setRoSearch("");
          }}
          className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm transition"
        >
          Reset Filters
        </button>

        {/* NEW: Archive Button */}
        <button
          onClick={() => {
            if (window.confirm("Move all 'Complete' jobs to Archive?")) {
              archiveAllCompleted();
            }
          }}
          className="rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-sm transition font-semibold text-white"
        >
          Archive Completed
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-xl font-semibold">Recent Jobs</h2>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredJobs.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              No jobs match your filters
            </div>
          ) : (
            filteredJobs.map((job) => (
              <Link
                to={`/jobs/${job.id}`}
                key={job.id}
                className="block hover:bg-slate-800 transition"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-semibold">RO #{job.ro}</p>
                    <p className="text-slate-400 text-sm">
                      {job.shop} • {job.issue}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                      {job.status}
                    </span>

                    {job.photoUrl && job.photoUrl.startsWith("http") ? (
                      <span className="inline-block rounded-full bg-green-900/40 border border-green-700 px-3 py-1 text-sm text-green-300">
                        Photo Attached
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-red-900/40 border border-red-700 px-3 py-1 text-sm text-red-300">
                        No Photo
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;