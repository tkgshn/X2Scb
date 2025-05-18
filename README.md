# X2Scb - Twitter to Scrapbox 日誌生成システム

このシステムは、あなたの最近のツイートとリツイートを収集し、Scrapbox の日付ページに自動的に追加するためのツールです。リツイートには、OpenAI の GPT を使用して要約も自動生成します。

## 概要

このシステムは以下の 2 つの部分で構成されています：

1. **バックエンド処理（daily.js）**：

   - Twitter の API を使ってツイートを取得
   - OpenAI API を使ってリツイートの内容を要約
   - 結果を JSON と Scrapbox 形式のテキストファイルとして保存

2. **フロントエンド処理（scrapbox-twitter-daily.user.js）**：
   - Tampermonkey/Greasemonkey で動作するユーザースクリプト
   - Scrapbox の日付ページを開いたとき、自動的に前日のツイート情報を追加

## セットアップ手順

### 1. バックエンド設定

#### 必要なもの

- Node.js (v16 以上)
- Twitter API Bearer Token
- OpenAI API キー

#### インストール手順

1. このリポジトリをクローンするか、ダウンロードします

   ```
   git clone https://github.com/yourusername/X2Scb.git
   cd X2Scb
   ```

2. 必要なパッケージをインストールします

   ```
   npm install
   ```

3. 環境変数を設定します（以下のいずれかの方法で）
   - `.env`ファイルを作成
     ```
     TW_BEARER=your_twitter_bearer_token
     OPENAI_API_KEY=your_openai_api_key
     ```
   - またはシェルで直接設定
     ```
     export TW_BEARER=your_twitter_bearer_token
     export OPENAI_API_KEY=your_openai_api_key
     ```

#### 実行方法

```
node daily.js
```

これにより、`public/YYYY-MM-DD.json`と`public/YYYY-MM-DD.txt`ファイルが生成されます。ここで、`YYYY-MM-DD`は昨日の日付を表します。

### 2. GitHub Pages へのデプロイ

生成されたファイルをウェブ上で利用できるようにするために、GitHub Pages を設定します：

1. このリポジトリを GitHub にプッシュします
2. リポジトリの設定で、GitHub Pages を有効にします
   - Source: main ブランチの`/`フォルダ
3. GitHub Actions を設定して、定期的に`daily.js`を実行することができます
   - `.github/workflows/daily.yml`ファイルを参照してください

### 3. ユーザースクリプトのインストール

1. Tampermonkey（または別のユーザースクリプトマネージャー）をブラウザにインストールします
2. `scrapbox-twitter-daily.user.js`ファイルを開き、Tampermonkey にインストールします
3. スクリプト内の`dataUrl`の部分を、あなた自身の GitHub Pages のドメインに変更します
   ```javascript
   const dataUrl = `https://yourusername.github.io/X2Scb/public/${yesterdayDate}.txt`;
   ```

## 使い方

1. 毎日、`daily.js`を実行して前日のツイート情報を収集します
   - 自動化するには GitHub Actions を使用します
2. Scrapbox で任意の日付ページ（例：`2025/05/18`）を開きます
3. ユーザースクリプトが自動的に前日（例：`2025-05-17`）のツイート情報をページに追加します

## GitHub Actions による自動化

このリポジトリには、GitHub Actions を使って毎日自動的に`daily.js`を実行する設定が含まれています。設定するには：

1. GitHub リポジトリの「Settings」→「Secrets」で以下のシークレットを設定

   - `TW_BEARER` - Twitter の Bearer Token
   - `OPENAI_API_KEY` - OpenAI API キー

2. GitHub Actions ワークフローは毎日午前 0 時（UTC）に実行されます

## カスタマイズ

- `daily.js`の Twitter クエリパラメーターを変更することで、取得するツイートを調整できます
- OpenAI の要約プロンプトやモデルも調整可能です
- ユーザースクリプトの UI やインポート動作も好みに合わせて変更できます

## ライセンス

MIT

## 貢献

プルリクエストやイシューは歓迎します！
