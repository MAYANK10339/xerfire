const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Storage folder
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Metadata file
const metadataFile = path.join(__dirname, 'files_meta.json');
let fileDatabase = {};

if (fs.existsSync(metadataFile)) {
    try { fileDatabase = JSON.parse(fs.readFileSync(metadataFile, 'utf-8')); } catch (e) { fileDatabase = {}; }
}

const saveMetadata = () => {
    try {
        fs.writeFileSync(metadataFile, JSON.stringify(fileDatabase, null, 2));
    } catch (err) {
        console.error("Failed to save metadata:", err);
    }
};

// Disk Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const fileId = 'xf_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        req.generatedFileId = fileId;
        cb(null, fileId + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 1024 * 1024 * 1024 * 50 } // 50GB direct streaming limit
});

// 1. Upload API
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const fileId = req.generatedFileId;
    fileDatabase[fileId] = {
        id: fileId,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype || 'application/octet-stream',
        savedPath: req.file.path,
        owner: req.body.owner || 'anonymous',
        createdAt: Date.now()
    };
    saveMetadata();

    // Instant Response with generated ID
    res.json({ 
        success: true, 
        fileId: fileId,
        name: req.file.originalname,
        size: req.file.size
    });
});

// 2. Info API
app.get('/api/info', (req, res) => {
    const { fileId } = req.query;
    const file = fileDatabase[fileId];
    if (!file || !fs.existsSync(file.savedPath)) {
        return res.status(404).json({ error: 'File missing or expired' });
    }
    res.json({ name: file.name, size: file.size, type: file.type });
});

// 3. Download API
app.get('/api/download', (req, res) => {
    const { fileId } = req.query;
    const file = fileDatabase[fileId];

    if (!file || !fs.existsSync(file.savedPath)) {
        return res.status(404).send('File not found or expired');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Type', file.type || 'application/octet-stream');

    const fileStream = fs.createReadStream(file.savedPath);
    fileStream.pipe(res);
});

// 4. Delete API
app.delete('/api/delete', (req, res) => {
    const { fileId } = req.query;
    const file = fileDatabase[fileId];
    if (file) {
        if (fs.existsSync(file.savedPath)) fs.unlinkSync(file.savedPath);
        delete fileDatabase[fileId];
        saveMetadata();
    }
    res.json({ success: true });
});

// Fallback to Frontend SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Xerfire Engine active on http://localhost:${PORT}`);
});
