#!/usr/bin/env node

/**
 * ローカルテスト用HTTPサーバー
 * public ディレクトリの内容をホストします
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

// MIMEタイプのマッピング
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon'
};

// HTTPサーバーの作成
const server = http.createServer((req, res) => {
  // URL解析（クエリパラメータを無視）
  let filePath = path.join(publicDir, req.url.split('?')[0]);

  // デフォルトではindex.htmlを提供
  if (filePath === path.join(publicDir, '/')) {
    // 簡易的なディレクトリリスティング
    const files = fs.readdirSync(publicDir);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>X2Scb テストサーバー</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          ul { list-style: none; padding: 0; }
          li { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>X2Scb ファイル一覧</h1>
        <ul>
          ${files.map(file => `<li><a href="${file}">${file}</a></li>`).join('')}
        </ul>
        <p>
          <b>テスト用URL:</b><br>
          <a href="https://scrapbox.io/tkgshn/?date=2025-05-18" target="_blank">
            https://scrapbox.io/tkgshn/?date=2025-05-18
          </a>
        </p>
        <p><small>このURLは、Scrapboxのページにアクセスし、ユーザースクリプトがデータを取得するためのものです。</small></p>
      </body>
      </html>
    `);
    return;
  }

  // ファイルの存在確認
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // ファイルが見つからない
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }

    // ファイルの読み込み
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
        return;
      }

      // Content-Typeの設定
      const extname = path.extname(filePath);
      const contentType = mimeTypes[extname] || 'application/octet-stream';

      // レスポンスの送信
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    });
  });
});

// サーバーの起動
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}/`);
  console.log(`テスト用URL: https://scrapbox.io/tkgshn/?date=2025-05-18`);
});
