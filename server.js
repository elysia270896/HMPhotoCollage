require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // Thêm thư viện path
const app = express();

// Cấu hình cơ bản
app.use(cors());
app.use(bodyParser.json());

// Phục vụ file tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Mock data - dữ liệu mẫu
const templates = [
  {
    id: 1,
    name: "Khung ảnh cưới 1",
    category: "wedding",
    thumb: "/thumbs/wedding1.jpg",
    zipUrl: "/download/wedding1.zip"
  },
  {
    id: 2,
    name: "Khung ảnh kỷ yếu",
    category: "yearbook",
    thumb: "/thumbs/yearbook1.jpg",
    zipUrl: "/download/yearbook1.zip"
  }
];

// Route chính
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'HM Photo Collage API đang hoạt động',
    endpoints: {
      getTemplates: 'GET /api/templates',
      downloadTemplate: 'GET /api/download/:id'
    }
  });
});

// API lấy danh sách template
app.get('/api/templates', (req, res) => {
  res.json({
    status: 'success',
    data: templates
  });
});

// API tải template theo ID
app.get('/api/download/:id', (req, res) => {
  try {
    const template = templates.find(t => t.id === parseInt(req.params.id));
    
    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template không tồn tại'
      });
    }

    const filePath = path.join(__dirname, 'public', template.zipUrl);
    
    res.download(filePath, `template_${template.id}.zip`, (err) => {
      if (err) {
        console.error('Lỗi khi tải file:', err);
        res.status(500).json({
          status: 'error',
          message: 'Lỗi khi tải file'
        });
      }
    });
  } catch (error) {
    console.error('Lỗi server:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server nội bộ'
    });
  }
});

// Xử lý route không tồn tại
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint không tồn tại'
  });
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
  console.log(`Truy cập: http://localhost:${PORT}`);
});