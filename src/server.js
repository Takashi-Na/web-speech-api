const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');

// 静的ファイルの提供
app.use(express.static('public'));
app.use('/tmp', express.static('tmp'));

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
