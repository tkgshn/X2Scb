# X2Scb - Twitter to Scrapbox 日誌生成システム

このシステムは、あなたの最近のツイートとリツイートを収集し、Scrapbox の日付ページに自動的に追加するためのツールです。リツイートには、OpenAI の GPT を使用して要約も自動生成します。

## 概要

このシステムは以下の 2 つの部分で構成されています：

1. **バックエンド処理（daily.js）**：

   - Twitter の API を使ってツイートを取得
   - OpenAI API を使ってリツイートの内容を要約
   - 結果を JSON と Scrapbox 形式のテキストファイルとして保存

2. **フロントエンド処理（src/frontend/userscript/scrapbox-twitter-daily.user.js）**：
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
   - `.env`ファイルを作成（`.env-example`をコピーして使用できます）
     ```
     TW_BEARER=your_twitter_bearer_token
     OPENAI_API_KEY=your_openai_api_key
     SCRAPBOX_PROJECT=your_scrapbox_project_name
     ```
   - またはシェルで直接設定
     ```
     export TW_BEARER=your_twitter_bearer_token
     export OPENAI_API_KEY=your_openai_api_key
     export SCRAPBOX_PROJECT=your_scrapbox_project_name
     ```

#### 実行方法

```
node daily.js [project_name] [YYYY-MM-DD]
```

- `project_name`: Scrapbox プロジェクト名（省略時は環境変数から取得、またはデフォルト値）
- `YYYY-MM-DD`: 指定日のツイートを取得（省略時は前日）

これにより、`public/YYYY-MM-DD.json`と`public/YYYY-MM-DD.txt`ファイルが生成されます。また、Scrapbox へのインポート用 HTML ファイルも生成されます。

### 2. GitHub Pages へのデプロイ

生成されたファイルをウェブ上で利用できるようにするために、GitHub Pages を設定します：

1. このリポジトリを GitHub にプッシュします
2. リポジトリの設定で、GitHub Pages を有効にします
   - Source: main ブランチの`/`フォルダまたは`/public`フォルダ
3. GitHub Actions を設定して、定期的に`daily.js`を実行することができます
   - `.github/workflows/daily.yml`ファイルを参照してください

### 3. ユーザースクリプトのインストール

1. Tampermonkey（または別のユーザースクリプトマネージャー）をブラウザにインストールします
2. `src/frontend/userscript/scrapbox-twitter-daily.user.js`ファイルを開き、Tampermonkey にインストールします
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

1. GitHub リポジトリの「Settings」→「Secrets and variables」→「Actions」で以下のシークレットを設定

   - `TW_BEARER` - Twitter の Bearer Token
   - `OPENAI_API_KEY` - OpenAI API キー
   - `SCRAPBOX_PROJECT` - （オプション）Scrapbox プロジェクト名

2. GitHub リポジトリの「Settings」→「Actions」→「General」で以下を設定

   - Workflow permissions: 「Read and write permissions」を選択して保存

3. GitHub Actions ワークフローは毎日午前 0 時（UTC）/ 午前 9 時（JST）に実行されます

4. 手動実行もできます：GitHub リポジトリの「Actions」タブ →「Daily Tweets Collector」→「Run workflow」

## トラブルシューティング

- **環境変数が読み込まれない**: `.env`ファイルが正しい場所にあることを確認するか、コマンドライン引数で指定してください
- **Twitter API エラー**: API の利用制限やトークンの有効期限を確認してください
- **GitHub Actions エラー**:
  - シークレットが正しく設定されているか確認
  - リポジトリの「Settings」→「Actions」→「General」で「Read and write permissions」が有効になっているか確認

## カスタマイズ

- `daily.js`の Twitter クエリパラメーターを変更することで、取得するツイートを調整できます
- OpenAI の要約プロンプトやモデルも調整可能です（現在は gpt-4o-mini を使用）
- ユーザースクリプトの UI やインポート動作も好みに合わせて変更できます

## ディレクトリ構造

```
X2Scb/
├── .github/workflows/  - GitHub Actions設定
├── data/              - データ関連ファイル
├── public/            - 生成されたファイル（GitHub Pagesで公開）
├── src/               - ソースコード
│   ├── backend/       - バックエンド処理のコード
│   ├── frontend/      - フロントエンド（ユーザースクリプト）
│   └── utils/         - ユーティリティ関数
├── daily.js           - メインスクリプト
├── .env-example       - 環境変数の例
└── README.md          - このファイル
```

## ライセンス

MIT

## 貢献

プルリクエストやイシューは歓迎します！
