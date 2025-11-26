import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import SecondaryPasswordSetup from '../components/SecondaryPasswordSetup';
import CredentialModal from '../components/CredentialModal';
import SecurityPinModal from '../components/SecurityPinModal';
import { Plus, LogOut, Search, Key, Copy, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';

export default function Dashboard() {
    const { signOut, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [hasSecondaryPassword, setHasSecondaryPassword] = useState(false);
    const [credentials, setCredentials] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCredential, setEditingCredential] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingPasswordId, setViewingPasswordId] = useState(null);

    // Security States
    const [isRevealAuthenticated, setIsRevealAuthenticated] = useState(false);
    const [pinModal, setPinModal] = useState({ isOpen: false, type: null, data: null });

    useEffect(() => {
        checkProfile();
        fetchCredentials();
    }, [user]);

    const checkProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('secondary_password_hash')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data?.secondary_password_hash) {
                setHasSecondaryPassword(true);
            }
        } catch (error) {
            console.error('Error checking profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCredentials = async () => {
        try {
            const { data, error } = await supabase
                .from('credentials')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCredentials(data || []);
        } catch (error) {
            console.error('Error fetching credentials:', error);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
    };

    const initiateDelete = (id) => {
        setPinModal({
            isOpen: true,
            type: 'DELETE',
            data: id
        });
    };

    const confirmDelete = async () => {
        const id = pinModal.data;
        try {
            const { error } = await supabase
                .from('credentials')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setCredentials(credentials.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting credential:', error);
        }
    };

    const handleRevealClick = (id) => {
        if (viewingPasswordId === id) {
            setViewingPasswordId(null);
            return;
        }

        if (isRevealAuthenticated) {
            setViewingPasswordId(id);
        } else {
            setPinModal({
                isOpen: true,
                type: 'REVEAL',
                data: id
            });
        }
    };

    const confirmReveal = () => {
        setIsRevealAuthenticated(true);
        setViewingPasswordId(pinModal.data);
    };

    const filteredCredentials = credentials.filter(c =>
        c.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading-screen">Loading...</div>;

    return (
        <div className="app-container">
            {!hasSecondaryPassword && (
                <SecondaryPasswordSetup onComplete={() => setHasSecondaryPassword(true)} />
            )}

            <header className="dashboard-header">
                <div className="logo-section">
                    <div className="icon-bg-small">
                        <Key size={20} color="var(--accent)" />
                    </div>
                    <h1>My Vault</h1>
                </div>
                <div className="user-section">
                    <span className="user-email">{user.email}</span>
                    <button onClick={signOut} className="secondary-btn">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <div className="dashboard-controls">
                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search credentials..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="primary-btn add-btn" onClick={() => {
                    setEditingCredential(null);
                    setIsModalOpen(true);
                }}>
                    <Plus size={20} />
                    Add Credential
                </button>
            </div>

            <div className="credentials-grid">
                {filteredCredentials.map(cred => (
                    <div key={cred.id} className="credential-card">
                        <div className="card-header">
                            <h3>{cred.platform}</h3>
                            <div className="card-actions">
                                <button onClick={() => {
                                    setEditingCredential(cred);
                                    setIsModalOpen(true);
                                }} className="icon-btn">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => initiateDelete(cred.id)} className="icon-btn danger">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="card-field">
                            <label>Username</label>
                            <div className="field-value">
                                <span>{cred.username}</span>
                                <button onClick={() => handleCopy(cred.username)} className="copy-btn">
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="card-field">
                            <label>Password</label>
                            <div className="field-value">
                                <span>{viewingPasswordId === cred.id ? cred.password : '••••••••'}</span>
                                <div className="field-actions">
                                    <button onClick={() => handleRevealClick(cred.id)} className="copy-btn">
                                        {viewingPasswordId === cred.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button onClick={() => handleCopy(cred.password)} className="copy-btn">
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <CredentialModal
                    credential={editingCredential}
                    onClose={() => setIsModalOpen(false)}
                    onSave={() => {
                        setIsModalOpen(false);
                        fetchCredentials();
                    }}
                />
            )}

            <SecurityPinModal
                isOpen={pinModal.isOpen}
                onClose={() => setPinModal({ ...pinModal, isOpen: false })}
                onSuccess={pinModal.type === 'DELETE' ? confirmDelete : confirmReveal}
                title={pinModal.type === 'DELETE' ? "Confirm Deletion" : "Reveal Password"}
                message={pinModal.type === 'DELETE'
                    ? "Enter your PIN to delete this credential. This action cannot be undone."
                    : "Enter your PIN to reveal passwords. You won't be asked again this session."}
            />
        </div>
    );
}
