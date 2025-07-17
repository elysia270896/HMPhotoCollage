require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Cấu hình cơ bản
app.use(cors());
app.use(bodyParser.json());

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

// API lấy danh sách template
app.get('/api/templates', (req, res) => {
  res.json(templates);
});

// API tải template theo ID
app.get('/api/download/:id', (req, res) => {
  const template = templates.find(t => t.id === parseInt(req.params.id));
  if (!template) return res.status(404).send('Template not found');
  
  // Trả về file zip (giả lập)
  res.download(__dirname + template.zipUrl); 
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});

