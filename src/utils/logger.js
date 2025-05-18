/**
 * ログ出力ユーティリティモジュール
 */

/**
 * タイムスタンプ付きのログ出力関数
 * @param {string} msg ログメッセージ
 * @param {any} obj ログ出力するオブジェクト（オプション）
 * @returns {void}
 */
export function log(msg, obj = null) {
  const timestamp = new Date().toISOString();
  if (obj) {
    console.log(`[${timestamp}] ${msg}:`, typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2));
  } else {
    console.log(`[${timestamp}] ${msg}`);
  }
}

/**
 * エラーログ出力関数
 * @param {string} msg エラーメッセージ
 * @param {Error} error エラーオブジェクト（オプション）
 * @returns {void}
 */
export function logError(msg, error = null) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR] ${msg}`);
  if (error) {
    console.error(`[${timestamp}] ${error.message}`);
    if (error.stack) {
      console.error(`[${timestamp}] ${error.stack}`);
    }
  }
}
