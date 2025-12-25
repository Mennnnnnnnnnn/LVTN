// Format currency to VND
export const currencyFormat = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

// Alternative: Simple VND format without decimal
export const vndFormat = (amount) => {
  return amount.toLocaleString('vi-VN') + ' ₫';
};

