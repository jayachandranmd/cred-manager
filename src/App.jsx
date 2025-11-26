import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<Dashboard />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
