const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join('/tmp', 'xerfire_store');

// Ensure directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    try {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    } catch (e) {}
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { fileId, chunkIndex, totalChunks, fileName, fileSize, fileType, owner, chunkData } = req.body || {};

        if (!fileId || chunkData === undefined) {
            return res.status(400).json({ error: 'Missing required payload' });
        }

        const filePath = path.join(STORAGE_DIR, `${fileId}.dat`);
        const metaPath = path.join(STORAGE_DIR, `${fileId}.json`);

        // Append Binary Chunk safely
        const buffer = Buffer.from(chunkData, 'base64');
        fs.appendFileSync(filePath, buffer);

        // Finalize metadata on the last chunk
        if (chunkIndex === totalChunks - 1) {
            const meta = {
                id: fileId,
                name: fileName || 'file',
                size: fileSize || 0,
                type: fileType || 'application/octet-stream',
                owner: owner || 'anonymous',
                createdAt: Date.now()
            };
            fs.writeFileSync(metaPath, JSON.stringify(meta));
        }

        return res.status(200).json({ success: true, fileId, chunkIndex });
    } catch (err) {
        console.error('Upload Engine Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Serverless Error' });
    }
};

// Fix Vercel Payload Limit (Crucial to prevent 500 error)
module.exports.config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb'
        }
    }
};
