// Reports Page
// Generate and view consultation reports

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportAPI } from '../services/api';

function Reports() {
  const navigate = useNavigate();
  
  // State
  const [reportType, setReportType] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Sample report data
  const sampleStats = {
    total_consultations: 87,
    by_category: {
      'Thesis Analysis': 25,
      'Sample Size Calculation': 18,
      'Data Management': 15,
      'Statistical Review': 22,
      'Research Design': 7,
    },
    by_department: {
      'Cardiology': 15,
      'Oncology': 22,
      'Pediatrics': 12,
      'Surgery': 18,
      'Internal Medicine': 20,
    },
    top_consultants: [
      { name: 'Dr. Sarah Johnson', count: 25 },
      { name: 'Dr. Michael Chen', count: 22 },
      { name: 'Dr. Emily Davis', count: 18 },
    ],
  };

  // Generate report
  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let data;
      if (reportType === 'monthly') {
        data = await reportAPI.getMonthlyReport(selectedYear, selectedMonth);
      } else {
        data = await reportAPI.getDateRangeReport(startDate, endDate);
      }
      setReportData(data);
    } catch (err) {
      console.error('Failed to generate report:', err);
      // Use sample data for demo
      setReportData(sampleStats);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    alert('Export functionality would download CSV/PDF here');
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Sidebar */}
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 h-full flex flex-col border-r border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark flex-shrink-0">
          <div className="p-6 pb-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary/20 rounded-full h-10 w-10 flex items-center justify-center">
                <span className="material-icons text-primary">analytics</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-gray-900 dark:text-white text-base font-bold leading-tight">
                  CMS Reports
                </h1>
                <p className="text-primary text-xs font-medium uppercase tracking-wider">
                  Analytics
                </p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
              >
                <span className="material-icons text-[24px]">dashboard</span>
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              <button
                onClick={() => navigate('/new-consultation')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
              >
                <span className="material-icons text-[24px]">chat_bubble</span>
                <span className="text-sm font-medium">Consultations</span>
              </button>
              <button
                onClick={() => navigate('/department')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
              >
                <span className="material-icons text-[24px]">groups</span>
                <span className="text-sm font-medium">Department</span>
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary dark:text-primary dark:bg-primary/20 transition-colors"
              >
                <span className="material-icons text-[24px]">description</span>
                <span className="text-sm font-bold">Reports</span>
              </button>
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-border-light dark:border-border-dark">
            <div className="bg-primary/5 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-icons text-sm">info</span>
                <span className="text-xs font-bold uppercase">System Status</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Database sync active. Last update 5m ago.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-full flex flex-col overflow-y-auto">
          {/* Breadcrumbs & Header */}
          <header className="w-full px-8 pt-8 pb-4 flex flex-col gap-6 max-w-[1200px] mx-auto">
            <nav className="flex items-center gap-2 text-sm">
              <button onClick={() => navigate('/dashboard')} className="text-primary hover:text-primary-hover transition-colors font-medium">
                Home
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 dark:text-white font-medium">Reports</span>
            </nav>

            <div className="flex flex-wrap justify-between items-end gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Consultation Reports
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  Generate comprehensive consultation analytics and summaries
                </p>
              </div>
            </div>
          </header>

          {/* Main Workspace */}
          <div className="flex-1 px-8 pb-12 w-full max-w-[1200px] mx-auto flex flex-col gap-8">
            {/* Controls & Filters */}
            <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="mr-auto">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Report Configuration
                  </h3>
                </div>

                {/* Report Type */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="form-select rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="daterange">Date Range</option>
                  </select>
                </div>

                {/* Month/Year or Date Range */}
                {reportType === 'monthly' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Month:</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="form-select rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year:</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="form-select rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="form-input rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="form-input rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg shadow-md transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <span className="material-icons text-sm">play_arrow</span>
                  <span>{loading ? 'Generating...' : 'Generate Report'}</span>
                </button>
              </div>
            </section>

            {/* Report Preview */}
            {reportData && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summary Cards */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Consultations</h3>
                    <span className="material-icons text-primary">analytics</span>
                  </div>
                  <p className="text-4xl font-bold text-primary">{reportData.total_consultations}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">In selected period</p>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">By Category</h3>
                    <span className="material-icons text-primary">category</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(reportData.by_category).slice(0, 3).map(([category, count]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{category}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Consultants</h3>
                    <span className="material-icons text-primary">emoji_events</span>
                  </div>
                  <div className="space-y-2">
                    {reportData.top_consultants.map((consultant, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{consultant.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{consultant.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="lg:col-span-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Summary</h3>
                    <button
                      onClick={handleExport}
                      className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
                    >
                      <span className="material-icons text-sm">download</span>
                      <span>Export</span>
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      {/* By Department */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Consultations by Department</h4>
                        <div className="space-y-3">
                          {Object.entries(reportData.by_department).map(([dept, count]) => (
                            <div key={dept} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-600 dark:text-gray-400">{dept}</span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${(count / reportData.total_consultations) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* By Category */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Consultations by Reason</h4>
                        <div className="space-y-3">
                          {Object.entries(reportData.by_category).map(([category, count]) => (
                            <div key={category} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-600 dark:text-gray-400">{category}</span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${(count / reportData.total_consultations) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {!reportData && !loading && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <span className="material-icons text-6xl mb-4">assessment</span>
                <p>Select parameters and click "Generate Report" to view analytics</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Reports;
