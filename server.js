require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises;
const fileUpload = require('express-fileupload');

// Khởi tạo app
const app = express();
const PORT = process.env.PORT || 3000;

// 1. CẤU HÌNH BẢO MẬT & MIDDLEWARE
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  abortOnLimit: true
}));

// 2. CẤU TRÚC THƯ MỤC
const STATIC_DIR = path.join(__dirname, 'public');
app.use(express.static(STATIC_DIR));

// 3. API ENDPOINTS
// 3.1. Health Check
app.get('/ping', (req, res) => res.json({ status: 'alive', timestamp: Date.now() }));

// 3.2. Main Template Endpoint
app.get('/app/DPLApps/WeddingPhoto/template2/data.json', async (req, res) => {
  try {
    const filePath = path.join(STATIC_DIR, 'app', 'DPLApps', 'WeddingPhoto', 'template2', 'data.json');
    const rawData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(rawData);

    // Validate basic structure
    if (!data.base || !data.categories || !Array.isArray(data.categories)) {
      throw new Error('Invalid data structure: missing base or categories');
    }

    // Process each category and resource
    const processedData = {
      base: data.base,
      categories: data.categories.map(category => {
        if (!category.category || !category.resource || !Array.isArray(category.resource)) {
          throw new Error(`Invalid category structure in category ${category.category}`);
        }

        return {
          category: category.category,
          resource: category.resource.map(item => {
            if (!item.thumb || !item.zip) {
              throw new Error(`Missing thumb or zip in category ${category.category}`);
            }
            
            // Ensure URLs are complete
            return {
              thumb: item.thumb.startsWith('http') ? item.thumb : `${data.base}${item.thumb}`,
              zip: item.zip.startsWith('http') ? item.zip : `${data.base}${item.zip}`
            };
          })
        };
      })
    };

    res.json(processedData);
  } catch (err) {
    console.error('[Template Error]', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

// 3.3. File Download Endpoint
app.get('/download/:category/:file(*)', async (req, res) => {
  try {
    const { category, file } = req.params;
    const filePath = path.join(STATIC_DIR, 'app', 'DPLApps', 'WeddingPhoto', 'template2', category, file);
    
    // Security check
    if (!filePath.startsWith(path.join(STATIC_DIR, 'app'))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

// 4. VALIDATION ENDPOINT
app.get('/validate', async (req, res) => {
  try {
    const filePath = path.join(STATIC_DIR, 'app', 'DPLApps', 'WeddingPhoto', 'template2', 'data.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    const validationResult = {
      valid: true,
      errors: [],
      categories: data.categories?.length || 0,
      totalResources: 0
    };

    // Validate base URL
    if (!data.base) {
      validationResult.valid = false;
      validationResult.errors.push('Missing base URL');
    }

    // Validate categories
    if (!data.categories || !Array.isArray(data.categories)) {
      validationResult.valid = false;
      validationResult.errors.push('Invalid categories structure');
      return res.json(validationResult);
    }

    // Validate each category
    data.categories.forEach((cat, index) => {
      if (!cat.category) {
        validationResult.errors.push(`Category ${index} missing ID`);
        validationResult.valid = false;
      }

      if (!cat.resource || !Array.isArray(cat.resource)) {
        validationResult.errors.push(`Category ${cat.category || index} has invalid resources`);
        validationResult.valid = false;
        return;
      }

      validationResult.totalResources += cat.resource.length;

      cat.resource.forEach((res, resIndex) => {
        if (!res.thumb || !res.zip) {
          validationResult.errors.push(
            `Category ${cat.category || index}, resource ${resIndex} missing thumb or zip`
          );
          validationResult.valid = false;
        }
      });
    });

    res.json(validationResult);
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ 
      error: 'Validation failed',
      details: err.message
    });
  }
});

// 5. ERROR HANDLING
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

// 6. START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Access template data at: http://localhost:${PORT}/app/DPLApps/WeddingPhoto/template2/data.json`);
});