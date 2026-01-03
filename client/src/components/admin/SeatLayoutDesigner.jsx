import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, AlertCircle, Eye, Edit } from 'lucide-react';
import { assets } from '../../assets/assets';
import { seatLayoutTemplates } from '../../lib/seatLayoutTemplates';

const SeatLayoutDesigner = ({ value, onChange, existingHall }) => {
  // State cho layout design
  const [rows, setRows] = useState(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  const [seatsPerRow, setSeatsPerRow] = useState(9);
  const [customRowSeats, setCustomRowSeats] = useState({});
  const [coupleSeatsRows, setCoupleSeatsRows] = useState([]);
  const [brokenSeats, setBrokenSeats] = useState([]);
  const [selectedSeatForBreak, setSelectedSeatForBreak] = useState(null);
  const [viewMode, setViewMode] = useState('design'); // 'design' or 'preview'
  const [selectedTemplate, setSelectedTemplate] = useState('default'); // Template được chọn
  const [layoutType, setLayoutType] = useState('default'); // Layout type: 'default', 'single-column', 'two-columns', 'theater-v'

  // Load existing data nếu đang edit
  useEffect(() => {
    if (existingHall) {
      setRows(existingHall.seatLayout?.rows || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
      setSeatsPerRow(existingHall.seatLayout?.seatsPerRow || 9);
      setCustomRowSeats(existingHall.customRowSeats || {});
      setCoupleSeatsRows(existingHall.seatLayout?.coupleSeatsRows || []);
      setBrokenSeats(existingHall.brokenSeats || []);
      setLayoutType(existingHall.seatLayout?.layoutType || 'default');
      setSelectedTemplate(''); // Không chọn template khi đang edit
    } else {
      // Khi tạo mới, set template mặc định
      setSelectedTemplate('default');
      setLayoutType('default');
    }
  }, [existingHall]);

  // Hàm xử lý khi chọn template
  const handleTemplateChange = (templateId) => {
    if (!templateId || templateId === '') {
      setSelectedTemplate('');
      setLayoutType('default');
      return;
    }

    const template = seatLayoutTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setRows([...template.rows]);
      setSeatsPerRow(template.seatsPerRow);
      setCustomRowSeats({ ...template.customRowSeats });
      setCoupleSeatsRows([...template.coupleSeatsRows]);
      setLayoutType(template.layoutType || 'default');
      // Giữ nguyên brokenSeats khi đổi template (có thể xóa nếu muốn reset)
      // setBrokenSeats([]);
    }
  };

  // Update parent khi có thay đổi
  useEffect(() => {
    const totalSeats = rows.reduce((sum, row) => {
      const rowSeats = customRowSeats[row] || seatsPerRow;
      // Handle nếu rowSeats là string rỗng
      const numSeats = typeof rowSeats === 'string' && rowSeats === '' ? seatsPerRow : rowSeats;
      return sum + (parseInt(numSeats) || seatsPerRow);
    }, 0);

    onChange({
      seatLayout: {
        rows,
        seatsPerRow: typeof seatsPerRow === 'string' && seatsPerRow === '' ? 9 : seatsPerRow,
        coupleSeatsRows,
        layoutType
      },
      customRowSeats,
      brokenSeats,
      totalSeats
    });
  }, [rows, seatsPerRow, customRowSeats, coupleSeatsRows, brokenSeats]);

  // Thêm dãy ghế
  const addRow = () => {
    if (rows.length >= 26) return; // Max 26 dãy (A-Z)
    const lastRow = rows[rows.length - 1];
    const nextLetter = String.fromCharCode(lastRow.charCodeAt(0) + 1);
    if (nextLetter <= 'Z') {
      setRows([...rows, nextLetter]);
    }
  };

  // Xóa dãy ghế cuối
  const removeLastRow = () => {
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1];
      setRows(rows.slice(0, -1));
      // Cleanup related data
      const newCustomRowSeats = { ...customRowSeats };
      delete newCustomRowSeats[lastRow];
      setCustomRowSeats(newCustomRowSeats);
      setCoupleSeatsRows(coupleSeatsRows.filter(r => r !== lastRow));
      setBrokenSeats(brokenSeats.filter(seat => !seat.startsWith(lastRow)));
    }
  };

  // Xóa dãy ghế
  const removeRow = (rowToRemove) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r !== rowToRemove));
      // Cleanup related data
      const newCustomRowSeats = { ...customRowSeats };
      delete newCustomRowSeats[rowToRemove];
      setCustomRowSeats(newCustomRowSeats);
      setCoupleSeatsRows(coupleSeatsRows.filter(r => r !== rowToRemove));
      setBrokenSeats(brokenSeats.filter(seat => !seat.startsWith(rowToRemove)));
    }
  };

  // Toggle ghế đôi
  const toggleCoupleSeat = (row) => {
    if (coupleSeatsRows.includes(row)) {
      setCoupleSeatsRows(coupleSeatsRows.filter(r => r !== row));
    } else {
      setCoupleSeatsRows([...coupleSeatsRows, row]);
    }
  };

  // Toggle ghế hỏng
  const toggleBrokenSeat = (seatId) => {
    if (brokenSeats.includes(seatId)) {
      setBrokenSeats(brokenSeats.filter(s => s !== seatId));
    } else {
      setBrokenSeats([...brokenSeats, seatId]);
    }
  };

  // Set custom số ghế cho dãy
  const setCustomSeats = (row, count) => {
    // Nếu count rỗng, cho phép (để user nhập lại)
    if (count === '') {
      setCustomRowSeats({ ...customRowSeats, [row]: '' });
      return;
    }
    
    // Validate min/max
    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount < 6) {
      return; // Không cho nhập số < 6
    }
    if (numCount > 20) {
      return; // Không cho nhập số > 20
    }
    
    if (numCount === seatsPerRow) {
      const newCustom = { ...customRowSeats };
      delete newCustom[row];
      setCustomRowSeats(newCustom);
    } else {
      setCustomRowSeats({ ...customRowSeats, [row]: numCount });
    }
  };

  // Render preview ghế cho 1 dãy
  const renderRowPreview = (row) => {
    let rowSeatCount = customRowSeats[row] || seatsPerRow;
    // Handle nếu là string rỗng
    if (rowSeatCount === '' || isNaN(rowSeatCount)) {
      rowSeatCount = seatsPerRow || 9;
    }
    const isCouple = coupleSeatsRows.includes(row);

    return (
      <div key={row} className="mb-4 p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xl text-gray-800">{row}</span>
            <input
              type="number"
              min="6"
              max="20"
              value={rowSeatCount === '' ? '' : rowSeatCount}
              onChange={(e) => setCustomSeats(row, e.target.value)}
              onBlur={(e) => {
                // Khi blur, nếu rỗng hoặc < 6 thì set về seatsPerRow
                if (e.target.value === '' || parseInt(e.target.value) < 6) {
                  setCustomSeats(row, seatsPerRow);
                }
              }}
              className="w-20 px-2 py-1 border-2 border-gray-300 rounded text-sm font-semibold text-gray-900 bg-white"
              placeholder="6-20"
            />
            <span className="text-sm text-gray-700 font-medium">ghế (6-20)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleCoupleSeat(row)}
              className={`px-3 py-1 text-xs rounded-full transition ${
                isCouple
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              💑 Ghế đôi
            </button>
            
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(row)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Preview ghế */}
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: rowSeatCount }, (_, i) => {
            const seatId = `${row}${i + 1}`;
            const isBroken = brokenSeats.includes(seatId);
            
            return (
              <button
                key={seatId}
                type="button"
                onClick={() => toggleBrokenSeat(seatId)}
                className={`w-8 h-8 text-xs rounded flex items-center justify-center transition ${
                  isBroken
                    ? 'bg-red-500 text-white line-through'
                    : isCouple
                    ? 'border-2 border-pink-500 hover:bg-pink-50'
                    : 'border border-gray-300 hover:bg-gray-100'
                }`}
                title={isBroken ? 'Click để sửa ghế' : 'Click để đánh dấu ghế hỏng'}
              >
                {isBroken ? '✕' : seatId}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const totalSeats = rows.reduce((sum, row) => {
    return sum + (customRowSeats[row] || seatsPerRow);
  }, 0);

  // Render preview mode (như user sẽ thấy)
  const renderPreviewMode = () => {
    // Group rows giống SeatLayout dựa trên layoutType
    const groupRows = layoutType === 'single-column' || layoutType === 'theater-v' ?
      // Tất cả rows ở giữa (1 nhóm duy nhất)
      [rows] :
      layoutType === 'two-columns' ?
      // Tất cả rows chia thành 2 nhóm bằng nhau (mỗi nhóm = 1 cột)
      (() => {
        const midPoint = Math.ceil(rows.length / 2);
        return [
          rows.slice(0, midPoint), // Cột trái: nửa đầu rows
          rows.slice(midPoint)    // Cột phải: nửa sau rows
        ];
      })() :
      // Default: 2 dãy đầu ở giữa, các dãy sau chia 2 cột, dãy cuối lẻ tự động ở giữa
      (() => {
        if (rows.length <= 2) {
          return [rows];
        }
        
        // 2 dãy đầu ở giữa
        const firstTwo = rows.slice(0, 2);
        const remainingRows = rows.slice(2);
        
        // Chia các dãy còn lại thành nhóm 2 dãy
        const groups = [];
        for (let i = 0; i < remainingRows.length; i += 2) {
          const group = remainingRows.slice(i, i + 2);
          groups.push(group);
        }
        
        // Nếu nhóm cuối chỉ có 1 dãy (lẻ), đưa nó vào nhóm đầu (ở giữa)
        if (groups.length > 0 && groups[groups.length - 1].length === 1) {
          const lastRow = groups.pop()[0];
          firstTwo.push(lastRow);
        }
        
        return [firstTwo, ...groups];
      })();

    const renderPreviewSeats = (row) => {
      const rowSeatCount = customRowSeats[row] || seatsPerRow;
      const isCouple = coupleSeatsRows.includes(row);
      const needsPadding = rowSeatCount < seatsPerRow;
      const paddingSeats = needsPadding ? Math.floor((seatsPerRow - rowSeatCount) / 2) : 0;

      return (
        <div key={row} className="flex gap-2 mt-2 justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Padding ghế trống bên trái */}
            {needsPadding && Array.from({length: paddingSeats}, (_, i) => (
              <div key={`pad-left-${i}`} className="h-8 w-8"></div>
            ))}
            
            {/* Ghế thực tế */}
            {Array.from({length: rowSeatCount}, (_,i)=>{
              const seatId = `${row}${i+1}`;
              const isBroken = brokenSeats.includes(seatId);
              const coupleClass = isCouple ? 'border-2 border-pink-500' : 'border border-primary/60';
              
              return (
                <div
                  key={seatId}
                  className={`h-8 w-8 rounded ${coupleClass} transition-all relative flex items-center justify-center text-xs
                  ${isBroken ? 'bg-red-500/80 text-white' : 'bg-transparent'}
                  ${!isBroken && 'hover:bg-primary/30'}`}
                  title={isBroken ? "Ghế đang bảo trì" : seatId}
                >
                  {isBroken ? '✕' : seatId}
                </div>
              );
            })}
            
            {/* Padding ghế trống bên phải */}
            {needsPadding && Array.from({length: paddingSeats}, (_, i) => (
              <div key={`pad-right-${i}`} className="h-8 w-8"></div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-white">
        <div className="flex flex-col items-center">
          {/* Màn hình */}
          <img src={assets.screenImage} alt="screen" className="mb-2" />
          <p className="text-gray-400 text-sm mb-6">Màn Hình</p>
          
          {/* Chú giải */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border border-primary/60 bg-transparent"></div>
              <span className="text-gray-300">Ghế trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border-2 border-pink-500 bg-transparent"></div>
              <span className="text-gray-300">Ghế đôi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary"></div>
              <span className="text-gray-300">Đã chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gray-600 opacity-30"></div>
              <span className="text-gray-300">Đã đặt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-red-500 text-white flex items-center justify-center text-xs">✕</div>
              <span className="text-gray-300">Bảo trì</span>
            </div>
          </div>

          {/* Layout ghế */}
          <div className="flex flex-col items-center text-xs text-gray-300">
            {layoutType === 'two-columns' ? (
              // Render 2 cột cạnh nhau
              <div className="grid grid-cols-2 gap-11">
                {groupRows.map((group, idx) => (
                  <div key={idx}>
                    {group.map(row => renderPreviewSeats(row))}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6">
                  {groupRows[0]?.map(row => renderPreviewSeats(row))}
                </div>
                <div className="grid grid-cols-2 gap-11">
                  {groupRows.slice(1).map((group, idx)=>(
                    <div key={idx}>
                      {group.map(row => renderPreviewSeats(row))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thông tin */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Đây là cách khách hàng sẽ thấy layout ghế khi đặt vé
            </p>
            <p className="text-gray-500 text-xs mt-2">
              {brokenSeats.length > 0 && `${brokenSeats.length} ghế đang bảo trì • `}
              {totalSeats} tổng số ghế
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Thiết kế sơ đồ ghế</h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700 font-medium">
            Tổng: <span className="font-bold text-primary text-base">{totalSeats}</span> ghế
          </div>
          {/* Toggle View Mode */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode('design')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-sm font-medium ${
                viewMode === 'design'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <Edit className="w-4 h-4" />
              Thiết kế
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-sm font-medium ${
                viewMode === 'preview'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <Eye className="w-4 h-4" />
              Xem thử
            </button>
          </div>
        </div>
      </div>

      {/* Template Selector - Chỉ hiển thị khi tạo mới (không phải edit) */}
      {!existingHall && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Chọn template layout
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 bg-white"
          >
            <option value="">-- Tùy chỉnh từ đầu --</option>
            {seatLayoutTemplates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.description}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            💡 Chọn template để tự động load layout, sau đó bạn vẫn có thể chỉnh sửa số dãy và số ghế
          </p>
        </div>
      )}

      {/* Show preview hoặc design mode */}
      {viewMode === 'preview' ? (
        renderPreviewMode()
      ) : (
        <>
          {/* Hướng dẫn */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Hướng dẫn:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Điều chỉnh số ghế mỗi dãy bằng ô nhập số</li>
                <li>Click "💑 Ghế đôi" để đánh dấu dãy ghế đôi</li>
                <li>Click vào ghế để đánh dấu ghế hỏng (màu đỏ)</li>
                <li>Ghế hỏng sẽ không cho khách đặt</li>
              </ul>
            </div>
          </div>

      {/* Cấu hình chung */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Số ghế mặc định mỗi dãy (6-20 ghế)
          </label>
          <input
            type="number"
            min="6"
            max="20"
            value={seatsPerRow}
            onChange={(e) => {
              const val = e.target.value;
              // Cho phép xóa hết để nhập lại
              if (val === '') {
                setSeatsPerRow('');
                return;
              }
              const num = parseInt(val);
              // Validate 6-20
              if (num >= 6 && num <= 20) {
                setSeatsPerRow(num);
              } else if (num < 6) {
                setSeatsPerRow(6);
              } else if (num > 20) {
                setSeatsPerRow(20);
              }
            }}
            onBlur={(e) => {
              // Khi blur, nếu rỗng thì set về 9
              if (e.target.value === '') {
                setSeatsPerRow(9);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            placeholder="6-20"
          />
          <p className="text-xs text-gray-500 mt-1">Tối thiểu 6, tối đa 20 ghế</p>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Số dãy ghế (A-Z)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={rows.length}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 font-medium"
            />
            <button
              type="button"
              onClick={removeLastRow}
              disabled={rows.length <= 1}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              title="Xóa dãy cuối"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={addRow}
              disabled={rows.length >= 26}
              className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dull transition disabled:opacity-50"
              title="Thêm dãy"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Tối đa 26 dãy (A-Z)</p>
        </div>
      </div>

      {/* Preview màn hình */}
      <div className="text-center mb-4">
        <div className="inline-block px-20 py-2 bg-gradient-to-b from-gray-200 to-gray-300 rounded-b-3xl shadow-md">
          <span className="text-sm text-gray-600">🎬 Màn hình</span>
        </div>
      </div>

      {/* Danh sách dãy ghế */}
      <div className="max-h-96 overflow-y-auto">
        {rows.map(row => renderRowPreview(row))}
      </div>

          {/* Thống kê ghế hỏng */}
          {brokenSeats.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 mb-2">
                Ghế hỏng ({brokenSeats.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {brokenSeats.map(seat => (
                  <span
                    key={seat}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded flex items-center gap-1"
                  >
                    {seat}
                    <button
                      type="button"
                      onClick={() => toggleBrokenSeat(seat)}
                      className="hover:bg-red-600 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeatLayoutDesigner;

