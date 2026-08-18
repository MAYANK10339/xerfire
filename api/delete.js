const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join('/tmp', 'xerfire_store');

module.exports = async (req, res) => {
    const { fileId } = req.query;
    if (!fileId) return res.status(400).json({ error: 'fileId required' });

    const metaPath = path.join(STORAGE_DIR, `${fileId}.json`);
    const filePath = path.join(STORAGE_DIR, `${fileId}.dat`);

    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return res.status(200).json({ success: true });
};