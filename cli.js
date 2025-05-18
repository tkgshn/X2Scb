#!/usr/bin/env node

/**
 * X2Scb CLI - プロジェクト操作のための簡易コマンドラインインターフェース
 *
 * 使用方法:
 *   node cli.js <コマンド>
 *
 * 利用可能なコマンド:
 *   dev        - 開発モードで実行 (nodemon)
 *   test       - テストを実行
 *   watch      - テストを監視モードで実行
 *   coverage   - カバレッジレポートを生成
 *   clean      - 生成ファイルを削除
 *   build      - ビルドプロセスを実行（このプロジェクトでは何もしない）
 *   full       - 開発サーバーとテスト監視を同時に実行
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// 現在のディレクトリを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// package.jsonを読み込む
const packageJson = JSON.parse(
  fs.readFileSync(resolve(__dirname, 'package.json'), 'utf8')
);

// 利用可能なコマンド
const commands = {
  dev: 'dev',
  test: 'test',
  watch: 'test:watch',
  coverage: 'test:coverage',
  clean: 'clean',
  build: 'build',
  full: 'dev:full',
};

// ヘルプメッセージを表示
function showHelp() {
  console.log('\nX2Scb CLI - プロジェクト操作のためのコマンドラインツール');
  console.log('\n使用方法: node cli.js <コマンド>\n');
  console.log('利用可能なコマンド:');
  console.log('  dev        - 開発モードで実行 (nodemon)');
  console.log('  test       - テストを実行');
  console.log('  watch      - テストを監視モードで実行');
  console.log('  coverage   - カバレッジレポートを生成');
  console.log('  clean      - 生成ファイルを削除');
  console.log('  build      - ビルドプロセスを実行');
  console.log('  full       - 開発サーバーとテスト監視を同時に実行\n');
  process.exit(0);
}

// コマンドライン引数を解析
const args = process.argv.slice(2);
const cmd = args[0];

// コマンドが指定されていない、または無効な場合はヘルプを表示
if (!cmd || !commands[cmd]) {
  showHelp();
}

// 対応するnpmスクリプトを実行
const npmCmd = commands[cmd];
console.log(`実行中: npm run ${npmCmd}`);

// OSに応じてnpmコマンドを選択
const isWindows = process.platform === 'win32';
const npmExecutable = isWindows ? 'npm.cmd' : 'npm';

// スクリプトを実行
const child = spawn(npmExecutable, ['run', npmCmd], {
  stdio: 'inherit',
  shell: true
});

// 終了処理
child.on('close', (code) => {
  if (code !== 0) {
    console.error(`コマンド実行エラー: npm run ${npmCmd} (終了コード: ${code})`);
  }
  process.exit(code);
});
