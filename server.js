require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises;
const fileUpload = require('express-fileupload');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware đơn giản hóa
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route đơn giản để test
app.get('/ping', (req, res) => res.send('pong'));

// Route template (đơn giản hóa)
app.get('/template-data', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'public', 'data.json'), 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route download (sửa lại)
app.get('/download/:category/:filename', async (req, res) => {
  const { category, filename } = req.params;
  const filePath = path.join(__dirname, 'public', 'downloads', category, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.download(filePath);
});

// Khởi động server với try-catch
try {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (err) {
  console.error('Server failed to start:', err);
}