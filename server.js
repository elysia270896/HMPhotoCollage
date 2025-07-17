require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route chính
app.get('/', (req, res) => {
  res.json({
    message: "HM Photo Collage API đang hoạt động",
    endpoints: {
      templates: "GET /api/templates",
      download: "GET /api/download/:id"
    }
  });
});

// API routes
app.get('/api/templates', (req, res) => {
  res.json([
    { id: 1, name: "Mẫu 1" },
    { id: 2, name: "Mẫu 2" }
  ]);
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});