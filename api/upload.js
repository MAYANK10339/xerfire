const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join('/tmp', 'xerfire_store');
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { fileId, chunkIndex, totalChunks, fileName, fileSize, fileType, owner, chunkData } = req.body;

        if (!fileId || chunkData === undefined) {
            return res.status(400).json({ error: 'Missing chunk payload' });
        }

        const filePath = path.join(STORAGE_DIR, `${fileId}.dat`);
        const metaPath = path.join(STORAGE_DIR, `${fileId}.json`);

        const buffer = Buffer.from(chunkData, 'base64');
        fs.appendFileSync(filePath, buffer);

        // Save metadata on final chunk
        if (chunkIndex === totalChunks - 1) {
            const meta = {
                id: fileId,
                name: fileName,
                size: fileSize,
                type: fileType,
                owner: owner || 'anonymous',
                createdAt: Date.now()
            };
            fs.writeFileSync(metaPath, JSON.stringify(meta));
        }

        return res.status(200).json({ success: true, fileId, chunkIndex });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Serverless Error' });
    }
};
