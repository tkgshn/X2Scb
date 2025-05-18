// ==UserScript==
// @name         Scrapbox Twitter Daily
// @namespace    http://0xtkgshn.com/
// @version      0.1
// @description  自動的に前日のツイートをScrapboxの日付ページに追加します
// @author       tkgshn
// @match        https://scrapbox.io/*/20*
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    // 関数: DOMが読み込まれるまで待機する
    const waitForScrapboxReady = async () => {
        while (!window.scrapbox || !window.scrapbox.Page || !window.scrapbox.Page.title) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return true;
    };

    // 関数: 日付文字列をYYYY-MM-DD形式に変換する
    const formatDateString = (dateStr) => {
        // 2025/05/18 → 2025-05-17 (前日)
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;

        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        date.setDate(date.getDate() - 1); // 前日

        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // メイン処理
    await waitForScrapboxReady();

    const pageTitle = window.scrapbox.Page.title;

    // 日付ページの判定: YYYY/MM/DD 形式のページかチェック
    if (!/^\d{4}\/\d{2}\/\d{2}$/.test(pageTitle)) {
        console.log('日付ページではありません:', pageTitle);
        return;
    }

    // 前日の日付を取得
    const yesterdayDate = formatDateString(pageTitle);
    if (!yesterdayDate) {
        console.error('日付の変換に失敗しました');
        return;
    }

    console.log(`前日の日付: ${yesterdayDate}`);

    try {
        // GitHub Pagesから前日のデータを取得
        // 注: 実際の運用では自分のGitHub Pagesのドメインに変更する
        const dataUrl = `https://0xtkgshn.github.io/X2Scb/public/${yesterdayDate}.txt`;

        // データをロードしたか確認するためのフラグを追加
        const importedFlagText = '[twitter-daily-imported]';

        // すでにページ内にデータがインポートされているか確認
        const pageText = scrapbox.Page.lines.map(line => line.text).join('\n');
        if (pageText.includes(importedFlagText)) {
            console.log('すでにTwitterデータがインポートされています');
            return;
        }

        // データを取得
        const response = await fetch(dataUrl);

        if (!response.ok) {
            console.log(`前日 (${yesterdayDate}) のデータが見つかりませんでした`);

            // データが見つからない場合にボタンを表示
            if (!document.getElementById('twitter-import-alert')) {
                const alertDiv = document.createElement('div');
                alertDiv.id = 'twitter-import-alert';
                alertDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #f8f8f8; border: 1px solid #ddd; padding: 10px; border-radius: 5px; z-index: 1000;';
                alertDiv.innerHTML = `
                    <p>前日 (${yesterdayDate}) のTwitterデータが見つかりませんでした。</p>
                    <button id="close-twitter-alert" style="background: #e8e8e8; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">閉じる</button>
                `;
                document.body.appendChild(alertDiv);

                document.getElementById('close-twitter-alert').addEventListener('click', () => {
                    document.getElementById('twitter-import-alert').remove();
                });
            }
            return;
        }

        const tweetContent = await response.text();

        // ページに追加
        if (scrapbox.Page.lines.length <= 1) {
            // ページが空の場合（タイトルのみ）
            if (scrapbox.Page.editing) {
                scrapbox.Page.buffer.insert(tweetContent + `\n${importedFlagText}`);
            } else {
                scrapbox.Page.edit();
                setTimeout(() => {
                    scrapbox.Page.buffer.insert(tweetContent + `\n${importedFlagText}`);
                }, 500);
            }
        } else {
            // データをページの末尾に追加
            if (scrapbox.Page.editing) {
                scrapbox.Page.buffer.insert('\n\n' + tweetContent + `\n${importedFlagText}`, scrapbox.Page.lines.length);
            } else {
                scrapbox.Page.edit();
                setTimeout(() => {
                    scrapbox.Page.buffer.insert('\n\n' + tweetContent + `\n${importedFlagText}`, scrapbox.Page.lines.length);
                }, 500);
            }
        }

        // インポート完了通知
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #2ecc71; color: white; padding: 10px 20px; border-radius: 5px; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: opacity 0.5s;';
        notification.textContent = '前日のTwitterデータをインポートしました！';
        document.body.appendChild(notification);

        // 3秒後に通知を消す
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);

    } catch (error) {
        console.error('ツイートデータの取得中にエラーが発生しました:', error);

        // エラー通知
        const errorNotification = document.createElement('div');
        errorNotification.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #e74c3c; color: white; padding: 10px 20px; border-radius: 5px; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.2);';
        errorNotification.innerHTML = `
            <p>ツイートデータの取得中にエラーが発生しました</p>
            <p style="font-size: 0.8em;">${error.message}</p>
        `;
        document.body.appendChild(errorNotification);

        // 5秒後に通知を消す
        setTimeout(() => errorNotification.remove(), 5000);
    }
})();
