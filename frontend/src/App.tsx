import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SetPassword from "./pages/AuthPages/SetPassword";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PersonalDashboard from "./pages/Dashboard/PersonalDashboard";
import NewConsultation from "./pages/Consultations/NewConsultation";
import AllConsultations from "./pages/Consultations/AllConsultations";
import EditConsultation from "./pages/Consultations/EditConsultation";
import DepartmentOverview from "./pages/Department/DepartmentOverview";
import DepartmentFaculties from "./pages/Department/DepartmentFaculties";
import FacultyTeam from "./pages/Department/FacultyTeam";
import Reports from "./pages/Reports/Reports";
import MemberActivity from "./pages/Members/MemberActivity";
import ConsultForm from "./pages/Public/ConsultForm";
import CreateUser from "./pages/Admin/CreateUser";
import UserProfiles from "./pages/UserProfiles";

function InviteRedirect() {
  const hash = window.location.hash;
  if (hash.includes("type=invite") || hash.includes("type=recovery")) {
    window.location.replace("/set-password" + hash);
    return null;
  }
  return null;
}

export default function App() {
  return (
    <Router>
      <InviteRedirect />
      <ScrollToTop />
      <Routes>
        {/* Protected CMA routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* All roles */}
          <Route index path="/" element={<PersonalDashboard />} />
          <Route path="/consultations" element={<AllConsultations />} />
          <Route path="/new-consultation" element={<NewConsultation />} />
          <Route path="/consultation/:id/edit" element={<EditConsultation />} />

          {/* HOD & Faculty only */}
          <Route
            path="/department"
            element={
              <ProtectedRoute allowedRoles={["HOD", "Faculty"]}>
                <DepartmentOverview />
              </ProtectedRoute>
            }
          />
          {/* HOD only — drill-down: department → faculties */}
          <Route
            path="/department/:deptName"
            element={
              <ProtectedRoute allowedRoles={["HOD"]}>
                <DepartmentFaculties />
              </ProtectedRoute>
            }
          />
          {/* HOD only — drill-down: faculty → their team members */}
          <Route
            path="/department/:deptName/faculty/:facultyId"
            element={
              <ProtectedRoute allowedRoles={["HOD"]}>
                <FacultyTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["HOD", "Faculty"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/:memberId"
            element={
              <ProtectedRoute allowedRoles={["HOD", "Faculty"]}>
                <MemberActivity />
              </ProtectedRoute>
            }
          />
          {/* HOD & Faculty — invite new staff */}
          <Route
            path="/create-user"
            element={
              <ProtectedRoute allowedRoles={["HOD", "Faculty"]}>
                <CreateUser />
              </ProtectedRoute>
            }
          />

          {/* All roles — edit own profile */}
          <Route path="/profile" element={<UserProfiles />} />
        </Route>

        {/* Public — no auth, no layout */}
        <Route path="/consult" element={<ConsultForm />} />

        {/* Auth */}
        <Route path="/signin" element={<SignIn />} />

        {/* Invite callback — user sets their password here */}
        <Route path="/set-password" element={<SetPassword />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
