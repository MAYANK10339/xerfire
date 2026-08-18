const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Minimal Node.js Local Server to serve the Xerfire Engine
const server = http.createServer((req, res) => {
    // Route all traffic to the SPA Engine (index.html)
    let filePath = path.join(__dirname, 'index.html');
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end(`Server Error: ${err.code}`);
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Xerfire Local Engine running on http://localhost:${PORT}`);
    console.log(`Creator: Mayank Mandrai`);
});