const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join('/tmp', 'xerfire_store');

module.exports = async (req, res) => {
    const { fileId } = req.query;
    if (!fileId) return res.status(400).send('fileId required');

    const metaPath = path.join(STORAGE_DIR, `${fileId}.json`);
    const filePath = path.join(STORAGE_DIR, `${fileId}.dat`);

    if (!fs.existsSync(metaPath) || !fs.existsSync(filePath)) {
        return res.status(404).send('File missing or expired');
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(meta.name)}"`);
    res.setHeader('Content-Type', meta.type || 'application/octet-stream');
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
};
