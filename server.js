const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const YTDLP_PATH = process.env.RENDER 
  ? path.join(__dirname, 'yt-dlp') 
  : '"C:\\ytdownloader\\yt-dlp.exe"';

// API Route: Video ki details fetch karne ke liye
app.post('/api/fetch', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL daalna zaroori hai!' });
    }

    // yt-dlp command jo video ki saari details JSON format mein nikaalegi
   const command = `"${YTDLP_PATH}" --no-check-certificates --prefer-insecure --dump-json "${url}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: 'Video details fetch nahi ho payi. Link check karein.' });
        }

        try {
            const videoInfo = JSON.parse(stdout);
            
            // Sirf wahi data filter kar rhe hain jo frontend ko dikhana hai
            const responseData = {
                title: videoInfo.title,
                thumbnail: videoInfo.thumbnail || (videoInfo.thumbnails && videoInfo.thumbnails[0].url),
                formats: videoInfo.formats.map(f => ({
                    format_id: f.format_id,
                    ext: f.ext,
                    resolution: f.resolution || (f.vcodec !== 'none' ? `${f.height}p` : 'Audio'),
                    filesize: f.filesize ? `${(f.filesize / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
                    url: f.url, // Direct download link
                    vcodec: f.vcodec,
                    acodec: f.acodec
                }))
            };

            res.json(responseData);
        } catch (e) {
            res.status(500).json({ error: 'Data parse karne mein dikkat aayi.' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Backend Server running on http://localhost:${PORT}`);
});