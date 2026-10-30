import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ExploreQuizzesPage from './pages/ExploreQuizzesPage';
import QuizDetailsPage from './pages/QuizDetailsPage';
import ExaminationPage from './pages/ExaminationPage';

// Dashboard Pages
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardOverviewPage from './pages/dashboard/DashboardOverviewPage';
import MyQuizzesPage from './pages/dashboard/MyQuizzesPage';
import CreateOrEditQuizPage from './pages/dashboard/CreateOrEditQuizPage';
import HostQuizResultsPage from './pages/dashboard/HostQuizResultsPage';
import MyAttemptsPage from './pages/dashboard/MyAttemptsPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import SettingsPage from './pages/dashboard/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/explore" element={<ExploreQuizzesPage />} />
            <Route path="/quiz/:id" element={<QuizDetailsPage />} />
            <Route path="/exam/:id" element={<ExaminationPage />} />

            {/* Authenticated Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOverviewPage />} />
              <Route path="my-quizzes" element={<MyQuizzesPage />} />
              <Route path="create-quiz" element={<CreateOrEditQuizPage />} />
              <Route path="edit-quiz/:id" element={<CreateOrEditQuizPage />} />
              <Route path="quizzes/:id/results" element={<HostQuizResultsPage />} />
              <Route path="my-attempts" element={<MyAttemptsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
