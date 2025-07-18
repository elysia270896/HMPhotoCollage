require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware quan trọng
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cấu trúc thư mục cần có
// public/
//   app/
//     DPLApps/
//       WeddingPhoto/
//         stickers/
//           data.json
//         template2/
//           data.json
//   assets/
//     thumbnails/
//     templates/

// Route cho sticker data
app.get('/app/DPLApps/WeddingPhoto/stickers/data.json', (req, res) => {
  try {
    const data = fs.readFileSync(
      path.join(__dirname, 'public', 'app', 'DPLApps', 'WeddingPhoto', 'stickers', 'data.json'),
      'utf-8'
    );
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error reading stickers data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route cho template data
app.get('/app/DPLApps/WeddingPhoto/template2/data.json', (req, res) => {
  try {
    const data = fs.readFileSync(
      path.join(__dirname, 'public', 'app', 'DPLApps', 'WeddingPhoto', 'template2', 'data.json'),
      'utf-8'
    );
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error reading template data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route mẫu để kiểm tra server hoạt động
app.get('/', (req, res) => {
  res.send(`
    <h1>Wedding Photo Frame Server</h1>
    <p>Server đang hoạt động</p>
    <ul>
      <li><a href="/app/DPLApps/WeddingPhoto/stickers/data.json">Stickers Data</a></li>
      <li><a href="/app/DPLApps/WeddingPhoto/template2/data.json">Templates Data</a></li>
    </ul>
  `);
});

// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  console.log(`Các endpoint chính:`);
  console.log(`- Stickers: http://localhost:${PORT}/app/DPLApps/WeddingPhoto/stickers/data.json`);
  console.log(`- Templates: http://localhost:${PORT}/app/DPLApps/WeddingPhoto/template2/data.json`);
});