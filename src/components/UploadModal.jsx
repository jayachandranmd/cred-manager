import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { X, Loader2, Upload, FileText } from 'lucide-react';

export default function UploadModal({ onClose, onUploadComplete }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError("Please select a file");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Upload file to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('vault')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Insert metadata into Database
            const { error: dbError } = await supabase
                .from('documents')
                .insert([{
                    user_id: user.id,
                    name: name,
                    file_path: filePath,
                    file_type: file.type,
                    size: file.size
                }]);

            if (dbError) throw dbError;

            onUploadComplete();
            onClose();
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
                    <h2>Upload Document</h2>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Document Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Insurance Policy"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>File</label>
                        <div className="file-input-wrapper">
                            <input
                                type="file"
                                id="file-upload"
                                onChange={handleFileChange}
                                className="hidden-input"
                                required
                            />
                            <label htmlFor="file-upload" className="file-input-label">
                                <Upload size={20} />
                                <span>{file ? file.name : "Choose a file..."}</span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="primary-btn">
                        {loading ? <Loader2 className="animate-spin" /> : 'Upload'}
                    </button>
                </form>
            </div>
        </div>
    );
}
