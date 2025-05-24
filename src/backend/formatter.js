/**
 * データのフォーマットと保存に関するモジュール
 */
import 'dotenv/config'; // 環境変数を読み込む
import fs from 'fs';

// 環境変数からTwitter usernameを取得
const twitterUsername = process.env.TWITTER_USERNAME || '0xtkgshn';

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
 * @param {Object} data ツイートデータ
 * @param {string} data.date 日付（YYYY-MM-DD形式）
 * @param {Array} data.posts 通常ツイートの配列
 * @param {Array} data.rts リツイートの配列
 * @returns {string} Scrapbox形式のテキスト
 */
export function generateScrapboxFormat(data) {
  let text = `[* ${data.date} のツイートまとめ]\n\n`;

  // 通常ツイート
  if (data.posts && data.posts.length > 0) {
    text += '[** 自分のツイート]\n';
    data.posts.forEach(post => {
      text += ` [https://twitter.com/${twitterUsername}/status/${post.id}]\n`;
      text += `  ${post.text.replace(/\n/g, '\n  ')}\n\n`;
    });
  }

  // リツイート
  if (data.rts && data.rts.length > 0) {
    text += '[** リツイート]\n';
    data.rts.forEach(rt => {
      // ユーザー名をURLから抽出する試み
      let username = 'ParrotMystery'; // デフォルトのユーザー名

      // ツイートでメンションされているユーザー名を抽出できる場合
      if (rt.text && rt.text.startsWith('RT @')) {
        const matches = rt.text.match(/^RT @([^:]+):/);
        if (matches && matches[1]) {
          username = matches[1];
        }
      }

      // 新しいフォーマット
      text += ` >[https://x.com/${username}/status/${rt.id} @${username}]: ${rt.orig_text.replace(/\n/g, '\n >')}\n`;
      text += `  [ChatGPT.icon]${rt.summary}\n\n`;
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

/**
 * データをJSON文字列に変換する
 * @param {Object} data ツイートデータ
 * @returns {string} JSONフォーマットの文字列
 */
export function generateJsonFormat(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * データをMarkdown形式に変換する
 * @param {Object} data ツイートデータ
 * @returns {string} Markdown形式のテキスト
 */
export function generateMarkdownFormat(data) {
  let text = `# ${data.date} のツイートまとめ\n\n`;

  // 通常ツイート
  if (data.posts && data.posts.length > 0) {
    text += '## 自分のツイート\n\n';
    data.posts.forEach(post => {
      text += `- [ツイートリンク](https://twitter.com/${twitterUsername}/status/${post.id})\n`;
      text += `  ${post.text.replace(/\n/g, '\n  ')}\n\n`;
    });
  }

  // リツイート
  if (data.rts && data.rts.length > 0) {
    text += '## リツイート\n\n';
    data.rts.forEach(rt => {
      text += `- [RTリンク](https://twitter.com/i/web/status/${rt.id})\n`;
      text += `  ${rt.orig_text.replace(/\n/g, '\n  ')}\n`;
      text += `  **要約**: ${rt.summary}\n\n`;
    });
  }

  return text;
}
