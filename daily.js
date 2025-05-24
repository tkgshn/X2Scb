import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import 'dotenv/config'; // .env ファイルから環境変数を読み込む
import fs from 'fs';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { generateImportHTML, generateUserscriptUrl } from './src/backend/scrapbox.js';
dayjs.extend(utc); dayjs.extend(tz);

// デバッグ用のログ関数
const log = (msg, obj = null) => {
  const timestamp = new Date().toISOString();
  if (obj) {
    console.log(`[${timestamp}] ${msg}:`, typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2));
  } else {
    console.log(`[${timestamp}] ${msg}`);
  }
};

// コマンドライン引数で日付とScrapboxプロジェクト名を取得
const args = process.argv.slice(2);
const projectName = args[0] || process.env.SCRAPBOX_PROJECT || 'tkgshn';
const targetDate = args[1] || null; // 指定がなければ前日の日付を使用

log('スクリプト開始');
log(`Scrapboxプロジェクト: ${projectName}`);

// 環境変数のデバッグ
log(`環境変数の状態 - process.env.TW_BEARER: ${process.env.TW_BEARER ? '設定あり' : '設定なし'}`);
log(`環境変数の状態 - process.env.OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '設定あり' : '設定なし'}`);
log(`環境変数の状態 - process.env.SCRAPBOX_PROJECT: ${process.env.SCRAPBOX_PROJECT || '設定なし'}`);
log(`環境変数の状態 - process.env.TWITTER_USERNAME: ${process.env.TWITTER_USERNAME || '設定なし'}`);
log(`環境変数オブジェクト: ${Object.keys(process.env).join(', ')}`);

// 直接環境変数にアクセスしてみる
const twBearer = process.env['TW_BEARER'];
const openaiKey = process.env['OPENAI_API_KEY'];
const twitterUsername = process.env['TWITTER_USERNAME'] || '0xtkgshn';
log(`直接アクセス - TW_BEARER: ${twBearer ? '設定あり' : '設定なし'}`);
log(`直接アクセス - OPENAI_API_KEY: ${openaiKey ? '設定あり' : '設定なし'}`);
log(`直接アクセス - TWITTER_USERNAME: ${twitterUsername}`);

// 環境変数のチェック
if (!twBearer) {
  log('エラー: Twitter APIトークン(TW_BEARER)が設定されていません');
  process.exit(1);
}

if (!openaiKey) {
  log('エラー: OpenAI APIキー(OPENAI_API_KEY)が設定されていません');
  process.exit(1);
}

// 日付の設定
let jstTargetDate;
if (targetDate) {
  // 指定された日付を使用
  jstTargetDate = dayjs(targetDate).tz('Asia/Tokyo');
  log(`指定された日付: ${jstTargetDate.format('YYYY-MM-DD')}`);
} else {
  // 前日の日付を使用
  jstTargetDate = dayjs().tz('Asia/Tokyo').subtract(1, 'day');
  log(`前日の日付: ${jstTargetDate.format('YYYY-MM-DD')}`);
}

const [startUtc, endUtc] = [
  jstTargetDate.startOf('day').utc().format(),
  jstTargetDate.endOf('day').utc().format()
];

log(`対象期間: ${jstTargetDate.format('YYYY-MM-DD')} JST (${startUtc} - ${endUtc} UTC)`);

// Twitter APIのURL作成
const url = new URL('https://api.twitter.com/2/tweets/search/recent');
url.search = new URLSearchParams({
  'query': `from:${twitterUsername}`,
  'max_results': 100,
  'tweet.fields': 'created_at,edit_history_tweet_ids,referenced_tweets,entities',
  'expansions': 'referenced_tweets.id,author_id,entities.mentions.username'
});

log(`Twitter APIリクエストURL: ${url.toString()}`);

try {
  log('Twitter APIリクエスト開始');

  // 実際のAPIリクエスト
  const tw = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${twBearer}`
    }
  }).then(r => r.json());

  log('Twitter APIレスポンス受信', tw);

  // ツイートとリツイートの仕分け
  const posts = [], rts = [];

  if (!tw.data || tw.data.length === 0) {
    log('警告: ツイートデータがありません。期間内にツイートがないかAPIエラーが発生している可能性があります。');
  } else {
    log(`取得したツイート数: ${tw.data.length}`);

    tw.data.forEach(t => {
      // テキストでRT判定（APIが referenced_tweets を返さない場合の対応）
      const isRT = t.text.startsWith('RT @') || t.referenced_tweets?.some(r => r.type === 'retweeted');
      (isRT ? rts : posts).push(t);
    });

    log(`通常ツイート数: ${posts.length}, リツイート数: ${rts.length}`);
  }

  // OpenAI APIクライアント初期化
  const openai = new OpenAI({
    apiKey: openaiKey
  });

  if (rts.length > 0) {
    log('リツイートの要約を開始');

    for (const rt of rts) {
      log(`リツイートID ${rt.id} の要約処理中...`);

      // RTの元ツイートのテキストを抽出
      // API応答に元ツイートがない場合は、RTテキストから抽出を試みる
      let origText = "";
      if (rt.referenced_tweets && tw.includes?.tweets) {
        const origTweet = tw.includes.tweets.find(x => x.id === rt.referenced_tweets[0].id);
        if (origTweet) {
          origText = origTweet.text;
        }
      }

      // APIから元ツイートが取得できなかった場合は、テキストから抽出を試みる
      if (!origText && rt.text.startsWith('RT @')) {
        origText = rt.text.substring(rt.text.indexOf(': ') + 2);
      }

      if (!origText) {
        log(`警告: リツイートID ${rt.id} の元ツイートのテキストが抽出できません`);
        rt.summary = "元ツイートの内容が取得できませんでした";
        rt.orig_text = "";
        continue;
      }

      log(`元ツイートの内容: "${origText}"`);
      const prompt = `以下のツイートを日本語でなるべく詳しく要約してください:\n"${origText}"`;

      try {
        log('OpenAI APIリクエスト開始');

        // 実際のOpenAI API呼び出し
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{role: 'user', content: prompt}],
          max_tokens: 60
        });

        rt.summary = response.choices[0].message.content.trim();
        rt.orig_text = origText;

        log(`要約結果: "${rt.summary}"`);
      } catch (error) {
        log(`OpenAI APIエラー: ${error.message}`);
        rt.summary = "要約の取得に失敗しました";
        rt.orig_text = origText;
      }
    }
  }

  // 出力JSONの作成
  const out = {
    date: jstTargetDate.format('YYYY-MM-DD'),
    posts: posts.map(t => ({
      id: t.id,
      text: t.text,
      created_at: t.created_at || new Date().toISOString()
    })),
    rts: rts.map(t => ({
      id: t.id,
      text: t.text,
      orig_text: t.orig_text || "",
      summary: t.summary || ""
    }))
  };

  log('JSON出力データ作成完了', out);

  // Scrapbox形式のテキスト生成
  const scrapboxText = generateScrapboxFormat(out);
  log('Scrapbox形式のテキスト生成完了', scrapboxText);

  // ファイル保存
  await fs.promises.mkdir('public', {recursive: true});
  const outputPath = `public/${out.date}.json`;
  await fs.promises.writeFile(outputPath, JSON.stringify(out, null, 2));
  log(`JSONファイル保存完了: ${outputPath}`);

  const scrapboxPath = `public/${out.date}.txt`;
  await fs.promises.writeFile(scrapboxPath, scrapboxText);
  log(`Scrapboxテキストファイル保存完了: ${scrapboxPath}`);

  // Scrapboxインポート用のHTMLファイルを生成
  const pageName = `${out.date}のツイートまとめ`;
  const htmlFilePath = await generateImportHTML(projectName, pageName, scrapboxText);
  log(`Scrapboxインポート用HTMLファイル生成完了: ${htmlFilePath}`);

  // ユーザースクリプト用のURLを生成
  const userscriptUrl = generateUserscriptUrl(projectName, out.date);
  log(`ユーザースクリプト実行用URL: ${userscriptUrl}`);

  // 結果のサマリー表示
  log('--------------------------------------');
  log(`処理完了: ${out.date}`);
  log(`通常ツイート: ${out.posts.length}件`);
  log(`リツイート: ${out.rts.length}件`);
  log(`出力ファイル: ${outputPath}`);
  log(`Scrapboxテキスト: ${scrapboxPath}`);
  log(`Scrapboxインポート: file://${htmlFilePath}`);
  log(`ユーザースクリプトURL: ${userscriptUrl}`);
  log('--------------------------------------');

} catch (error) {
  log(`エラーが発生しました: ${error.message}`);
  log(error.stack);
}

log('スクリプト終了');

// Scrapbox形式のテキストを生成する関数
function generateScrapboxFormat(data) {
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
