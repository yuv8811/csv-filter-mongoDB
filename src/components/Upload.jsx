import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "../sidepanel.css";
import "./Upload.css";

function Upload({ onSuccess }) {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const fetchHistory = async () => {
        try {
            const res = await fetch("http://localhost:3000/api/upload-history");
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (loading) return;
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (loading) return;
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setResult(null);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            console.log("[Client] Sending file to server...");
            const response = await fetch("http://localhost:3000/upload", {
                method: "POST",
                body: formData
            });

            const contentType = response.headers.get("content-type");
            let resData;

            if (contentType && contentType.includes("application/json")) {
                resData = await response.json();
            } else {
                const _text = await response.text();
                throw new Error(`Server returned non-JSON: ${response.status}`);
            }

            if (!response.ok) {
                throw new Error(resData.error || "Upload failed");
            }

            console.log("✅ Server Response:", resData);
            setResult(resData);
            fetchHistory(); // Refresh history after upload
        } catch (err) {
            console.error("❌ Client Error:", err);

            fetchHistory(); // Refresh history even if failed (to show failure entry)
        } finally {
            setLoading(false);
        }
    };

    const handleProceed = () => {
        if (onSuccess) {
            onSuccess();
        } else {
            navigate("/");
        }
    };


    return (
        <>
            <div className="analytics-container fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="upload-modern-card">
                    {/* Card Header */}
                    <div className="card-header">
                        <button className="back-btn-square" onClick={() => navigate("/")} aria-label="Back">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                        <div className="header-text" style={{ flex: 1 }}>
                            <h2>{result ? "Upload Complete" : "Upload Data"}</h2>
                            <p>{result ? "Here is the summary of your processed file." : "Import your CSV file to update the database."}</p>
                        </div>
                        <button
                            className="back-btn-square"
                            onClick={() => setShowHistory(!showHistory)}
                            title="View History">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Card Body */}
                    <div className="card-body">
                        {!result ? (
                            <>
                                <div
                                    className={`drop-zone ${isDragging ? "dragging" : ""} ${loading ? "disabled" : ""}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}>
                                    <div className="drop-zone-content">
                                        <div className="upload-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                        </div>
                                        <div className="text-content">
                                            <strong>Click to upload</strong>
                                            <p className="file-hint">or drag and drop CSV file</p>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        disabled={loading}
                                        ref={fileInputRef}
                                    />
                                </div>
                            </>
                        ) : (
                            <div>
                                <div className="result-summary-box">
                                    <div className="result-count-big">
                                        {(result.newShops || result.inserted || 0) + (result.updatedShops || result.updated || 0)}
                                    </div>
                                    <div className="result-label">RECORDS PROCESSED</div>
                                </div>
                                <div className="stats-grid">
                                    <div className="stat-card-mini">
                                        <label>New Stores</label>
                                        <div className="value" style={{ color: '#10b981' }}>+{result.newShops ?? result.inserted ?? '0'}</div>
                                    </div>
                                    <div className="stat-card-mini">
                                        <label>Updated Stores</label>
                                        <div className="value" style={{ color: '#3b82f6' }}>{result.updatedShops ?? result.updated ?? '0'}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card Footer */}
                    <div className="card-footer">
                        {file && !result && (
                            <div className="file-selected-footer">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                    <polyline points="13 2 13 9 20 9"></polyline>
                                </svg>
                                {file.name}
                                <button className="remove-file-btn" onClick={handleRemoveFile} title="Remove file">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        )}
                        {!result ? (
                            <button className="btn-primary" disabled={!file || loading} onClick={handleUpload}>
                                {loading ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        {file ? 'Upload CSV' : 'Select File'}
                                    </>
                                )}
                            </button>
                        ) : (
                            <>
                                <button className="btn-secondary" onClick={handleRemoveFile}>
                                    Upload Another
                                </button>
                                <button className="btn-primary" onClick={handleProceed}>
                                    Dashboard
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div >
            {/* Side Panel Toggle Button */}


            {/* Side Panel Overlay */}
            <div
                className={`side-panel-overlay ${showHistory ? 'open' : ''}`}
                onClick={() => setShowHistory(false)}
            />

            {/* Side Panel */}
            <div className={`side-panel ${showHistory ? 'open' : ''}`}>
                <div className="side-panel-header">
                    <h2 className="side-panel-title">Upload History</h2>
                    <button className="close-panel-btn" onClick={() => setShowHistory(false)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div className="side-panel-content">
                    {history.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
                            No upload history found.
                        </div>
                    ) : (
                        <div className="history-list">
                            {history.map((item) => (
                                <div key={item._id} className="history-item">
                                    <div className="history-item-header">
                                        <div>
                                            <div className="history-filename">{item.fileName}</div>
                                            <div className="history-date">
                                                {new Date(item.date).toLocaleString()}
                                            </div>
                                        </div>
                                        <span className={`history-status-badge ${item.status === 'Success' ? 'success' : 'failed'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    {item.status === 'Success' && (
                                        <div className="history-stats">
                                            <div className="history-stat">
                                                <span className="history-stat-label">Total</span>
                                                <span className="history-stat-value">{item.totalShops}</span>
                                            </div>
                                            <div className="history-stat">
                                                <span className="history-stat-label">New</span>
                                                <span className="history-stat-value">{item.newShops}</span>
                                            </div>
                                            <div className="history-stat">
                                                <span className="history-stat-label">Updated</span>
                                                <span className="history-stat-value">{item.updatedShops}</span>
                                            </div>
                                        </div>
                                    )}
                                    {item.status === 'Failed' && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#ef4444' }}>
                                            {item.error}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Upload;
