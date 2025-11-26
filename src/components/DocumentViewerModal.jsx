import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, ZoomIn, ZoomOut, RotateCcw, Loader2, Download, Trash2 } from 'lucide-react';

export default function DocumentViewerModal({ document, onClose, onDownload, onDelete }) {
    const [url, setUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (document) {
            fetchUrl();
        }
    }, [document]);

    const fetchUrl = async () => {
        try {
            const { data, error } = await supabase.storage
                .from('vault')
                .createSignedUrl(document.file_path, 3600); // 1 hour expiry

            if (error) throw error;
            setUrl(data.signedUrl);
        } catch (error) {
            console.error('Error fetching document URL:', error);
            setError('Failed to load document');
        } finally {
            setLoading(false);
        }
    };

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const isImage = document?.file_type.startsWith('image/');
    const isPdf = document?.file_type === 'application/pdf';

    if (!document) return null;

    return (
        <div className="modal-overlay viewer-overlay">
            <div className="viewer-container">
                <div className="viewer-header">
                    <h3 className="viewer-title">{document.name}</h3>
                    <div className="viewer-actions">
                        {isImage && (
                            <div className="zoom-controls">
                                <button onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={20} /></button>
                                <button onClick={handleReset} title="Reset"><RotateCcw size={20} /></button>
                                <button onClick={handleZoomIn} title="Zoom In"><ZoomIn size={20} /></button>
                            </div>
                        )}
                        <div className="action-divider" style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
                        <button onClick={() => onDownload(document)} className="icon-btn" title="Download">
                            <Download size={20} />
                        </button>
                        <button onClick={() => onDelete(document.id, document.file_path)} className="icon-btn danger" title="Delete">
                            <Trash2 size={20} />
                        </button>
                        <div className="action-divider" style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
                        <button onClick={onClose} className="close-btn"><X size={24} /></button>
                    </div>
                </div>

                <div className="viewer-content">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 className="animate-spin" size={40} color="var(--accent)" />
                        </div>
                    ) : error ? (
                        <div className="error-state">{error}</div>
                    ) : (
                        <>
                            {isImage && (
                                <div
                                    className="image-wrapper"
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                                >
                                    <img
                                        src={url}
                                        alt={document.name}
                                        style={{
                                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                            transition: isDragging ? 'none' : 'transform 0.2s'
                                        }}
                                        draggable={false}
                                    />
                                </div>
                            )}

                            {isPdf && (
                                <iframe
                                    src={url}
                                    title={document.name}
                                    className="pdf-viewer"
                                />
                            )}

                            {!isImage && !isPdf && (
                                <div className="unsupported-format">
                                    <p>Preview not available for this file type.</p>
                                    <a href={url} download className="primary-btn" style={{ width: 'auto', display: 'inline-flex' }}>
                                        <Download size={20} style={{ marginRight: '0.5rem' }} />
                                        Download to View
                                    </a>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
