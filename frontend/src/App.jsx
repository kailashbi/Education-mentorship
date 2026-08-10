import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { MentorDirectory } from './pages/MentorDirectory';
import { MentorDetail } from './pages/MentorDetail';
import { Login } from './pages/Login';
import { MenteeRegister } from './pages/MenteeRegister';
import { MentorApply } from './pages/MentorApply';
import { PendingApproval } from './pages/PendingApproval';
import { AdminDashboard } from './pages/AdminDashboard';
import { MentorDashboard } from './pages/MentorDashboard';
import { MenteeDashboard } from './pages/MenteeDashboard';
import { WebRTCVideoCall } from './pages/WebRTCVideoCall';
import { ChatPage } from './pages/ChatPage';
import { ProfileSettings } from './pages/ProfileSettings';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />

          <main className="container" style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/mentors" element={<MentorDirectory />} />
              <Route path="/mentors/:id" element={<MentorDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<MenteeRegister />} />
              <Route path="/apply" element={<MentorApply />} />
              <Route path="/pending-approval" element={<PendingApproval />} />

              {/* Role-Protected Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentor/dashboard"
                element={
                  <ProtectedRoute roles={['mentor']}>
                    <MentorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentee/dashboard"
                element={
                  <ProtectedRoute roles={['mentee']}>
                    <MenteeDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Shared Authenticated Routes */}
              <Route
                path="/session/call/:sessionId"
                element={
                  <ProtectedRoute>
                    <WebRTCVideoCall />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
