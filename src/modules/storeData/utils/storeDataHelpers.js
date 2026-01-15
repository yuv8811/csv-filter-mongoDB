import cardNames from '../config/cardNames.json';
import filteredData from '../config/filteredData.json';

export const SKIP_KEYS = ['customIcon', 'image', 'customicon'];

// Helper function to get friendly name
export const getFriendlyName = (key) => {
    return cardNames[key] || key;
};

// Helper to traverse filteredData and find the matching config node
export const getConfigNode = (pathArray) => {
    let current = filteredData;
    
    for (let i = 0; i < pathArray.length; i++) {
        const segment = String(pathArray[i]);
        
        if (!current) return null;

        if (Array.isArray(current)) {
            return null; 
        } else if (typeof current === 'object') {
             if (current[segment]) {
                current = current[segment];
             } else if (current['details']) {
                current = current['details'];
             } else {
                return null;
             }
        } else {
            return null; 
        }
    }
    return current;
};

// Helper to get the list of fields to SHOW in the Drill Down / Object View
export const getFieldsWhitelist = (pathArray) => {
    const node = getConfigNode(pathArray);
    if (!node) return null;
    if (Array.isArray(node)) return node;
    return node.fields || Object.keys(node);
};

// Helper to get the keys to display on the Card Face (Preview)
export const getPreviewWhitelist = (pathArray) => {
    const node = getConfigNode(pathArray);
    if (!node) return null;
    if (Array.isArray(node)) return node;
    // Prefer 'preview', fallback to 'fields', fallback to keys
    return node.preview || node.fields || Object.keys(node);
};

// Helper to check if a node has BOTH preview and fields configured
// This triggers the "Details" button on the card
export const hasPreviewAndFields = (pathArray) => {
    const node = getConfigNode(pathArray);
    return node && Array.isArray(node.preview) && Array.isArray(node.fields);
};
