import { useState, useEffect, useMemo } from "react";
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

const MetafieldEditor = ({ jsonString, onChange }) => {
    const [editingIndex, setEditingIndex] = useState(null);

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
                                <div key={key} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ marginRight: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="checkbox"
                                            id={`field-${isSingleObject ? 'single' : editingIndex}-${key}`}
                                            checked={val}
                                            onChange={(e) => handleChange(isSingleObject ? null : editingIndex, key, e.target.checked)}
                                            style={{ width: '1.2rem', height: '1.2rem', margin: 0, cursor: 'pointer', accentColor: '#3b82f6' }}
                                        />
                                    </div>
                                    <label htmlFor={`field-${isSingleObject ? 'single' : editingIndex}-${key}`} style={{ margin: 0, cursor: 'pointer', userSelect: 'none', textTransform: 'capitalize', fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>
                                        {key.replace(/_/g, ' ')}
                                    </label>
                                </div>
                            );
                        }

                        return (
                            <div key={key} style={{ gridColumn: isLongText ? 'span 2' : 'span 1' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'capitalize' }}>
                                    {key.replace(/_/g, ' ')}
                                </label>
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

    // New Record vs New Field logic
    // We will support adding a field to an EXISTING document (if chosen) or creating a NEW document.
    // For simplicity, "Add Record" will create a new field in the MOST RECENT document, or create a new doc if none exists.
    const [targetDocId, setTargetDocId] = useState(null);

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

    // Flatten documents into fields
    const flatFields = useMemo(() => {
        const fields = [];
        docs.forEach(doc => {
            Object.keys(doc).forEach(key => {
                if (['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) return;
                fields.push({
                    id: `${doc._id}_${key}`, // unique key for react
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
                    alert("Invalid JSON for Value field");
                    return;
                }
            }

            // If we are editing a field, we just update/upsert that key in the doc.
            // If we are renaming a key (oldKey != newKey), we need to unset old and set new. 
            // Current simplified logic: just set the [keyInput]. 
            // If editingItem exist and key changed, we'd theoretically want to delete the old one. 
            // Let's assume for now we just SET. If rename is needed, user deletes old.

            let url = `${API_BASE}/api/session-data`;
            let method = "POST";
            let body = {};

            if (editingItem && editingItem.docId) {
                // Update existing document
                url = `${API_BASE}/api/session-data/${editingItem.docId}`;
                method = "PUT";

                // If renaming, we technically need to remove the old key. 
                // But the backend PUT replaces fields provided. It implies $set. 
                // To delete the old key, we'd need a more complex operation. 
                // Let's keep it simple: Add/Update Key.
                body = { [keyInput]: parsedValue };

                // If renaming logic is strictly required, we'd do it here.
                if (editingItem.key && editingItem.key !== keyInput) {
                    // We can't easily atomic rename with simple PUT. 
                    // We'd have to unset the old key. 
                    // Let's warn or just let it create a new key.
                }
            } else if (targetDocId) {
                // Add field to specific doc
                url = `${API_BASE}/api/session-data/${targetDocId}`;
                method = "PUT";
                body = { [keyInput]: parsedValue };
            } else if (docs.length > 0) {
                // Default: Add to first/latest doc
                const latest = docs[0];
                url = `${API_BASE}/api/session-data/${latest._id}`;
                method = "PUT";
                body = { [keyInput]: parsedValue };
            } else {
                // No docs exist, create new
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
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteField = async (item) => {
        if (!confirm(`Delete field "${item.key}"?`)) return;

        // To "delete" a field via generic PUT (which usually acts as $set or merge), 
        // we might not be able to simply "remove" it.
        // However, we can set it to null, or fetch-modify-save.
        // Let's try Fetch-Modify-Save for safety since we lack a specific PATCH endpoint.

        try {
            // 1. Get current doc
            const doc = docs.find(d => d._id === item.docId);
            if (!doc) return;

            // 2. Clone and delete key
            const newDoc = { ...doc };
            delete newDoc[item.key];
            delete newDoc._id; // don't send immutable id
            delete newDoc.__v;
            delete newDoc.createdAt;
            delete newDoc.updatedAt;

            // Note: If the backend PUT does a merge ($set), sending the object WITHOUT the key won't remove it.
            // We need to send { [key]: undefined } or use a special endpoint.
            // Mongoose `findByIdAndUpdate` with an object does $set.
            // WORKAROUND: We will use a hack. If the backend schema was strict we'd be stuck.
            // Since strict: false, maybe we can send { [key]: null }?
            // Let's try setting to NULL first. Most users interpret null as empty.
            // If true deletion is needed, one would need `$unset`.

            // Let's try to just send { [item.key]: null } for now. 
            // If the user wants it GONE gone, we'd need backend support.

            const res = await fetch(`${API_BASE}/api/session-data/${item.docId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [item.key]: null })
            });

            // If we actually want to DELETE the key, we need to implement a DELETE /:id/:key route or similar.
            // But let's see if null is acceptable.

            if (!res.ok) throw new Error("Delete failed");

            fetchData();

        } catch (err) {
            console.error(err);
            alert("Could not delete field");
        }
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
        </div>
    );
};

export default SessionData;
