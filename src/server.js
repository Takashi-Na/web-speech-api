const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const fs = require('fs');

// 静的ファイルの提供
app.use(express.static('public'));
app.use('/tmp', express.static('tmp'));

// 動画一覧を取得するAPIエンドポイント
app.get('/api/videos', (req, res) => {
  const tmpDir = path.join(__dirname, '..', 'tmp');
  fs.readdir(tmpDir, (err, files) => {
    if (err) {
      console.error('Error reading tmp directory:', err);
      return res.status(500).json({ error: '動画一覧の取得に失敗しました' });
    }
    
    // MP4ファイルのみをフィルタリング
    const videos = files
      .filter(file => file.toLowerCase().endsWith('.mp4'))
      .map(file => ({
        name: file,
        path: `/tmp/${file}`
      }));
    
    res.json(videos);
  });
});

// 動画一覧を表示するルート
app.get('/videos', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'videos.html'));
});

// ルートパスのハンドリング
app.get('/', (req, res) => {
  res.redirect('/videos');
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
