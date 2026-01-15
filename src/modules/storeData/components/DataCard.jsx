
import Icons from './Icons';
import { SKIP_KEYS } from '../utils/storeDataHelpers';

const DataCard = ({ label, value, type, onClick, isClickable, dataObject, filterKeys, showDetailsButton }) => {
    let displayValue = value;
    let Icon = Icons.File;
    let badgeClass = "type-string";

    // Helper to render badges
    const renderFormattedValue = (key, val) => {
        if (val === null) return 'null';
        if (val === undefined) return 'undefined';
        
        const lowerVal = String(val).toLowerCase();
        
        // Explicit boolean check (if passed as boolean type)
        if (typeof val === 'boolean') {
             return val ? 
                <span className="status-badge status-success">Active</span> : 
                <span className="status-badge status-error">Inactive</span>;
        }

        const lowerKey = key ? key.toLowerCase() : '';
        const statusKeys = ['status', 'state', 'active'];
        const badgeTriggers = ['active', 'inactive', 'enabled', 'disabled', 'connected', 'disconnected', 'true', 'false', 'advanced', 'standard'];

        // If Key implies status OR Value implies status
        if ((key && statusKeys.some(k => lowerKey.includes(k))) || badgeTriggers.includes(lowerVal)) {
            
            let badgeType = 'status-neutral';
            let displayText = String(val);

            if (['active', 'enabled', 'connected', 'success', 'completed', 'true', 'advanced'].includes(lowerVal)) {
                badgeType = 'status-success';
                if (lowerVal === 'true') displayText = 'Active';
            }
            else if (['inactive', 'disabled', 'disconnected', 'error', 'failed', 'false', 'standard'].includes(lowerVal)) {
                badgeType = 'status-error';
                if (lowerVal === 'false') displayText = 'Inactive';
            }
            else if (['pending', 'processing', 'warning'].includes(lowerVal)) {
                badgeType = 'status-warning';
            }

            if (displayText === String(val) || displayText === 'true' || displayText === 'false') {
                 displayText = displayText.charAt(0).toUpperCase() + displayText.slice(1);
            }

            return <span className={`status-badge ${badgeType}`}>{displayText}</span>;
        }

        // Date Formatting: Check if key implies date or value looks like ISO string
        if (typeof val === 'string' && (lowerKey.includes('date') || lowerKey.includes('at') || /^\d{4}-\d{2}-\d{2}T/.test(val))) {
            const date = new Date(val);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString(); // Returns date only (e.g., 1/15/2026)
            }
        }

        if (typeof val === 'object') {
             if (Array.isArray(val)) {
                 const len = val.length;
                 return `${len} Item${len !== 1 ? 's' : ''}`;
             }
             return '{ }';
        }

        return String(val);
    };

    // Logic for Object View inside Card (Preview Mode)
    // Arrays only enter preview mode if they have specific filters configured (like formBuilder)
    const showPreview = (type === 'object' || (type === 'array' && filterKeys && filterKeys.length > 0)) && dataObject;
    
    if (showPreview) {
         // Determine which keys to render
         let entriesToRender = [];
         
         if (filterKeys && Array.isArray(filterKeys) && filterKeys.length > 0) {
             // If a whitelist is provided, stick strictly to it
             entriesToRender = filterKeys
                 .map(k => {
                     // Virtual Field: Forms count (or generic Count) for Arrays
                     if (k === 'Forms count' && Array.isArray(dataObject)) {
                         const len = dataObject.length;
                         return [k, `${len} Item${len !== 1 ? 's' : ''}`];
                     }

                     // Support nested keys (e.g. "formTitle.heading")
                     // Also robustly handles input with quotes like "formTitle.'heading"
                     const cleanKey = k.replace(/'/g, '');
                     
                     // Resolve value by traversing the path
                     const val = cleanKey.split('.').reduce((obj, curr) => (obj && obj[curr] !== undefined) ? obj[curr] : undefined, dataObject);
                     
                     return val !== undefined ? [cleanKey, val] : null;
                 })
                 .filter(entry => entry !== null);
         } else {
             // Default logic: exclude skipped images/icons and take first 6
             // If "status" exists in dataObject, show ONLY status (per user request)
             // context: "show status only"
             if (dataObject && dataObject.hasOwnProperty('status')) {
                  entriesToRender = [['status', dataObject.status]];
             } else {
                 entriesToRender = Object.entries(dataObject)
                    .filter(([k]) => !SKIP_KEYS.includes(k) && !k.toLowerCase().includes('icon') && !k.toLowerCase().includes('image'))
                    .slice(0, 6);
             }
         }

         const canExplore = (type === 'array') || (isClickable && showDetailsButton);

         return (
            <div 
                className={`data-card ${canExplore ? 'clickable' : ''}`}
                onClick={canExplore ? onClick : undefined}
                style={canExplore ? { cursor: 'pointer' } : {}}
            >
                <div className="card-header">
                    <span className="card-title">{dataObject.label || label}</span>
                </div>
                <div className="card-content-list">
                    {entriesToRender.length > 0 ? (
                        entriesToRender.map(([k, v]) => (
                            <div key={k} className="list-row">
                                <span className="list-key">{k}:</span>
                                <span className="list-value">
                                    {renderFormattedValue(k, v)}
                                </span>
                            </div>
                        ))
                    ) : (
                         <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', fontSize: '0.8rem' }}>
                            {filterKeys ? 'No matching fields' : 'No Preview Available'}
                         </div>
                    )}
                    
                    {!filterKeys && Object.keys(dataObject).filter(k => !SKIP_KEYS.includes(k)).length > 6 && (
                        <div className="more-fields">
                            + {Object.keys(dataObject).filter(k => !SKIP_KEYS.includes(k)).length - 6} more attributes...
                        </div>
                    )}
                </div>
                {canExplore && (
                    <div className="card-meta">
                        <button className="card-action">
                            {type === 'array' ? 'Explore' : 'Details'} <Icons.ChevronRight />
                        </button>
                    </div>
                )}
            </div>
         );
    }
    
    // Default Card View
    if (type === 'array') {
        Icon = Icons.Folder; 
    } else if (type === 'date') {
        Icon = Icons.Calendar;
        badgeClass = "type-date";
    } else if (type === 'number') {
        Icon = Icons.Hash;
        badgeClass = "type-number";
    }

    // Check if it's an array type to conditionally enable click/Explore
    // For default view, we rely on isArrayType OR explicit showDetailsButton if we ever wanted to use it here (though usually default view is for single values)
    const isArrayType = type === 'array' || Array.isArray(value);
    const canExploreDefault = (isClickable && isArrayType) || (isClickable && showDetailsButton);

    return (
        <div 
            className={`data-card ${canExploreDefault ? 'clickable' : ''}`} 
            onClick={canExploreDefault ? onClick : undefined}
            style={canExploreDefault ? { cursor: 'pointer' } : {}}
        >
            <div className="card-header">
                <span className="card-title">{label}</span>
            </div>
            <div className="card-content">
                <div className={`card-value small`}>
                    {renderFormattedValue(null, displayValue)}
                </div>
            </div>
            <div className="card-meta">
                {canExploreDefault && (
                    <button className="card-action">
                         {isArrayType ? 'Explore' : 'Details'} <Icons.ChevronRight />
                    </button>
                )}
            </div>
        </div>
    );
};

export default DataCard;
