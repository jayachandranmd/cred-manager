import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Trash2, Plus, Search, Eye } from 'lucide-react';
import UploadModal from './UploadModal';
import SecurityPinModal from './SecurityPinModal';
import DocumentViewerModal from './DocumentViewerModal';

export default function DocumentsView() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [viewingDocument, setViewingDocument] = useState(null);

    // Security for Upload
    const [pinModal, setPinModal] = useState({ isOpen: false, type: null, data: null });

    useEffect(() => {
        fetchDocuments();
    }, [user]);

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (doc) => {
        try {
            const { data, error } = await supabase.storage
                .from('vault')
                .download(doc.file_path);

            if (error) throw error;

            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.name; // Or use original filename if preferred
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error downloading file');
        }
    };

    const handleDelete = async (id, filePath) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            // Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('vault')
                .remove([filePath]);

            if (storageError) throw storageError;

            // Delete from DB
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            setDocuments(documents.filter(d => d.id !== id));
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Error deleting document');
        }
    };

    const initiateUpload = () => {
        setPinModal({ isOpen: true, type: 'UPLOAD' });
    };

    const filteredDocuments = documents.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) return <div>Loading documents...</div>;

    return (
        <div>
            <div className="dashboard-controls">
                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="primary-btn add-btn" onClick={initiateUpload}>
                    <Plus size={20} />
                    Upload Document
                </button>
            </div>

            <div className="documents-grid">
                {filteredDocuments.map(doc => (
                    <div
                        key={doc.id}
                        className="document-card clickable"
                        onClick={() => setViewingDocument(doc)}
                    >
                        <div className="doc-icon">
                            <FileText size={40} color="var(--accent)" />
                        </div>
                        <div className="doc-info">
                            <h3>{doc.name}</h3>
                            <p>{formatSize(doc.size)} • {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="doc-actions">
                            <button onClick={(e) => { e.stopPropagation(); handleDownload(doc); }} className="icon-btn" title="Download">
                                <Download size={18} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.file_path); }} className="icon-btn danger" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isUploadModalOpen && (
                <UploadModal
                    onClose={() => setIsUploadModalOpen(false)}
                    onUploadComplete={() => {
                        fetchDocuments();
                    }}
                />
            )}

            {viewingDocument && (
                <DocumentViewerModal
                    document={viewingDocument}
                    onClose={() => setViewingDocument(null)}
                    onDownload={handleDownload}
                    onDelete={(id, path) => {
                        handleDelete(id, path);
                        setViewingDocument(null);
                    }}
                />
            )}

            <SecurityPinModal
                isOpen={pinModal.isOpen}
                onClose={() => setPinModal({ ...pinModal, isOpen: false })}
                onSuccess={() => setIsUploadModalOpen(true)}
                title="Security Verification"
                message="Enter your PIN to upload a document."
            />
        </div>
    );
}
