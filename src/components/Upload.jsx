import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "../sidepanel.css";
import "./Upload.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Upload({ onSuccess }) {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/upload-history`);
            if (!res.ok) throw new Error("History fetch failed");
            setHistory(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const selectFile = (f) => {
        if (!f) return;
        setFile(f);
        setResult(null);
        setError(null);
        setStatus("idle");
    };

    const removeFile = () => {
        setFile(null);
        setResult(null);
        setError(null);
        setStatus("idle");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleUpload = async () => {
        if (!file || status === "uploading") return;

        setStatus("uploading");
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_BASE}/upload`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            setResult(data);
            setStatus("success");
            fetchHistory();

        } catch (err) {
            console.error(err);
            setError(err.message);
            setStatus("error");
            fetchHistory();
        }
    };

    return (
        <>
            <div className="analytics-container fade-in">
                <div className="upload-modern-card">

                    <div className="card-header">
                        <button className="back-btn-square" onClick={() => navigate("/")} aria-label="Back">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>

                        <div className="header-text">
                            <div>
                                <h2>
                                    {status === "success" ? "Upload Complete" : "Upload Data"}
                                </h2>
                                <p>
                                    {status === "success"
                                        ? "File processed successfully."
                                        : "Import a CSV file to update the database."}
                                </p>
                            </div>
                            <button
                                className="back-btn-square"
                                onClick={() => setShowHistory(true)}
                                title="View History"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>

                    </div>

                    <div className="card-body">

                        {status === "error" && (
                            <div className="error-box">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                                {error || "Something went wrong"}
                            </div>
                        )}

                        {status !== "success" ? (
                            <div
                                className={`drop-zone ${isDragging ? "dragging" : ""}`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    selectFile(e.dataTransfer.files[0]);
                                }}
                            >
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
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => selectFile(e.target.files[0])}
                                    disabled={status === "uploading"}
                                />
                            </div>
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

                    <div className="card-footer">
                        {file && status !== "success" && (
                            <div className="file-selected-footer">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                    <polyline points="13 2 13 9 20 9"></polyline>
                                </svg>
                                {file.name}
                                <button className="remove-file-btn" onClick={removeFile} title="Remove file">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        )}

                        {status !== "success" ? (
                            <button
                                className="btn-primary"
                                disabled={!file || status === "uploading"}
                                onClick={handleUpload}
                            >
                                {status === "uploading" ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        Upload CSV
                                    </>
                                )}
                            </button>
                        ) : (
                            <>
                                <button className="btn-secondary" onClick={removeFile}>
                                    Upload Another
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => onSuccess ? onSuccess() : navigate("/")}
                                >
                                    Dashboard
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div
                className={`side-panel-overlay ${showHistory ? "open" : ""}`}
                onClick={() => setShowHistory(false)}
            />

            <div className={`side-panel ${showHistory ? "open" : ""}`}>
                <div className="side-panel-header">
                    <h2>Upload History</h2>
                    <button className="back-btn-square" onClick={() => setShowHistory(false)}>✕</button>
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
                                                {new Date(item.createdAt || item.date).toLocaleString()}
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
                                                <span className="history-stat-value">{item.totalShops || 0}</span>
                                            </div>
                                            <div className="history-stat">
                                                <span className="history-stat-label">New</span>
                                                <span className="history-stat-value">{item.newShops || 0}</span>
                                            </div>
                                            <div className="history-stat">
                                                <span className="history-stat-label">Updated</span>
                                                <span className="history-stat-value">{item.updatedShops || 0}</span>
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
