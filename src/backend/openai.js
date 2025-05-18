/**
 * OpenAI API関連の処理を行うモジュール
 */
import OpenAI from 'openai';

/**
 * OpenAI APIクライアントを初期化する
 * @param {string} apiKey OpenAI APIキー
 * @returns {OpenAI} 初期化されたOpenAI APIクライアント
 */
export function initOpenAI(apiKey) {
  return new OpenAI({ apiKey });
}

/**
 * ツイートの内容を要約する
 * @param {OpenAI} openaiClient 初期化済みのOpenAI APIクライアント
 * @param {string} tweetText 要約するツイートテキスト
 * @param {string} model 使用するモデル名
 * @param {number} maxTokens 最大トークン数
 * @returns {Promise<string>} 要約されたテキスト
 */
export async function summarizeTweet(openaiClient, tweetText, model = 'gpt-4o-mini', maxTokens = 60) {
  const prompt = `以下のツイートを日本語で1-2文に要約してください:\n"${tweetText}"`;

  const response = await openaiClient.chat.completions.create({
    model: model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens
  });

  return response.choices[0].message.content.trim();
}

/**
 * 複数のリツイートを要約する
 * @param {OpenAI} openaiClient 初期化済みのOpenAI APIクライアント
 * @param {Array} retweets リツイートの配列
 * @param {Object} twitterResponse Twitter APIレスポンス全体
 * @param {Function} extractOriginalText 元ツイートテキスト抽出関数
 * @param {Function} logger ログ出力関数（オプション）
 * @returns {Promise<Array>} 要約が追加されたリツイートの配列
 */
export async function summarizeRetweets(openaiClient, retweets, twitterResponse, extractOriginalText, logger = console.log) {
  for (const rt of retweets) {
    // 元ツイートのテキストを抽出
    const origText = extractOriginalText(rt, twitterResponse);

    if (!origText) {
      if (logger) logger(`警告: リツイートID ${rt.id} の元ツイートのテキストが抽出できません`);
      rt.summary = "元ツイートの内容が取得できませんでした";
      rt.orig_text = "";
      continue;
    }

    if (logger) logger(`元ツイートの内容: "${origText}"`);

    try {
      // OpenAI APIで要約を生成
      if (logger) logger('OpenAI APIリクエスト開始');

      rt.summary = await summarizeTweet(openaiClient, origText);
      rt.orig_text = origText;

      if (logger) logger(`要約結果: "${rt.summary}"`);
    } catch (error) {
      if (logger) logger(`OpenAI APIエラー: ${error.message}`);
      rt.summary = "要約の取得に失敗しました";
      rt.orig_text = origText;
    }
  }

  return retweets;
}
