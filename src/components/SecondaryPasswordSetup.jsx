import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { hashPassword } from '../utils/crypto';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function SecondaryPasswordSetup({ onComplete }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }
        if (password.length < 4) {
            setError("Password must be at least 4 characters");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const hash = await hashPassword(password);
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, secondary_password_hash: hash });

            if (error) throw error;
            onComplete();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="auth-header">
                    <div className="icon-bg">
                        <ShieldCheck size={32} color="var(--accent)" />
                    </div>
                    <h2>Set Security PIN</h2>
                    <p>This password will be required to edit credentials.</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Enter Security PIN"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ paddingLeft: '1rem' }}
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Confirm Security PIN"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{ paddingLeft: '1rem' }}
                        />
                    </div>
                    <button type="submit" disabled={loading} className="primary-btn">
                        {loading ? <Loader2 className="animate-spin" /> : 'Set PIN'}
                    </button>
                </form>
            </div>
        </div>
    );
}
