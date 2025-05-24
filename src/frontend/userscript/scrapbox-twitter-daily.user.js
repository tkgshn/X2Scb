// ==UserScript==
// @name         Scrapbox Twitter Daily
// @namespace    http://0xtkgshn.com/
// @version      0.3
// @description  自動的に指定日のツイートをScrapboxの日付ページに追加します
// @author       tkgshn
// @match        https://scrapbox.io/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

(async function() {
    'use strict';

    // 設定 - テンプレート使用時はここを変更してください
    const CONFIG = {
        // GitHubのユーザー名 (あなたのGitHubユーザー名に変更)
        GITHUB_USERNAME: 'YOUR_GITHUB_USERNAME',
        // GitHubのリポジトリ名 (作成したリポジトリ名に変更)
        GITHUB_REPO: 'X2Scb',
    };

    // GM_xmlhttpRequestを使用したfetchヘルパー関数
    const gmFetch = (url, options = {}) => {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: options.method || 'GET',
                url: url,
                headers: options.headers || {},
                data: options.body,
                onload: function(response) {
                    const result = {
                        ok: response.status >= 200 && response.status < 300,
                        status: response.status,
                        statusText: response.statusText,
                        text: () => Promise.resolve(response.responseText),
                        json: () => Promise.resolve(JSON.parse(response.responseText))
                    };
                    resolve(result);
                },
                onerror: function(response) {
                    reject(new Error(`Network error: ${response.statusText || 'Unknown error'}`));
                }
            });
        });
    };

    // 関数: DOMが読み込まれるまで待機する
    const waitForScrapboxReady = async () => {
        while (!unsafeWindow.scrapbox || !unsafeWindow.scrapbox.Page || !unsafeWindow.scrapbox.Page.title) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('Scrapboxの準備が完了しました');
        return true;
    };

    // 関数: 日付文字列をYYYY-MM-DD形式に変換する
    const formatDateString = (dateStr) => {
        // 2025/05/18 または 2025/5/18 → 2025-05-17 (前日)
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;

        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        date.setDate(date.getDate() - 1); // 前日

        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // 関数: URLパラメータから値を取得
    const getUrlParameter = (name) => {
        const urlParams = new URLSearchParams(window.location.search);
        const value = urlParams.get(name);
        console.log('URLパラメータを取得しました:', name, '=', value);
        return value;
    };

    // 関数: Scrapboxにコンテンツを追加
    const addContentToPage = (content, flagText) => {
        try {
            console.log('addContentToPage開始');
            console.log('ページ行数:', unsafeWindow.scrapbox.Page.lines.length);
            console.log('編集中かどうか:', unsafeWindow.scrapbox.Page.editing);

            if (unsafeWindow.scrapbox.Page.lines.length <= 1) {
                // ページが空の場合（タイトルのみ）
                console.log('空ページとして処理');
                if (unsafeWindow.scrapbox.Page.editing) {
                    console.log('既に編集中 - 直接挿入');
                    unsafeWindow.scrapbox.Page.buffer.insert(content + `\n${flagText}`);
                } else {
                    console.log('編集モードではない - 編集モード開始を試行');
                    // 編集モードに切り替え
                    if (startEditMode()) {
                        console.log('編集モード開始成功 - 500ms後に挿入');
                        setTimeout(() => {
                            if (unsafeWindow.scrapbox.Page.buffer && typeof unsafeWindow.scrapbox.Page.buffer.insert === 'function') {
                                console.log('遅延挿入実行');
                                unsafeWindow.scrapbox.Page.buffer.insert(content + `\n${flagText}`);
                            } else {
                                console.log('bufferが利用できません');
                            }
                        }, 500);
                    } else {
                        console.warn('編集モードの開始に失敗しました。直接挿入を試行します。');
                        if (unsafeWindow.scrapbox.Page.buffer && typeof unsafeWindow.scrapbox.Page.buffer.insert === 'function') {
                            unsafeWindow.scrapbox.Page.buffer.insert(content + `\n${flagText}`);
                        }
                    }
                }
            } else {
                // データをページの末尾に追加
                console.log('既存ページとして処理');
                if (unsafeWindow.scrapbox.Page.editing) {
                    console.log('既に編集中 - 末尾に挿入');
                    unsafeWindow.scrapbox.Page.buffer.insert('\n\n' + content + `\n${flagText}`, unsafeWindow.scrapbox.Page.lines.length);
                } else {
                    console.log('編集モードではない - 編集モード開始を試行');
                    // 編集モードに切り替え
                    if (startEditMode()) {
                        console.log('編集モード開始成功 - 500ms後に末尾挿入');
                        setTimeout(() => {
                            if (unsafeWindow.scrapbox.Page.buffer && typeof unsafeWindow.scrapbox.Page.buffer.insert === 'function') {
                                console.log('遅延末尾挿入実行');
                                unsafeWindow.scrapbox.Page.buffer.insert('\n\n' + content + `\n${flagText}`, unsafeWindow.scrapbox.Page.lines.length);
                            } else {
                                console.log('bufferが利用できません');
                            }
                        }, 500);
                    } else {
                        console.warn('編集モードの開始に失敗しました。直接挿入を試行します。');
                        if (unsafeWindow.scrapbox.Page.buffer && typeof unsafeWindow.scrapbox.Page.buffer.insert === 'function') {
                            unsafeWindow.scrapbox.Page.buffer.insert('\n\n' + content + `\n${flagText}`, unsafeWindow.scrapbox.Page.lines.length);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('コンテンツの追加中にエラーが発生しました:', error);
            showNotification('コンテンツの追加中にエラーが発生しました。手動でページを編集モードにしてください。', 'error');
        }
    };

    // 関数: 通知表示
    const showNotification = (message, type = 'success') => {
        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            info: '#3498db'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `position: fixed; bottom: 20px; right: 20px; background: ${colors[type]}; color: white; padding: 10px 20px; border-radius: 5px; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: opacity 0.5s;`;
        notification.innerHTML = message;
        document.body.appendChild(notification);

        // 3秒後に通知を消す
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    };

    // 関数: 編集モードを開始する
    const startEditMode = () => {
        try {
            // 方法1: scrapbox.Page.edit()
            if (typeof unsafeWindow.scrapbox.Page.edit === 'function') {
                unsafeWindow.scrapbox.Page.edit();
                return true;
            }

            // 方法2: startEdit()メソッドを試す
            if (typeof unsafeWindow.scrapbox.Page.startEdit === 'function') {
                unsafeWindow.scrapbox.Page.startEdit();
                return true;
            }

            // 方法3: DOM操作で編集可能な領域をクリック
            const editableArea = document.querySelector('.page-content, .editor, .line');
            if (editableArea && typeof editableArea.click === 'function') {
                editableArea.click();
                return true;
            }

            console.warn('編集モードの開始に失敗しました');
            return false;
        } catch (error) {
            console.error('編集モード開始中にエラー:', error);
            return false;
        }
    };

    // 関数: データ表示モーダルを作成
    const showDataModal = (title, content, onCopyCallback = null) => {
        // 既存のモーダルがあれば削除
        const existingModal = document.getElementById('twitter-data-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // モーダルの作成
        const modal = document.createElement('div');
        modal.id = 'twitter-data-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // モーダルコンテンツ
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 80%;
            max-height: 80%;
            overflow: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        // タイトル
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        titleElement.style.cssText = 'margin: 0 0 15px 0; color: #333;';

        // データ表示エリア
        const dataArea = document.createElement('textarea');
        dataArea.value = content;
        dataArea.style.cssText = `
            width: 100%;
            height: 300px;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            resize: vertical;
            margin-bottom: 15px;
        `;
        dataArea.readOnly = true;

        // ボタンコンテナ
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

        // コピーボタン
        const copyButton = document.createElement('button');
        copyButton.textContent = 'コピー';
        copyButton.style.cssText = `
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;

        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(content);
                copyButton.textContent = 'コピー完了!';
                copyButton.style.background = '#28a745';

                // コピー完了後の処理
                setTimeout(() => {
                    modal.remove(); // モーダルを閉じる
                    if (onCopyCallback) {
                        onCopyCallback(); // コールバックを実行
                    }
                }, 1000);

            } catch (err) {
                // フォールバック：テキストエリアを選択してコピー
                dataArea.select();
                document.execCommand('copy');
                copyButton.textContent = 'コピー完了!';
                copyButton.style.background = '#28a745';

                // コピー完了後の処理
                setTimeout(() => {
                    modal.remove(); // モーダルを閉じる
                    if (onCopyCallback) {
                        onCopyCallback(); // コールバックを実行
                    }
                }, 1000);
            }
        });

        // 閉じるボタン
        const closeButton = document.createElement('button');
        closeButton.textContent = '閉じる';
        closeButton.style.cssText = `
            background: #6c757d;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;

        closeButton.addEventListener('click', () => {
            modal.remove();
        });

        // ESCキーで閉じる
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // 要素の組み立て
        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(closeButton);
        modalContent.appendChild(titleElement);
        modalContent.appendChild(dataArea);
        modalContent.appendChild(buttonContainer);
        modal.appendChild(modalContent);

        // ページに追加
        document.body.appendChild(modal);

        // テキストエリアにフォーカス
        dataArea.focus();
    };

    // 関数: 指定日付のデータが既にページに存在するかチェック
    const isDataAlreadyExists = (dateString) => {
        try {
            const pageText = unsafeWindow.scrapbox.Page.lines.map(line => line.text).join('\n');
            const importedFlagText = `のツイートまとめ`;
            return pageText.includes(importedFlagText);
        } catch (error) {
            console.error('ページ内容の確認中にエラーが発生しました:', error);
            return false;
        }
    };

    // 関数: ツイートデータをScrapbox形式にフォーマット
    const formatTweetData = (rawData, dateString) => {
        try {
            let tweetData;

            // rawDataがオブジェクトかどうかをチェック
            if (typeof rawData === 'object' && rawData !== null) {
                // 既にJSONオブジェクトの場合
                tweetData = rawData;
            } else {
                // 文字列の場合はJSONパースを試行
                try {
                    tweetData = JSON.parse(rawData);
                } catch {
                    // JSONでない場合は、既にフォーマット済みテキストとして扱う
                    return rawData;
                }
            }

            const formattedDate = dateString.replace(/-/g, '/');
            let formattedContent = `[* ${formattedDate} のツイートまとめ]\n`;

            // 自分のツイート section (posts)
            if (tweetData.posts && tweetData.posts.length > 0) {
                formattedContent += `[** 自分のツイート!]\n`;

                tweetData.posts.forEach(post => {
                    // URLをIDから生成
                    const tweetUrl = `https://twitter.com/inoue2002/status/${post.id}`;
                    formattedContent += `>[${tweetUrl}]\n`;

                    // ツイート内容を引用形式で追加（空行はスキップ）
                    const tweetLines = post.text.split('\n');
                    tweetLines.forEach(line => {
                        if (line.trim()) {
                            formattedContent += `>${line}\n`;
                        }
                    });

                    // サマリーがある場合
                    if (post.summary) {
                        formattedContent += ` [summary.icon] ${post.summary}\n`;
                    }

                    formattedContent += '\n'; // ツイート間の空行
                });
            }

            // リツイート section (rts)
            if (tweetData.rts && tweetData.rts.length > 0) {
                formattedContent += `[** リツイート]\n`;

                tweetData.rts.forEach(rt => {
                    // URLをIDから生成（リツイートの場合は/i/web/statusを使用）
                    const retweetUrl = `https://twitter.com/i/web/status/${rt.id}`;
                    formattedContent += `>[${retweetUrl}]\n`;

                    // リツイート内容（orig_textがあればそれを、なければtextを使用）
                    const retweetText = rt.orig_text || rt.text;
                    const retweetLines = retweetText.split('\n');
                    retweetLines.forEach(line => {
                        if (line.trim()) {
                            formattedContent += `>${line}\n`;
                        }
                    });

                    // サマリーがある場合
                    if (rt.summary) {
                        formattedContent += ` [summary.icon] ${rt.summary}\n`;
                    }

                    formattedContent += '\n'; // リツイート間の空行
                });
            }

            return formattedContent;

        } catch (error) {
            console.error('ツイートデータのフォーマット中にエラーが発生しました:', error);
            // エラーの場合は元のデータを文字列として返す
            return typeof rawData === 'object' ? JSON.stringify(rawData, null, 2) : rawData;
        }
    };

    // メイン処理
    await waitForScrapboxReady();

    // 日付パラメータがURLに指定されているか確認
    const dateParam = getUrlParameter('date');
    if (dateParam) {
        const targetDate = dateParam;

        // 既にページに該当データが存在するかチェック
        if (isDataAlreadyExists(targetDate)) {
            showNotification(`${targetDate} のデータは既にこのページに存在します。`, 'info');
            return;
        }

        const targetPageTitle = `${targetDate.replace(/-/g, '/')}のツイートまとめ`;

        // 指定された日付のデータをインポート
        try {
            // GitHubからデータを取得
            const dataUrl = `https://${CONFIG.GITHUB_USERNAME}.github.io/${CONFIG.GITHUB_REPO}/public/${targetDate}.json`;
            const response = await gmFetch(dataUrl);

            if (!response.ok) {
                showNotification(`${targetDate} のデータが見つかりませんでした`, 'error');
                return;
            }

            // 新しいページを作成するか確認するダイアログを表示
            const createNewPage = confirm(`${targetDate} のツイートデータをインポートします。新しいページ「${targetPageTitle}」を作成しますか？`);

            if (createNewPage) {
                // 新しいページに移動
                window.location.href = `/${unsafeWindow.scrapbox.Project.name}/${encodeURIComponent(targetPageTitle)}?edit=true`;
                return;
            }

            // 現在のページにデータを追加
            const tweetContent = await response.json();

            // データをScrapbox形式にフォーマット
            const formattedContent = formatTweetData(tweetContent, targetDate);

            // モーダルでデータを表示（コピー可能）
            showDataModal(`${targetDate} のツイートデータ1`, formattedContent, () => {
                // コピー完了時の通知
                showNotification(`${targetDate} のデータをコピーしました！`, 'success');
            });

            showNotification(`${targetDate} のツイートデータを取得しました！モーダルからコピーできます。`);

        } catch (error) {
            console.error('ツイートデータの取得中にエラーが発生しました:', error);
            showNotification(`ツイートデータの取得中にエラーが発生しました: ${error.message}`, 'error');
        }

        return;
    }

    // 通常の日付ページ処理
    const pageTitle = unsafeWindow.scrapbox.Page.title;

    // 日付ページの判定: YYYY/MM/DD または YYYY/M/D 形式のページかチェック
    if (!/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(pageTitle)) {
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

    // 既にページに該当データが存在するかチェック
    if (isDataAlreadyExists(yesterdayDate)) {
        console.log(`${yesterdayDate} のデータは既にこのページに存在します`);
        return;
    }

    try {
        // GitHub Pagesから前日のデータを取得
        const dataUrl = `https://${CONFIG.GITHUB_USERNAME}.github.io/${CONFIG.GITHUB_REPO}/public/${yesterdayDate}.json`;

        // データを取得
        const response = await gmFetch(dataUrl);

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

        const tweetContent = await response.json();

        // データをScrapbox形式にフォーマット
        const formattedContent = formatTweetData(tweetContent, yesterdayDate);

        // モーダルでデータを表示（コピー可能）
        showDataModal(`${yesterdayDate} のツイートデータ`, formattedContent, () => {
            // コピー完了時の通知
            showNotification(`${yesterdayDate} のデータをコピーしました！`, 'success');
        });

        showNotification(`${yesterdayDate} のツイートデータを取得しました！モーダルからコピーできます。`);

    } catch (error) {
        console.error('ツイートデータの取得中にエラーが発生しました:', error);
        showNotification(`ツイートデータの取得中にエラーが発生しました: ${error.message}`, 'error');
    }
})();
