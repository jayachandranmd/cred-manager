import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { hashPassword } from '../utils/crypto';
import { X, Loader2, Lock } from 'lucide-react';

export default function SecurityPinModal({ isOpen, onClose, onSuccess, title = "Security Verification", message = "Please enter your Security PIN to continue." }) {
    const { user } = useAuth();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const hash = await hashPassword(pin);
            const { data, error } = await supabase
                .from('profiles')
                .select('secondary_password_hash')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data.secondary_password_hash === hash) {
                onSuccess();
                onClose();
                setPin('');
            } else {
                setError('Incorrect Security PIN');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        {message}
                    </p>
                    <div className="input-group">
                        <Lock size={20} className="input-icon" />
                        <input
                            type="password"
                            placeholder="Security PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading} className="primary-btn">
                        {loading ? <Loader2 className="animate-spin" /> : 'Verify PIN'}
                    </button>
                </form>
            </div>
        </div>
    );
}
