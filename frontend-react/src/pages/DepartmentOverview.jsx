// Department Overview Page
// For HOD/Faculty to view all team consultations and manage members

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultationAPI, memberAPI } from '../services/api';

function DepartmentOverview() {
  const navigate = useNavigate();
  
  // State
  const [consultations, setConsultations] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Sample data for the chart
  const monthlyStats = [
    { category: 'Thesis', count: 25, color: 'bg-blue-500' },
    { category: 'Sample Size', count: 18, color: 'bg-green-500' },
    { category: 'Data Mgmt', count: 15, color: 'bg-yellow-500' },
    { category: 'Review', count: 22, color: 'bg-purple-500' },
  ];

  const maxCount = Math.max(...monthlyStats.map(s => s.count));

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load common consultations for the team
      const consultData = await consultationAPI.getCommonConsultations();
      setConsultations(consultData);
      
      // Load team members
      const memberData = await memberAPI.getManagedMembers();
      setMembers(memberData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark">
      {/* Top Navigation Bar */}
      <nav className="bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-white font-bold text-xl tracking-wider">HOD DASHBOARD</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-white hover:text-gray-100 p-2 rounded-full">
                <span className="material-icons">notifications</span>
              </button>
              <button className="text-white hover:text-gray-100 p-2 rounded-full">
                <span className="material-icons">account_circle</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-surface-light dark:bg-surface-dark shadow-lg flex flex-col border-r border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="space-y-4">
              <button
                onClick={() => navigate('/new-consultation')}
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg shadow-sm transition flex items-center justify-center space-x-2"
              >
                <span className="material-icons text-sm">add</span>
                <span>New Entry</span>
              </button>
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg shadow-sm transition flex items-center justify-center space-x-2"
              >
                <span className="material-icons text-sm">group</span>
                <span>Add Member</span>
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg shadow-sm transition flex items-center justify-center space-x-2"
              >
                <span className="material-icons text-sm">assessment</span>
                <span>Report</span>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="px-6 py-4 space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-left px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Personal Dashboard
            </button>
            <button
              onClick={() => navigate('/department')}
              className="w-full text-left px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg"
            >
              Department Overview
            </button>
          </div>

          <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="material-icons text-gray-400">help_outline</span>
              <span>Help &amp; Support</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">
                Department Overview
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage consultations and department members.
              </p>
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg shadow-md transition flex items-center space-x-2"
            >
              <span className="material-icons">person_add</span>
              <span>Add Member</span>
            </button>
          </div>

          <div className="space-y-8">
            {/* Monthly Consultations Chart */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <span className="material-icons text-primary mr-2">bar_chart</span>
                  Total Monthly Consultations
                </h2>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="form-select block w-32 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-sm"
                >
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Year</option>
                </select>
              </div>

              {/* Bar Chart */}
              <div className="h-64 flex items-end justify-around space-x-2 px-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                {monthlyStats.map((stat) => (
                  <div key={stat.category} className="group flex flex-col items-center flex-1 h-full justify-end cursor-pointer">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 opacity-0 group-hover:opacity-100 transition">
                      {stat.count}
                    </div>
                    <div
                      className={`w-full ${stat.color} hover:opacity-80 rounded-t transition-all`}
                      style={{ height: `${(stat.count / maxCount) * 100}%` }}
                    ></div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2">
                      {stat.category}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-center text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <span className="w-3 h-3 bg-primary rounded-full mr-2"></span>
                  Consultations by Category
                </span>
              </div>
            </div>

            {/* Team Members Table */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <span className="material-icons text-primary mr-2">groups</span>
                  Team Members Activity
                </h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="search"
                    placeholder="Search members..."
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                    Loading team data...
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Consultations
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          This Month
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-surface-dark divide-y divide-gray-200 dark:divide-gray-700">
                      {/* Sample data - replace with actual members */}
                      {[
                        { name: 'Dr. Sarah Johnson', role: 'Faculty', dept: 'Biostatistics', total: 45, month: 12 },
                        { name: 'Dr. Michael Chen', role: 'Faculty', dept: 'Data Science', total: 38, month: 10 },
                        { name: 'Dr. Emily Davis', role: 'Member', dept: 'Research', total: 22, month: 8 },
                        { name: 'Dr. James Wilson', role: 'Member', dept: 'Analytics', total: 31, month: 9 },
                      ].map((member, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {member.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {member.dept}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {member.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {member.month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button
                              onClick={() => navigate(`/member/${idx + 1}`)}
                              className="text-primary hover:text-primary-hover"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DepartmentOverview;
