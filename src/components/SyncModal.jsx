import React from 'react';

const SyncModal = ({ isOpen, onClose, onConfirm, isSyncing, syncResult }) => {
    if (!isOpen) return null;

    return (
        <div className="sync-overlay">
            <div className="sync-modal-minimal">

                {!isSyncing && !syncResult && (
                    <div className="sync-content-minimal">
                        <h3 className="sync-title">Synchronize Database</h3>
                        <p className="sync-desc">
                            This action will verify and update installation records with missing data from shop_info.
                        </p>
                        <div className="sync-actions-minimal">
                            <button className="btn-minimal-cancel" onClick={onClose}>Cancel</button>
                            <button className="btn-minimal-confirm" onClick={onConfirm}>Start Sync</button>
                        </div>
                    </div>
                )}

                {isSyncing && (
                    <div className="sync-content-minimal centered">
                        <div className="spinner-minimal"></div>
                        <p className="sync-status-text">Synchronizing records...</p>
                    </div>
                )}

                {syncResult && !isSyncing && (
                    <div className="sync-content-minimal centered">
                        <div className="sync-success-icon">✓</div>
                        <h3 className="sync-title">Sync Complete</h3>
                        <p className="sync-desc">
                            Checked: <strong>{syncResult.checkedCount}</strong><br />
                            Updated: <strong>{syncResult.updatedCount}</strong>
                        </p>
                        <button className="btn-minimal-primary" onClick={onClose}>Close</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SyncModal;
