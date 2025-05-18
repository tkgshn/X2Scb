/**
 * 日付操作ユーティリティモジュール
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import tz from 'dayjs/plugin/timezone.js';

// プラグインの拡張
dayjs.extend(utc);
dayjs.extend(tz);

/**
 * 特定のタイムゾーンでの前日の日付を取得する
 * @param {string} timezone タイムゾーン（例: 'Asia/Tokyo'）
 * @param {string} format 日付フォーマット（例: 'YYYY-MM-DD'）
 * @returns {Object} 前日日付情報 {date, startUtc, endUtc}
 */
export function getYesterdayDate(timezone = 'Asia/Tokyo', format = 'YYYY-MM-DD') {
  const yesterday = dayjs().tz(timezone).subtract(1, 'day');

  return {
    date: yesterday.format(format),
    startUtc: yesterday.startOf('day').utc().format(),
    endUtc: yesterday.endOf('day').utc().format()
  };
}

/**
 * 日付文字列をフォーマット変換する
 * @param {string} dateStr 変換元の日付文字列（例: '2025/05/18'）
 * @param {string} inputFormat 入力フォーマット（例: 'YYYY/MM/DD'）
 * @param {string} outputFormat 出力フォーマット（例: 'YYYY-MM-DD'）
 * @returns {string} 変換後の日付文字列
 */
export function formatDate(dateStr, inputFormat = 'YYYY/MM/DD', outputFormat = 'YYYY-MM-DD') {
  return dayjs(dateStr, inputFormat).format(outputFormat);
}

/**
 * 特定の日付の前日を取得する
 * @param {string} dateStr 基準日（例: '2025/05/18'）
 * @param {string} inputFormat 入力フォーマット（例: 'YYYY/MM/DD'）
 * @param {string} outputFormat 出力フォーマット（例: 'YYYY-MM-DD'）
 * @returns {string} 前日の日付
 */
export function getPreviousDay(dateStr, inputFormat = 'YYYY/MM/DD', outputFormat = 'YYYY-MM-DD') {
  return dayjs(dateStr, inputFormat).subtract(1, 'day').format(outputFormat);
}
