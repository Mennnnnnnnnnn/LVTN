// Template layouts cho phòng chiếu
export const seatLayoutTemplates = [
  {
    id: 'default',
    name: 'Mặc định',
    description: '8 dãy × 9 ghế (72 ghế) - 2 dãy đầu ở giữa, các dãy sau chia 2 cột',
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    seatsPerRow: 9,
    coupleSeatsRows: [],
    customRowSeats: {},
    totalSeats: 72,
    layoutType: 'default' // 2 dãy đầu ở giữa, các dãy sau chia 2 cột
  },
  {
    id: 'single-column',
    name: '1 Cột Thẳng Hàng',
    description: '8 dãy × 10 ghế (80 ghế) - tất cả thẳng hàng ở giữa màn hình',
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    seatsPerRow: 10,
    coupleSeatsRows: [],
    customRowSeats: {}, // Tất cả dãy đều 10 ghế, không có padding
    totalSeats: 80,
    layoutType: 'single-column' // Tất cả thẳng hàng ở giữa
  },
  {
    id: 'two-columns',
    name: '2 Cột Bằng Nhau',
    description: '10 dãy chia 2 cột × 8 ghế/cột (80 ghế) - không có dãy ở giữa',
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    seatsPerRow: 18, // seatsPerRow lớn để tạo padding ở giữa
    coupleSeatsRows: [],
    customRowSeats: {
      // Mỗi dãy có 8 ghế (4 ghế bên trái + 4 ghế bên phải), padding 10 ghế ở giữa = đường đi
      'A': 8, 'B': 8, 'C': 8, 'D': 8, 'E': 8,
      'F': 8, 'G': 8, 'H': 8, 'I': 8, 'J': 8
    },
    totalSeats: 80,
    layoutType: 'two-columns' // Chia 2 cột, không có dãy ở giữa
  },
  {
    id: 'stadium',
    name: 'Stadium Style',
    description: '10 dãy dạng sân vận động (100 ghế) - tăng dần đều từ trước ra sau',
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    seatsPerRow: 12, // Max seatsPerRow để có đủ chỗ cho dãy cuối
    coupleSeatsRows: [],
    customRowSeats: {
      // Dãy gần màn hình ít ghế, tăng dần đều về phía sau (dạng sân vận động)
      'A': 6,  // Dãy gần màn hình nhất: 6 ghế
      'B': 7,  // Dãy 2: 7 ghế
      'C': 8,  // Dãy 3: 8 ghế
      'D': 9,  // Dãy 4: 9 ghế
      'E': 10, // Dãy 5: 10 ghế
      'F': 10, // Dãy 6: 10 ghế
      'G': 11, // Dãy 7: 11 ghế
      'H': 11, // Dãy 8: 11 ghế
      'I': 12, // Dãy 9: 12 ghế
      'J': 12  // Dãy xa màn hình nhất: 12 ghế (nhiều nhất)
    },
    totalSeats: 100,
    layoutType: 'theater-v' // Layout dạng stadium, tất cả ở giữa (giữ nguyên layoutType để không ảnh hưởng logic render)
  }
];

// Hàm lấy template theo ID
export const getTemplateById = (templateId) => {
  return seatLayoutTemplates.find(t => t.id === templateId) || seatLayoutTemplates[0];
};

