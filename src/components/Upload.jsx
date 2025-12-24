import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Upload() {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
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
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
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
                console.error("Non-JSON response received:", text);
                throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
            }

            if (!response.ok) {
                throw new Error(resData.error || "Upload failed");
            }

            console.log("✅ CSV Processed Successfully!");
            navigate("/");
        } catch (err) {
            console.error("❌ Upload error:", err);
            alert(`Upload error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="app-container">
            <div className="upload-card">
                <header className="header">
                    <h1>CSV Streamliner</h1>
                    <p>Organize, filter, and transform your data in seconds.</p>
                </header>

                <div
                    className={`drop-zone ${isDragging ? "dragging" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}>
                    <div className="drop-zone-content">
                        <div className="upload-icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <div className="text-content">
                            <strong>Click to upload</strong> or drag and drop
                            <p className="file-hint">
                                CSV files only (max 10MB)
                            </p>
                        </div>
                    </div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                </div>

                {file && (
                    <div className="file-info">
                        Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                )}

                <button
                    className="upload-button"
                    disabled={!file || loading}
                    onClick={handleUpload}
                    style={{ marginTop: file ? '1.5rem' : '0' }}
                >
                    {loading ? 'Processing...' : (file ? 'Refine Data' : 'Upload CSV')}
                </button>
            </div>
        </div>
    );
}

export default Upload;
