import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { GuestRoute } from "@/app/router/GuestRoute";
import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { PlanningPage } from "@/pages/planning/PlanningPage";
import { DoctorsPage } from "@/pages/doctors/DoctorsPage";
import { PatientCardPage } from "@/pages/patients/PatientCardPage";
import { PatientsPage } from "@/pages/patients/PatientsPage";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { SpecializationsPage } from "@/pages/specializations/SpecializationsPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route
            path="doctors"
            element={
              <ProtectedRoute roles={["admin", "doctor"]}>
                <DoctorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="specializations"
            element={
              <ProtectedRoute roles={["admin"]}>
                <SpecializationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="patients"
            element={
              <ProtectedRoute roles={["admin", "doctor"]}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="patients/:id"
            element={
              <ProtectedRoute roles={["admin", "doctor"]}>
                <PatientCardPage />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
