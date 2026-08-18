const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join('/tmp', 'xerfire_store');

module.exports = async (req, res) => {
    const { fileId } = req.query;
    if (!fileId) return res.status(400).json({ error: 'fileId required' });

    const metaPath = path.join(STORAGE_DIR, `${fileId}.json`);
    const filePath = path.join(STORAGE_DIR, `${fileId}.dat`);

    if (!fs.existsSync(metaPath) || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found or expired' });
    }

    try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        return res.status(200).json(meta);
    } catch (e) {
        return res.status(500).json({ error: 'Failed to read metadata' });
    }
};