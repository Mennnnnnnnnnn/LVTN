/**
 * Format date/datetime string an toàn, tránh lỗi timezone
 * Input: 
 *   - "2025-12-19" (YYYY-MM-DD)
 *   - "2026-01-02T00:10:00.000Z" (ISO datetime)
 * Output: "19/12/2025" (DD/MM/YYYY)
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Nếu là ISO datetime, lấy phần date
    if (dateString.includes('T')) {
        dateString = dateString.split('T')[0];
    }
    
    // Parse string trực tiếp (không qua new Date)
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    
    return dateString;
};

// Alias cho backward compatibility
export const dateFormat = formatDate;

/**
 * Lấy năm từ date string
 * Input: "2025-12-19"
 * Output: "2025"
 */
export const getYear = (dateString) => {
    if (!dateString) return '';
    return dateString.split('-')[0];
};

/**
 * Format date cho admin (YYYY-MM-DD)
 * Input: "2025-12-19"
 * Output: "2025-12-19"
 */
export const formatDateAdmin = (dateString) => {
    return dateString || '';
};
