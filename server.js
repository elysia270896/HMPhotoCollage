require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Khởi tạo app
const app = express();
const PORT = process.env.PORT || 3000;

// 1. CẤU HÌNH BẢO MẬT
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST']
}));

// Giới hạn request: 100 requests/phút
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});
app.use(limiter);

// 2. MIDDLEWARE
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  abortOnLimit: true
}));
app.use(morgan('combined'));

// 3. CẤU TRÚC THƯ MỤC
const STATIC_DIR = path.join(__dirname, 'public');
app.use(express.static(STATIC_DIR));

// 4. API ENDPOINTS
// 4.1. Health Check
app.get('/ping', (req, res) => res.json({ status: 'alive', timestamp: Date.now() }));

// 4.2. Validate Data Structure
app.get('/validate', async (req, res) => {
  try {
    const [stickers, templates] = await Promise.all([
      validateData('stickers'),
      validateData('template2')
    ]);
    
    res.json({
      valid: stickers.valid && templates.valid,
      details: { stickers, templates }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4.3. Main Data Endpoints
const createDataRoute = (type) => {
  return async (req, res) => {
    try {
      const filePath = path.join(STATIC_DIR, 'app', 'DPLApps', 'WeddingPhoto', type, 'data.json');
      const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
      
      // Kiểm tra cấu trúc cơ bản
      if (!data.categories || !Array.isArray(data.categories)) {
        throw new Error(`Invalid ${type} data structure`);
      }

      // Transform data nếu cần
      if (type === 'template2' && !data.base) {
        data.base = process.env.BASE_URL || `http://localhost:${PORT}/`;
      }

      res.json(data);
    } catch (err) {
      console.error(`[${type} Error]`, err);
      res.status(500).json({ 
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.message : null
      });
    }
  }
};

app.get('/app/DPLApps/WeddingPhoto/stickers/data.json', createDataRoute('stickers'));
app.get('/app/DPLApps/WeddingPhoto/template2/data.json', createDataRoute('template2'));

// 4.4. File Download
app.get('/download/:type/:file(*)', (req, res) => {
  const { type, file } = req.params;
  const allowedTypes = ['stickers', 'template2'];
  
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid download type' });
  }

  const filePath = path.join(STATIC_DIR, 'app', 'DPLApps', 'WeddingPhoto', type, file);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath, err => {
    if (err) console.error('Download failed:', err);
  });
});

// 5. UPLOAD ENDPOINT (Dành cho admin)
app.post('/upload', (req, res) => {
  if (!req.files || !req.body.targetDir) {
    return res.status(400).json({ error: 'Missing file or target directory' });
  }

  const targetDir = path.join(STATIC_DIR, req.body.targetDir);
  if (!targetDir.startsWith(STATIC_DIR)) {
    return res.status(403).json({ error: 'Invalid upload path' });
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const uploadFile = req.files.file;
  const savePath = path.join(targetDir, uploadFile.name);

  uploadFile.mv(savePath, err => {
    if (err) {
      console.error('Upload failed:', err);
      return res.status(500).json({ error: 'File upload failed' });
    }
    res.json({ 
      success: true,
      path: savePath.replace(STATIC_DIR, '')
    });
  });
});

// 6. XỬ LÝ LỖI
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    requestId: req.id
  });
});

// 7. HÀM HỖ TRỢ
async function validateData(type) {
  const filePath = path.join(STATIC_DIR, 'app', 'DPLApps', 'WeddingPhoto', type, 'data.json');
  const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));

  const result = {
    valid: true,
    type,
    errors: [],
    categories: data.categories?.length || 0,
    resources: 0
  };

  // Validate stickers
  if (type === 'stickers') {
    data.categories?.forEach((cat, i) => {
      if (!cat.resource?.length) {
        result.errors.push(`Category ${i} has no resources`);
        result.valid = false;
      } else {
        cat.resource.forEach(res => {
          if (!res.thumb || !res.zip) {
            result.errors.push(`Missing thumb/zip in category ${i}`);
            result.valid = false;
          }
        });
        result.resources += cat.resource.length;
      }
    });
  }

  // Validate templates
  if (type === 'template2') {
    if (!data.base) result.errors.push('Missing base URL');
    // Thêm validate tương tự stickers...
  }

  return result;
}

// 8. KHỞI ĐỘNG SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running at ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
  console.log('📌 Important Endpoints:');
  console.log(`- Stickers: ${process.env.BASE_URL}/app/DPLApps/WeddingPhoto/stickers/data.json`);
  console.log(`- Templates: ${process.env.BASE_URL}/app/DPLApps/WeddingPhoto/template2/data.json`);
  console.log(`- Validation: ${process.env.BASE_URL}/validate`);
});