/**
 * Scrapbox APIモジュール
 * Scrapboxにデータをインポートするための機能を提供
 */
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Scrapbox形式のテキストをクリップボードに最適化された形式に変換
 * @param {string} text Scrapbox形式のテキスト
 * @returns {string} クリップボード用に最適化されたテキスト
 */
export function optimizeForClipboard(text) {
  // Scrapboxのインポート用に整形
  return text.trim();
}

/**
 * Scrapboxへのインポート用のHTMLファイルを生成
 * @param {string} projectName Scrapboxのプロジェクト名
 * @param {string} pageName ページ名
 * @param {string} content Scrapbox形式のコンテンツ
 * @param {string} outputDir 出力ディレクトリ
 * @returns {Promise<string>} 生成されたHTMLファイルのパス
 */
export async function generateImportHTML(projectName, pageName, content, outputDir = '../../public') {
  const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scrapbox Import: ${pageName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    pre {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .buttons {
      margin: 20px 0;
    }
    button {
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      background-color: #4285f4;
      color: white;
      font-size: 16px;
      cursor: pointer;
      margin-right: 10px;
    }
    button:hover {
      background-color: #3367d6;
    }
    .help {
      background-color: #f9f9f9;
      padding: 10px;
      border-radius: 5px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>Scrapbox インポート：${pageName}</h1>
  <div class="buttons">
    <button id="copyBtn">コンテンツをコピー</button>
    <button id="openScrapbox">Scrapboxを開く</button>
  </div>
  <p>以下のテキストをコピーして、Scrapboxの新規ページに貼り付けてください：</p>
  <pre id="content">${content}</pre>

  <div class="help">
    <h3>使い方</h3>
    <ol>
      <li>「コンテンツをコピー」ボタンをクリックしてテキストをコピー</li>
      <li>「Scrapboxを開く」ボタンをクリックして${projectName}プロジェクトを開く</li>
      <li>新規ページを作成し、コピーしたテキストを貼り付け</li>
    </ol>
  </div>

  <script>
    document.getElementById('copyBtn').addEventListener('click', function() {
      const content = document.getElementById('content');
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(content);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
      alert('コンテンツをコピーしました！');
    });

    document.getElementById('openScrapbox').addEventListener('click', function() {
      window.open('https://scrapbox.io/${projectName}', '_blank');
    });
  </script>
</body>
</html>
  `;

  const absOutputDir = path.resolve(__dirname, outputDir);
  await fs.mkdir(absOutputDir, { recursive: true });
  const htmlFilePath = path.join(absOutputDir, `${pageName}-import.html`);
  await fs.writeFile(htmlFilePath, htmlContent);

  return htmlFilePath;
}

/**
 * ユーザースクリプト実行用のURLを生成
 * @param {string} projectName Scrapboxのプロジェクト名
 * @param {string} date 日付（YYYY-MM-DD形式）
 * @returns {string} Scrapboxのユーザースクリプト用URL
 */
export function generateUserscriptUrl(projectName, date) {
  const encodedDate = encodeURIComponent(date);
  return `https://scrapbox.io/${projectName}?date=${encodedDate}`;
}
