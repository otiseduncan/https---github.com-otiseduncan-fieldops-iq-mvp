function Analytics({ jobs }) {
  const jobsByShop = jobs.reduce((accumulator, job) => {
    accumulator[job.shop] = (accumulator[job.shop] || 0) + 1;
    return accumulator;
  }, {});

  const jobsByIssue = jobs.reduce((accumulator, job) => {
    accumulator[job.issue] = (accumulator[job.issue] || 0) + 1;
    return accumulator;
  }, {});

  const jobsByStatus = jobs.reduce((accumulator, job) => {
    accumulator[job.status] = (accumulator[job.status] || 0) + 1;
    return accumulator;
  }, {});

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Analytics</h1>
      <p className="text-slate-400 mb-6">Live operational breakdown from current jobs</p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Total Jobs</p>
          <h2 className="text-3xl font-bold mt-2">{jobs.length}</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Pending Jobs</p>
          <h2 className="text-3xl font-bold mt-2">{jobsByStatus["Pending"] || 0}</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Completed Jobs</p>
          <h2 className="text-3xl font-bold mt-2">{jobsByStatus["Complete"] || 0}</h2>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Jobs by Shop</h2>
          <div className="space-y-3">
            {Object.entries(jobsByShop).map(([shop, count]) => (
              <div key={shop} className="flex justify-between">
                <span>{shop}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Jobs by Issue Type</h2>
          <div className="space-y-3">
            {Object.entries(jobsByIssue).map(([issue, count]) => (
              <div key={issue} className="flex justify-between">
                <span>{issue}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">Jobs by Status</h2>
        <div className="space-y-3">
          {Object.entries(jobsByStatus).map(([status, count]) => (
            <div key={status} className="flex justify-between">
              <span>{status}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Analytics;