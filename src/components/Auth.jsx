import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            navigate('/');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="icon-bg">
                        <Lock size={32} color="var(--accent)" />
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Securely manage your credentials</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleAuth}>
                    <div className="input-group">
                        <Mail size={20} className="input-icon" />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <Lock size={20} className="input-icon" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '0.5rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                padding: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <button type="submit" disabled={loading} className="primary-btn">
                        {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
