import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Upload({ onSuccess }) {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setResult(null);
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
                const text = await response.text();
                throw new Error(`Server returned non-JSON: ${response.status}`);
            }

            if (!response.ok) {
                throw new Error(resData.error || "Upload failed");
            }

            console.log("✅ Server Response:", resData);
            setResult(resData);
        } catch (err) {
            console.error("❌ Client Error:", err);
            alert(`Error: ${err.message}`);
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
        <div className="app-container">
            <div className="upload-card">
                <header className="header">
                    <h1>Upload CSV</h1>
                    <p>Organize, filter, and transform your data in seconds.</p>
                </header>

                {!result ? (
                    <>
                        <div
                            className={`drop-zone ${isDragging ? "dragging" : ""}`}
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
                                    <strong>Click to upload</strong> or drag and drop
                                    <p className="file-hint">CSV files only (max 10MB)</p>
                                </div>
                            </div>
                            <input type="file" accept=".csv" onChange={handleFileChange} />
                        </div>

                        {file && <div className="file-info">Selected: {file.name}</div>}

                        <button className="upload-button" disabled={!file || loading} onClick={handleUpload}>
                            {loading ? 'Processing...' : (file ? 'Refine Data' : 'Upload CSV')}
                        </button>
                    </>
                ) : (
                    <div className="upload-results-summary" style={{ textAlign: 'left', padding: '1rem', background: 'rgba(248, 250, 252, 0.5)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#059669' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Upload Complete</h2>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Stores in File:</span>
                                <strong style={{ color: 'var(--text-main)' }}>
                                    {(result.newShops || result.inserted || 0) + (result.updatedShops || result.updated || 0)}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>New Stores Created:</span>
                                <strong style={{ color: '#059669' }}>
                                    {result.newShops ?? result.inserted ?? '0'}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Existing Stores Updated:</span>
                                <strong style={{ color: '#2563eb' }}>
                                    {result.updatedShops ?? result.updated ?? '0'}
                                </strong>
                            </div>
                        </div>

                        <button className="upload-button" onClick={handleProceed} style={{ marginTop: '2rem' }}>
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Upload;
