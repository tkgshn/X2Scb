#!/usr/bin/env node

/**
 * テスト用のサンプルデータを生成するスクリプト
 */
import dayjs from 'dayjs';
import 'dotenv/config'; // 環境変数を読み込む
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateScrapboxFormat } from '../src/backend/formatter.js';

// 環境変数からTwitter usernameを取得
const twitterUsername = process.env.TWITTER_USERNAME || '0xtkgshn';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../public');

// 特定の日付を指定
const today = '2025-05-18'; // dayjs().format('YYYY-MM-DD');

// サンプルデータの作成
const sampleData = {
  date: today,
  posts: [
    {
      id: '1111111111111111111',
      text: 'これはサンプルツイートです。#テスト',
      created_at: '2023-07-14T10:30:00.000Z'
    },
    {
      id: '1111111111111111112',
      text: '今日もScrapboxで作業中。とても便利です。',
      created_at: '2023-07-14T15:45:00.000Z'
    },
    {
      id: '1111111111111111113',
      text: 'Node.jsでスクリプトを書いています。\nこれはマルチラインツイートのサンプル\nです。',
      created_at: '2023-07-14T18:20:00.000Z'
    }
  ],
  rts: [
    {
      id: '2222222222222222222',
      text: 'RT @techuser: JavaScriptの新機能が発表されました！とても興味深いです。',
      orig_text: 'JavaScriptの新機能が発表されました！とても興味深いです。',
      summary: 'JavaScriptの新機能が発表されたことについての言及。'
    },
    {
      id: '2222222222222222223',
      text: 'RT @newsaccount: 今日の技術ニュース: AIの最新動向について詳しく解説します。人間の仕事はどう変わるのか？',
      orig_text: '今日の技術ニュース: AIの最新動向について詳しく解説します。人間の仕事はどう変わるのか？',
      summary: 'AIの最新動向と人間の仕事への影響について述べたニュース。'
    }
  ]
};

async function main() {
  try {
    // 出力ディレクトリの作成
    await fs.mkdir(outputDir, { recursive: true });

    // JSONファイルの生成
    const jsonPath = path.join(outputDir, `${today}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(sampleData, null, 2));
    console.log(`JSONファイルを生成しました: ${jsonPath}`);

    // Scrapbox形式のテキスト生成
    let scrapboxText;
    try {
      scrapboxText = generateScrapboxFormat(sampleData);
    } catch (e) {
      // 既存の関数が使用できない場合は、簡易的な関数を使用
      scrapboxText = simpleScrapboxFormat(sampleData);
    }

    const textPath = path.join(outputDir, `${today}.txt`);
    await fs.writeFile(textPath, scrapboxText);
    console.log(`Scrapboxテキストファイルを生成しました: ${textPath}`);

    console.log('サンプルデータの生成が完了しました！');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// シンプルなScrapbox形式のテキスト生成関数
function simpleScrapboxFormat(data) {
  let text = `[* ${data.date} のツイートまとめ]\n\n`;

  // 通常ツイート
  if (data.posts.length > 0) {
    text += '[** 自分のツイート]\n';
    data.posts.forEach(post => {
      text += ` [https://twitter.com/${twitterUsername}/status/${post.id}]\n`;
      text += `  ${post.text.replace(/\n/g, '\n  ')}\n\n`;
    });
  }

  // リツイート
  if (data.rts.length > 0) {
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

main();
