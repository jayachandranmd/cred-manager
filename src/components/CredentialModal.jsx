import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { hashPassword } from '../utils/crypto';
import { X, Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export default function CredentialModal({ credential, onClose, onSave }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(credential ? 'verify' : 'form'); // 'verify' or 'form'
    const [securityPin, setSecurityPin] = useState('');
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        platform: credential?.platform || '',
        username: credential?.username || '',
        password: credential?.password || ''
    });

    const verifyPin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const hash = await hashPassword(securityPin);
            const { data, error } = await supabase
                .from('profiles')
                .select('secondary_password_hash')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data.secondary_password_hash === hash) {
                setStep('form');
            } else {
                setError('Incorrect Security PIN');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (credential) {
                const { error } = await supabase
                    .from('credentials')
                    .update(formData)
                    .eq('id', credential.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('credentials')
                    .insert([{ ...formData, user_id: user.id }]);
                if (error) throw error;
            }
            onSave();
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
                    <h2>{credential ? 'Edit Credential' : 'Add Credential'}</h2>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {step === 'verify' ? (
                    <form onSubmit={verifyPin}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Please enter your Security PIN to edit this credential.
                        </p>
                        <div className="input-group">
                            <Lock size={20} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Security PIN"
                                value={securityPin}
                                onChange={(e) => setSecurityPin(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="primary-btn">
                            {loading ? <Loader2 className="animate-spin" /> : 'Verify PIN'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Platform / Website</label>
                            <input
                                type="text"
                                placeholder="e.g. Netflix, Gmail"
                                value={formData.platform}
                                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>Username / Email</label>
                            <input
                                type="text"
                                placeholder="username@example.com"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
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
                                        justifyContent: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="primary-btn">
                            {loading ? <Loader2 className="animate-spin" /> : (credential ? 'Save Changes' : 'Add Credential')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
