/**
 * dateUtils.js のテスト
 */
import MockDate from 'mockdate'; // Mock Date（テスト用に日付を固定するため）
import { getYesterdayDate, formatDate, getPreviousDay } from '../dateUtils.js';

describe('dateUtils', () => {
  // 各テスト前に日付を固定
  beforeEach(() => {
    // 2023年5月15日に日付を固定
    MockDate.set('2023-05-15T12:00:00Z');
  });

  // 各テスト後にモックをリセット
  afterEach(() => {
    MockDate.reset();
  });

  describe('getYesterdayDate', () => {
    test('東京タイムゾーンでの前日の日付を正しく取得する', () => {
      const result = getYesterdayDate('Asia/Tokyo');
      expect(result.date).toBe('2023-05-14');
      // UTCの開始時刻と終了時刻のフォーマットを確認
      expect(result.startUtc).toMatch(/2023-05-13T15:00:00/);
      expect(result.endUtc).toMatch(/2023-05-14T14:59:59/);
    });

    test('異なるタイムゾーンでの前日の日付を正しく取得する', () => {
      const result = getYesterdayDate('America/New_York');
      expect(result.date).toBe('2023-05-14');
    });

    test('異なる日付フォーマットで前日の日付を取得する', () => {
      const result = getYesterdayDate('Asia/Tokyo', 'YYYY/MM/DD');
      expect(result.date).toBe('2023/05/14');
    });
  });

  describe('formatDate', () => {
    test('デフォルトフォーマットで日付を変換する', () => {
      const result = formatDate('2023/05/15');
      expect(result).toBe('2023-05-15');
    });

    test('カスタムフォーマットで日付を変換する', () => {
      const result = formatDate('2023-05-15', 'YYYY-MM-DD', 'MM/DD/YYYY');
      expect(result).toBe('05/15/2023');
    });
  });

  describe('getPreviousDay', () => {
    test('デフォルトフォーマットで前日を取得する', () => {
      const result = getPreviousDay('2023/05/15');
      expect(result).toBe('2023-05-14');
    });

    test('カスタムフォーマットで前日を取得する', () => {
      const result = getPreviousDay('2023-05-15', 'YYYY-MM-DD', 'MM/DD/YYYY');
      expect(result).toBe('05/14/2023');
    });
  });
});
