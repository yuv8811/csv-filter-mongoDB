import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "./SessionData.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const METAFIELD_KEYS = [
    'navigationMetafields',
    'profileMetafield',
    'settingMetafield',
    'registerSettingMetafield',
    'registerMetafield'
];

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isAlert = false }) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onCancel}>
            <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
                <div className="confirm-modal-body">
                    <div className={`confirm-icon-wrapper ${isAlert ? 'alert' : ''}`}>
                        {isAlert ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        )}
                    </div>
                    <h3 className="confirm-title">{title}</h3>
                    <p className="confirm-message">{message}</p>
                </div>
                <div className="confirm-modal-footer">
                    {!isAlert && (
                        <button className="btn-confirm-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                    )}
                    <button
                        className={isAlert ? "btn-confirm-primary" : "btn-confirm-danger"}
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            onCancel(); // Close modal after confirm
                        }}
                    >
                        {isAlert ? "OK" : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MetafieldEditor = ({ jsonString, onChange, onAlert, onConfirm }) => {
    const [editingIndex, setEditingIndex] = useState(null);
    const [isAddingField, setIsAddingField] = useState(false);
    const newFieldInputRef = useRef(null);

    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        return <div style={{ color: 'red', padding: '0.5rem' }}>Invalid JSON</div>;
    }

    const isSingleObject = !Array.isArray(data) && typeof data === 'object' && data !== null;

    if (!Array.isArray(data) && !isSingleObject) {
        return <div style={{ color: 'orange', padding: '0.5rem' }}>Expected an object or array for this field to use the visual editor.</div>;
    }

    const handleChange = (index, field, val) => {
        if (isSingleObject) {
            const newData = { ...data, [field]: val };
            onChange(JSON.stringify(newData, null, 2));
            return;
        }
        const newData = [...data];
        newData[index] = { ...newData[index], [field]: val };
        onChange(JSON.stringify(newData, null, 2));
    };

    const handleAddField = () => {
        const key = newFieldInputRef.current?.value?.trim();
        if (!key) return;

        if (isSingleObject) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                onAlert("Duplicate Field", "Field already exists!");
                return;
            }
            const newData = { ...data, [key]: "" };
            onChange(JSON.stringify(newData, null, 2));
        } else {
            const newData = [...data];
            const item = newData[editingIndex];
            if (Object.prototype.hasOwnProperty.call(item, key)) {
                onAlert("Duplicate Field", "Field already exists!");
                return;
            }
            newData[editingIndex] = { ...item, [key]: "" };
            onChange(JSON.stringify(newData, null, 2));
        }
        setIsAddingField(false);
    };

    const handleDeleteField = (fieldName) => {
        onConfirm(
            "Delete Field",
            `Are you sure you want to delete the field "${fieldName}"?`,
            () => {
                if (isSingleObject) {
                    const newData = { ...data };
                    delete newData[fieldName];
                    onChange(JSON.stringify(newData, null, 2));
                } else {
                    const newData = [...data];
                    const item = { ...newData[editingIndex] };
                    delete item[fieldName];
                    newData[editingIndex] = item;
                    onChange(JSON.stringify(newData, null, 2));
                }
            }
        );
    };

    if (isSingleObject || editingIndex !== null) {
        const item = isSingleObject ? data : data[editingIndex];
        if (!item) {
            setEditingIndex(null);
            return null;
        }
        return (
            <div className="metafield-editor-detail" style={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '1rem', background: '#fff' }}>
                {!isSingleObject && (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: 0, color: '#334155' }}>Editing Item #{item.id ?? editingIndex}</h4>
                        <button
                            onClick={() => setEditingIndex(null)}
                            style={{
                                background: '#f1f5f9',
                                border: 'none',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                color: '#475569'
                            }}>
                            Back to List
                        </button>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {Object.keys(item).map((key) => {
                        if (key === 'id') return null;

                        const val = item[key];
                        const isBool = typeof val === 'boolean';
                        const isLongText = typeof val === 'string' && val.length > 50;

                        if (isBool) {
                            return (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ marginRight: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    id={`field-${isSingleObject ? 'single' : editingIndex}-${key}`}
                                                    checked={val}
                                                    onChange={(e) => handleChange(isSingleObject ? null : editingIndex, key, e.target.checked)}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                        <label htmlFor={`field-${isSingleObject ? 'single' : editingIndex}-${key}`} style={{ margin: 0, cursor: 'pointer', userSelect: 'none', textTransform: 'capitalize', fontSize: '0.85rem', color: '#334155', fontWeight: '500' }}>
                                            {key.replace(/_/g, ' ')}
                                        </label>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteField(key)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444ff', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                        title="Delete Field"

                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div key={key} style={{ gridColumn: isLongText ? 'span 2' : 'span 1' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ display: 'block', margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'capitalize' }}>
                                        {key.replace(/_/g, ' ')}
                                    </label>
                                    <button
                                        onClick={() => handleDeleteField(key)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0', display: 'flex', alignItems: 'center' }}
                                        title="Delete Field"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={val || ''}
                                    onChange={(e) => handleChange(isSingleObject ? null : editingIndex, key, e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem' }}
                                />
                            </div>
                        );
                    })}
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    {isAddingField ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#64748b' }}>New Field Name</label>
                                <input
                                    ref={newFieldInputRef}
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. description"
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddField(); }}
                                    autoFocus
                                    style={{ width: '100%', padding: '0.5rem' }}
                                />
                            </div>
                            <button className="btn-primary" onClick={handleAddField} style={{ height: '36px', padding: '0 1rem' }}>Add</button>
                            <button className="btn-secondary" onClick={() => setIsAddingField(false)} style={{ height: '36px', padding: '0 1rem' }}>Cancel</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingField(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: 'none', border: 'none', color: '#3b82f6',
                                cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500',
                                padding: '0.5rem 0'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Field to Item
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="metafield-editor-list" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.5rem', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', margin: '0.25rem' }}>Select an item to edit:</div>
            {data.map((item, idx) => (
                <div
                    key={idx}
                    onClick={() => setEditingIndex(idx)}
                    style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        background: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.1s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>
                            {item.name || <em>(No Name)</em>}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            ID: {item.id !== undefined ? item.id : '-'}
                        </span>
                    </div>
                    <div style={{ color: '#94a3b8' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ValueDisplay = ({ value }) => {
    const [expanded, setExpanded] = useState(false);

    const getRawString = (val) => {
        if (val === null) return "null";
        if (val === undefined) return "undefined";
        if (typeof val === 'object') return JSON.stringify(val, null, 2);
        return String(val);
    };

    const rawString = getRawString(value);
    // Threshold can be tweaked. Using 100 chars or if multiline
    const isLong = rawString.length > 100 || rawString.includes('\n');

    const renderContent = () => {
        if (value === null) return <span style={{ color: '#cbd5e1' }}>null</span>;
        if (value === undefined) return <span style={{ color: '#cbd5e1' }}>undefined</span>;
        if (typeof value === 'boolean') return value ? <span style={{ color: '#10b981' }}>true</span> : <span style={{ color: '#ef4444' }}>false</span>;

        // Ensure we display truncated version correctly
        if (!expanded && isLong) {
            // Take first 100 chars
            const truncated = rawString.substring(0, 100) + "...";
            return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{truncated}</span>;
        }

        return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{rawString}</span>;
    };

    if (!isLong) {
        return (
            <div className="col-value" style={{ width: '100%' }}>
                {renderContent()}
            </div>
        );
    }

    return (
        <div className="col-value" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <button
                className="btn-toggle-view"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            >
                {expanded ? (
                    <>
                        Collapse
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </>
                ) : (
                    <>
                        View
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </>
                )}
            </button>
            <div style={{ width: '100%' }}>
                {renderContent()}
            </div>
        </div>
    );
};

const SessionData = () => {
    const navigate = useNavigate();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    // editingItem is { docId, key, value, isNew }
    const [editingItem, setEditingItem] = useState(null);

    // Form Inputs
    const [keyInput, setKeyInput] = useState("");
    const [valueInput, setValueInput] = useState("");
    const [isJsonValue, setIsJsonValue] = useState(false);
    const [showVisualEditor, setShowVisualEditor] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const [targetDocId, setTargetDocId] = useState(null);

    // Confirm Dialog State
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        isAlert: false
    });

    const showConfirm = (title, message, onConfirmAction) => {
        setConfirmDialog({
            isOpen: true,
            title,
            message,
            onConfirm: onConfirmAction,
            isAlert: false
        });
    };

    const showAlert = (title, message) => {
        setConfirmDialog({
            isOpen: true,
            title,
            message,
            onConfirm: null,
            isAlert: true
        });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/session-data`);
            if (!res.ok) throw new Error("Failed to fetch data");
            const json = await res.json();
            setDocs(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const flatFields = useMemo(() => {
        const fields = [];
        docs.forEach(doc => {
            Object.keys(doc).forEach(key => {
                if (['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) return;
                fields.push({
                    id: `${doc._id}_${key}`,
                    docId: doc._id,
                    key: key,
                    value: doc[key],
                    date: doc.updatedAt || doc.createdAt
                });
            });
        });
        return fields;
    }, [docs]);

    const handleSave = async () => {
        try {
            let parsedValue = valueInput;
            if (isJsonValue) {
                try {
                    parsedValue = JSON.parse(valueInput);
                } catch (e) {
                    showAlert("Invalid JSON", "Please enter valid JSON for the Value field.");
                    return;
                }
            }

            let url = `${API_BASE}/api/session-data`;
            let method = "POST";
            let body = {};

            if (editingItem && editingItem.docId) {
                url = `${API_BASE}/api/session-data/${editingItem.docId}`;
                method = "PUT";

                body = { [keyInput]: parsedValue };

                if (editingItem.key && editingItem.key !== keyInput) {
                }
            } else if (targetDocId) {
                url = `${API_BASE}/api/session-data/${targetDocId}`;
                method = "PUT";
                body = { [keyInput]: parsedValue };
            } else if (docs.length > 0) {
                const latest = docs[0];
                url = `${API_BASE}/api/session-data/${latest._id}`;
                method = "PUT";
                body = { [keyInput]: parsedValue };
            } else {
                body = { [keyInput]: parsedValue };
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("Save failed");

            closeModal();
            fetchData();
            fetchData();
        } catch (err) {
            showAlert("Error", err.message);
        }
    };

    const handleDeleteField = async (item) => {
        showConfirm(
            "Delete Field",
            `Are you sure you want to delete the field "${item.key}"? This action cannot be undone.`,
            async () => {
                try {
                    const doc = docs.find(d => d._id === item.docId);
                    if (!doc) return;

                    const newDoc = { ...doc };
                    delete newDoc[item.key];
                    delete newDoc._id;
                    delete newDoc.__v;
                    delete newDoc.createdAt;
                    delete newDoc.updatedAt;

                    const res = await fetch(`${API_BASE}/api/session-data/${item.docId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ [item.key]: null })
                    });

                    if (!res.ok) throw new Error("Delete failed");

                    fetchData();

                } catch (err) {
                    console.error(err);
                    showAlert("Error", "Could not delete field");
                }
            }
        );
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setKeyInput(item.key);
            setTargetDocId(item.docId);

            const val = item.value;
            if (typeof val === 'object' && val !== null) {
                setValueInput(JSON.stringify(val, null, 2));
                setIsJsonValue(true);
            } else {
                setValueInput(String(val));
                setIsJsonValue(false);
            }
        } else {
            // New Field
            setEditingItem(null);
            setKeyInput("");
            setValueInput("");
            setValueInput("");
            setIsJsonValue(false);
            setShowVisualEditor(true);
            // Default to first doc if exists
            if (docs.length > 0) setTargetDocId(docs[0]._id);
            else setTargetDocId(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setKeyInput("");
        setValueInput("");
        setIsEditingTitle(false);
    };

    const isSpecialKey = METAFIELD_KEYS.includes(keyInput) || (editingItem && METAFIELD_KEYS.includes(editingItem.key));

    return (
        <div className="session-container fade-in">
            <div className="session-card">
                <div className="session-header">
                    <div>
                        <h2>
                            <button className="back-btn-square" onClick={() => navigate("/")} style={{ marginRight: '1rem', display: 'inline-flex' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                            </button>
                            Session Data
                        </h2>
                    </div>
                    <button className="btn-primary" onClick={() => openModal()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Field
                    </button>
                </div>

                <div className="table-wrapper">
                    {loading && <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
                    {error && <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>}

                    {!loading && !error && flatFields.length === 0 && (
                        <div className="empty-state">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                            <h3>No Data Found</h3>
                            <p>Add a field to get started.</p>
                        </div>
                    )}

                    {!loading && !error && flatFields.length > 0 && (
                        <table className="session-table">
                            <thead>
                                <tr>
                                    <th className="col-key">Field Name</th>
                                    <th className="col-value">Value</th>
                                    <th className="col-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flatFields.map((item) => (
                                    <tr key={item.id}>
                                        <td className="col-key">{item.key}</td>
                                        <td>
                                            <ValueDisplay value={item.value} />
                                        </td>
                                        <td className="col-actions">
                                            <button
                                                className="action-btn edit"
                                                onClick={() => openModal(item)}
                                                title="Edit"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDeleteField(item)}
                                                title="Delete"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '90%' }}>
                                {isEditingTitle ? (
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={keyInput}
                                        onChange={(e) => setKeyInput(e.target.value)}
                                        onBlur={() => setIsEditingTitle(false)}
                                        autoFocus
                                        style={{ fontWeight: '700', fontSize: '1.125rem', padding: '0.25rem 0.5rem', height: 'auto' }}
                                    />
                                ) : (
                                    <h3 style={{ margin: 0 }}>
                                        {keyInput || (editingItem ? "Edit Field" : "New Field")}
                                    </h3>
                                )}
                                {!isEditingTitle && (
                                    <button
                                        onClick={() => setIsEditingTitle(true)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', display: 'flex', alignItems: 'center' }}
                                        title="Rename Field"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, marginLeft: 'auto' }}>
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            {isSpecialKey ? (
                                <MetafieldEditor
                                    jsonString={valueInput}
                                    onChange={setValueInput}
                                    onAlert={showAlert}
                                    onConfirm={showConfirm}
                                />
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Field Name (Key)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. session_timeout"
                                            value={keyInput}
                                            onChange={(e) => setKeyInput(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <label style={{ marginBottom: 0 }}>Value</label>
                                        </div>
                                        {isJsonValue ? (
                                            <textarea
                                                className="form-input json-editor"
                                                value={valueInput}
                                                onChange={(e) => setValueInput(e.target.value)}
                                                placeholder='{"foo": "bar"}'
                                                spellCheck="false"
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={valueInput}
                                                onChange={(e) => setValueInput(e.target.value)}
                                                placeholder="Enter value..."
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                            <button className="btn-primary" onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM / ALERT MODAL */}
            <ConfirmModal
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={closeConfirmDialog}
                isAlert={confirmDialog.isAlert}
            />
        </div>
    );
};


export default SessionData;
