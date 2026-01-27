// Member Activity Detail Page
// View detailed activity for a specific team member

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { consultationAPI } from '../services/api';

function MemberActivity() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  
  // State
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  
  // Sample member data
  const memberInfo = {
    name: 'Dr. Sarah Johnson',
    role: 'Senior Biostatistician',
    department: 'Biostatistics & Data Science',
    email: 'sarah.johnson@hospital.com',
    totalConsultations: 45,
    thisMonth: 12,
  };

  // Sample monthly data
  const monthlyData = [
    { month: 'Jan', count: 8 },
    { month: 'Feb', count: 10 },
    { month: 'Mar', count: 9 },
    { month: 'Apr', count: 12 },
    { month: 'May', count: 6 },
  ];

  const maxCount = Math.max(...monthlyData.map(d => d.count));

  // Load data on mount
  useEffect(() => {
    loadMemberConsultations();
  }, [memberId]);

  const loadMemberConsultations = async () => {
    try {
      setLoading(true);
      const data = await consultationAPI.getMemberConsultations(memberId);
      setConsultations(data);
    } catch (err) {
      console.error('Failed to load member consultations:', err);
      // Use sample data
      setConsultations([
        {
          id: 1,
          date: '2024-01-15',
          guest_name: 'Dr. Michael Brown',
          department: 'Cardiology',
          profession: 'Medical Doctor',
          reason: 'Thesis Analysis',
          status: 'Completed',
        },
        {
          id: 2,
          date: '2024-01-18',
          guest_name: 'Dr. Lisa Anderson',
          department: 'Oncology',
          profession: 'Researcher',
          reason: 'Sample Size Calculation',
          status: 'In Progress',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary tracking-tight">HOD Dashboard</h1>
        </div>

        <nav className="px-4 space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <span className="material-icons">dashboard</span>
            <span className="font-medium">Overview</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <span className="material-icons">person</span>
            <span className="font-medium">Personal</span>
          </button>
          <button
            onClick={() => navigate('/department')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <span className="material-icons">group</span>
            <span className="font-medium">Common</span>
          </button>
          <button
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-primary text-white shadow-md"
          >
            <span className="material-icons">analytics</span>
            <span className="font-medium">Member Activity</span>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <span className="material-icons">assessment</span>
            <span className="font-medium">Reports</span>
          </button>
        </nav>

        <div className="p-4 mt-8 mx-4 bg-primary/10 rounded-xl dark:bg-primary/5">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              JD
            </div>
            <div>
              <p className="text-sm font-semibold dark:text-white">John Doe</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">HOD</p>
            </div>
          </div>
          <button className="w-full py-2 px-4 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Member Activity Detail</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Biostatistics &amp; Data Science Consultation Tracking
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => alert('Export functionality')}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              <span className="material-icons text-base">file_download</span>
              <span>Export Report</span>
            </button>
            <button
              onClick={() => navigate('/new-consultation')}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-md"
            >
              <span className="material-icons text-base">add</span>
              <span>New Consultation</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Member Info Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-border-light dark:border-border-dark">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Member Profile</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                    {memberInfo.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{memberInfo.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{memberInfo.role}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="material-icons text-gray-400 mr-2 text-base">business</span>
                    <span className="text-gray-600 dark:text-gray-400">{memberInfo.department}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="material-icons text-gray-400 mr-2 text-base">email</span>
                    <span className="text-gray-600 dark:text-gray-400">{memberInfo.email}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">{memberInfo.totalConsultations}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">{memberInfo.thisMonth}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-border-light dark:border-border-dark flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Activity</h3>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border border-border-light dark:border-border-dark rounded-md text-sm px-3 py-1 text-gray-600 dark:text-gray-400 focus:ring-primary focus:border-primary"
              >
                <option>This Month</option>
                <option>Last 3 Months</option>
                <option>Last 6 Months</option>
              </select>
            </div>

            {/* Bar Chart */}
            <div className="flex-1 flex items-end justify-between gap-4 h-48 px-4 pb-2 border-b border-border-light dark:border-border-dark">
              {monthlyData.map((item) => (
                <div key={item.month} className="group flex flex-col items-center flex-1 h-full justify-end cursor-pointer">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div
                    className="w-full bg-primary hover:bg-primary-hover rounded-t transition-all duration-300"
                    style={{ height: `${(item.count / maxCount) * 100}%` }}
                  ></div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Consultations Table */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
          <div className="p-6 border-b border-border-light dark:border-border-dark flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consultation History</h3>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="search"
                placeholder="Search..."
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary focus:border-primary flex-1 md:flex-initial"
              />
              <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md text-sm font-medium transition-colors">
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading consultations...</div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guest Name</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profession</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-surface-dark divide-y divide-gray-200 dark:divide-gray-700">
                  {consultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(consultation.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {consultation.guest_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {consultation.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {consultation.profession}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {consultation.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          consultation.status === 'Completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {consultation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button className="text-primary hover:text-primary-hover">View</button>
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
              <span className="font-medium">{consultations.length}</span> results
            </p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600">
                Previous
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                1
              </button>
              <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600">
                Next
              </button>
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MemberActivity;
