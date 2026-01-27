// Main App Component
// Sets up routing for the entire application

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AutoLogin from './components/AutoLogin';

// Import all page components
import PersonalDashboard from './pages/PersonalDashboard';
import NewConsultation from './pages/NewConsultation';
import DepartmentOverview from './pages/DepartmentOverview';
import Reports from './pages/Reports';
import MemberActivity from './pages/MemberActivity';

function App() {
  return (
    <AutoLogin>
      <Router>
        <Routes>
          {/* Main Routes - No Auth for Now */}
          <Route path="/dashboard" element={<PersonalDashboard />} />
          <Route path="/new-consultation" element={<NewConsultation />} />
          <Route path="/department" element={<DepartmentOverview />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/member/:memberId" element={<MemberActivity />} />
          
          {/* Default route - go to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* 404 - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AutoLogin>
  );
}

export default App;
