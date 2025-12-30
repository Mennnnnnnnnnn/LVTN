/**
 * Format datetime ISO string thành "DD/MM/YYYY HH:MM"
 * Input: "2026-01-02T18:15:00.000Z"
 * Output: "02/01/2026 18:15"
 */
export const formatDateTime = (isoString) => {
    if (!isoString) return '';
    
    // Parse ISO string
    const date = new Date(isoString);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format chỉ thời gian "HH:MM"
 * Input: "2026-01-02T18:15:00.000Z"
 * Output: "18:15"
 */
export const formatTime = (isoString) => {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
};

