// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Login from '@/components/Login';
import Layout from '@/components/Layout';  // ← импорт
import AccountList from '@/components/AccountList';
import EmailList from '@/components/EmailList';
import ComposeEmail from '@/components/ComposeEmail';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading">Загрузка...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Layout />  {/* ← Layout с Outlet внутри */}
        </PrivateRoute>
      }>
        <Route index element={<AccountList />} />
        <Route path="emails" element={<EmailList />} />
        <Route path="compose" element={<ComposeEmail />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
    console.log('✅ App component rendered')
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;