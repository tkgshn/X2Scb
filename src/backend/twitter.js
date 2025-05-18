/**
 * Twitter API関連の処理を行うモジュール
 */
import fetch from 'node-fetch';

/**
 * ユーザーの最近のツイートを取得する
 * @param {string} username ツイート取得対象のユーザー名
 * @param {string} startTime 取得開始時間（ISO 8601形式）
 * @param {string} endTime 取得終了時間（ISO 8601形式）
 * @param {number} maxResults 最大取得件数
 * @param {string} bearerToken Twitter API Bearer Token
 * @returns {Promise<Object>} Twitter APIのレスポンス
 */
export async function fetchUserTweets(username, startTime, endTime, maxResults = 100, bearerToken) {
  // API URLとパラメータの設定
  const url = new URL('https://api.twitter.com/2/tweets/search/recent');
  url.search = new URLSearchParams({
    'query': `from:${username}`,
    'max_results': maxResults,
    'tweet.fields': 'created_at,edit_history_tweet_ids,referenced_tweets,entities',
    'expansions': 'referenced_tweets.id,author_id,entities.mentions.username'
  });

  // 日付範囲が指定されている場合は追加
  if (startTime) url.searchParams.append('start_time', startTime);
  if (endTime) url.searchParams.append('end_time', endTime);

  // APIリクエスト
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${bearerToken}`
    }
  });

  // レスポンスをJSONとして解析
  const data = await response.json();

  return data;
}

/**
 * ツイートデータをリツイートと通常ツイートに分類する
 * @param {Object} twitterResponse Twitter APIのレスポンス
 * @returns {Object} 分類されたツイート {posts: [], rts: []}
 */
export function categorizeTweets(twitterResponse) {
  const posts = [];
  const rts = [];

  if (!twitterResponse.data || twitterResponse.data.length === 0) {
    return { posts, rts };
  }

  twitterResponse.data.forEach(tweet => {
    // テキストでRT判定（APIが referenced_tweets を返さない場合の対応）
    const isRT = tweet.text.startsWith('RT @') ||
                 tweet.referenced_tweets?.some(r => r.type === 'retweeted');

    (isRT ? rts : posts).push(tweet);
  });

  return { posts, rts };
}

/**
 * リツイートの元ツイートテキストを抽出する
 * @param {Object} rt リツイートオブジェクト
 * @param {Object} twitterResponse Twitter APIのレスポンス全体
 * @returns {string} 元ツイートのテキスト
 */
export function extractOriginalTweetText(rt, twitterResponse) {
  let origText = "";

  // API応答に元ツイートがある場合
  if (rt.referenced_tweets && twitterResponse.includes?.tweets) {
    const origTweet = twitterResponse.includes.tweets.find(
      x => x.id === rt.referenced_tweets[0].id
    );
    if (origTweet) {
      origText = origTweet.text;
    }
  }

  // APIから元ツイートが取得できなかった場合は、テキストから抽出を試みる
  if (!origText && rt.text.startsWith('RT @')) {
    const colonIndex = rt.text.indexOf(': ');
    if (colonIndex !== -1) {
      origText = rt.text.substring(colonIndex + 2);
    }
  }

  return origText;
}
