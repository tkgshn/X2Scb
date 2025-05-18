/**
 * データのフォーマットと保存に関するモジュール
 */
import fs from 'fs';

/**
 * ツイートデータをJSON形式に整形する
 * @param {string} date 日付（YYYY-MM-DD形式）
 * @param {Array} posts 通常ツイートの配列
 * @param {Array} retweets リツイートの配列
 * @returns {Object} 整形されたJSONデータ
 */
export function formatJsonData(date, posts, retweets) {
  return {
    date,
    posts: posts.map(t => ({
      id: t.id,
      text: t.text,
      created_at: t.created_at || new Date().toISOString()
    })),
    rts: retweets.map(t => ({
      id: t.id,
      text: t.text,
      orig_text: t.orig_text || "",
      summary: t.summary || ""
    }))
  };
}

/**
 * ツイートデータをScrapbox形式のテキストに変換する
 * @param {Object} data formatJsonDataの出力オブジェクト
 * @param {string} username ツイート主のユーザー名
 * @returns {string} Scrapbox形式のテキスト
 */
export function generateScrapboxFormat(data, username = '0xtkgshn') {
  let text = `[* ${data.date} のツイートまとめ]\n\n`;

  // 通常ツイート
  if (data.posts.length > 0) {
    text += '[** 自分のツイート]\n';
    data.posts.forEach(post => {
      text += ` [https://twitter.com/${username}/status/${post.id}]\n`;
      text += `  ${post.text.replace(/\n/g, '\n  ')}\n\n`;
    });
  }

  // リツイート
  if (data.rts.length > 0) {
    text += '[** リツイート]\n';
    data.rts.forEach(rt => {
      text += ` [https://twitter.com/i/web/status/${rt.id}]\n`;
      text += `  ${rt.orig_text.replace(/\n/g, '\n  ')}\n`;
      text += `  [summary] ${rt.summary}\n\n`;
    });
  }

  return text;
}

/**
 * データをJSONファイルとテキストファイルとして保存する
 * @param {string} directory 保存先ディレクトリ
 * @param {string} date 日付（YYYY-MM-DD形式）
 * @param {Object} jsonData 保存するJSONデータ
 * @param {string} scrapboxText 保存するScrapbox形式テキスト
 * @param {Function} logger ログ関数（オプション）
 * @returns {Promise<Object>} 保存結果 {jsonPath, txtPath}
 */
export async function saveData(directory, date, jsonData, scrapboxText, logger = console.log) {
  // ディレクトリが存在しない場合は作成
  await fs.promises.mkdir(directory, { recursive: true });

  // JSONファイルの保存
  const jsonPath = `${directory}/${date}.json`;
  await fs.promises.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
  if (logger) logger(`JSONファイル保存完了: ${jsonPath}`);

  // Scrapboxテキストの保存
  const txtPath = `${directory}/${date}.txt`;
  await fs.promises.writeFile(txtPath, scrapboxText);
  if (logger) logger(`Scrapboxテキストファイル保存完了: ${txtPath}`);

  return { jsonPath, txtPath };
}
