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
                    <div className="upload-results-summary upload-results-card">
                        <div className="upload-success-header">
                            <div className="upload-success-title">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <h2>Upload Complete</h2>
                            </div>
                        </div>

                        <div className="upload-stats-list">
                            <div className="upload-stat-item bordered">
                                <span className="upload-stat-label">Total Stores in File:</span>
                                <strong className="upload-stat-value">
                                    {(result.newShops || result.inserted || 0) + (result.updatedShops || result.updated || 0)}
                                </strong>
                            </div>
                            <div className="upload-stat-item bordered">
                                <span className="upload-stat-label">New Stores Created:</span>
                                <strong className="upload-stat-value success">
                                    {result.newShops ?? result.inserted ?? '0'}
                                </strong>
                            </div>
                            <div className="upload-stat-item">
                                <span className="upload-stat-label">Existing Stores Updated:</span>
                                <strong className="upload-stat-value primary">
                                    {result.updatedShops ?? result.updated ?? '0'}
                                </strong>
                            </div>
                        </div>

                        <button className="upload-button upload-action-btn" onClick={handleProceed}>
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Upload;
