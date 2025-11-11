---
title: 役立つ情報
id: 2148
comments: false
date: 2023-04-04 21:03:05
lang: ja
---

## について
このページには私にとって役立つ情報が含まれています。このブログのテストページとしても機能します。

## よく使うプロンプト
ブログタイトルの文字列をLinuxフレンドリーなファイル名に変換します。
```
コロンをダッシュに、英数字以外をアンダースコアに置き換えて文字列を変換。繰り返しのアンダースコアまたはダッシュを単一のアンダースコアまたはダッシュに削減：
```

## ソフトウェア開発

### セキュリティ
* [計装ツールキット](https://www.frida.re/)
* コマンド実行時にProxy-Authorizationなどの機密情報をマスク、
  `curl -v https://somewhere.need.authenticated.proxy 2>&1 | sed -E "s/(proxy-authorization:).*/\\1: ***/i"`
* [Nessus](https://www.nessus.org/)
* [OWASP](https://www.owasp.org/)
* [SANS](https://www.sans.org)
* [脆弱性データベース](https://www.cybersecurity-help.cz/vdb/)

### その他
* [Alpine Linuxパッケージの作成](https://wiki.alpinelinux.org/wiki/Creating_an_Alpine_package)
* [Visual Studio Code Windows用キーボードショートカット](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf)

## よく使うコマンド
* Windowsを即座にシャットダウン ```shutdown -r -t 0```、WindowsPCにリモート接続する際に便利
* Javaバージョンの切り替え
{% codeblock %}export JAVA_HOME=`/usr/libexec/java_home -v 1.8`{% endcodeblock %}

### Git
* 元に戻す（プッシュされていない）
```git reset --soft HEAD~```
* リモートブランチの削除
```git push [remote] --delete [branch]```
例：```git push origin --delete feature/branch```
* リモートブランチを同期し、リモートに存在しないローカルコピーを削除
```git fetch --prune```
* ブランチ間のコミットの違いをリスト
```git rev-list [branch]...[another branch]```
* どのブランチがコミットを所有しているかを示す矢印付きでブランチ間のコミットの違いをリスト
```git rev-list --left-right [branch]...[another branch]```
* ブランチがリモートブランチに対して進んでいる/遅れているコミットをリスト
```git rev-list [branch]...[remote]/[another branch]```
* ブランチ間の進み/遅れの数を表示
```git rev-list --left-right count [branch]...[another branch]```
* 最新のコミットでサブモジュールを更新
```git submodule update --remote```
* 孤立したコミットをクリーンアップ
```git gc --prune=now --aggressive```

## Windows

### XBoxの削除
* PowershellでXBoxを削除 ```Get-ProvisionedAppxPackage -Online | Where-Object { $_.PackageName -match "xbox" } | ForEach-Object { Remove-ProvisionedAppxPackage -Online -AllUsers -PackageName $_.PackageName }```
* Xboxアプリケーションが残っているかチェック ```dism /Online /Get-ProvisionedAppxPackages | Select-String PackageName | Select-String xbox```

### Windowsショートカット
よく使用され、忘れやすいもののみをリストしています。
| | |
| --- | --- |
| ウィンドウを別のモニターに移動 | <kbd>&#x229E; Windows</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd> |
| 別のデスクトップに切り替え | <kbd>&#x229E; Windows</kbd> + <kbd>⌃ Control</kbd> + <kbd>←</kbd> / <kbd>→</kbd> |
| タスクビュー | <kbd>&#x229E; Windows</kbd> + <kbd>Tab</kbd> |
| アクションセンターを開く | <kbd>&#x229E; Windows</kbd> + <kbd>A</kbd> |
| デスクトップを表示/非表示 | <kbd>&#x229E; Windows</kbd> + <kbd>D</kbd> |
| ファイルエクスプローラーを開く | <kbd>&#x229E; Windows</kbd> + <kbd>E</kbd> |
| クイックリンクメニュー（イベントビューアーなどのシステムツール） | <kbd>&#x229E; Windows</kbd> + <kbd>X</kbd> |
| ロック | <kbd>&#x229E; Windows</kbd> + <kbd>L</kbd> |

### 編集
| | |
| --- | --- |
| 音声入力の切り替え | <kbd>&#x229E; Windows</kbd> + <kbd>H</kbd> |
| クリップボード履歴を開く | <kbd>&#x229E; Windows</kbd> + <kbd>⌃ Control</kbd> + <kbd>V</kbd> |
| プレーンテキストとして貼り付け[^1] | <kbd>&#x229E; Windows</kbd> + <kbd>V</kbd>[^2] |
| 画面をキャプチャしてOCRでクリップボードに[^1] | <kbd>&#x229E; Windows</kbd> + <kbd>T</kbd>[^2] |
| 絵文字 | <kbd>&#x229E; Windows</kbd> + <kbd>.</kbd>[^2] |

[^1]:PowerToysが必要
[^2]:カスタマイズされたショートカット

## Visual Studio Codeショートカット
よく使用され、忘れやすいもののみをリストしています。https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdfから参照

### 基本
| | |
| --- | --- |
| ユーザー設定 | <kbd>⌃ Control</kbd> + <kbd>,</kbd> |
| 検索一致のすべての出現を選択 |  <kbd>Alt</kbd> + <kbd>Enter</kbd> |
| クイックフィックス |  <kbd>⌃ Control<</kbd> + <kbd>.</kbd> |
| 末尾の空白をトリム |  <kbd>⌃ Control<</kbd> + <kbd>K</kbd> <kbd>⌃ Control<</kbd> + <kbd>X</kbd> |

### ナビゲーション
| | |
| --- | --- |
| 行に移動... | <kbd>⌃ Control</kbd> + <kbd>G</kbd> |
| ファイルに移動... | <kbd>⌃ Control</kbd> + <kbd>P</kbd> |
| 次のエラーまたは警告に移動 | <kbd>F8</kbd> |
| 1番目、2番目、3番目...のエディターグループにフォーカス |  <kbd>⌃ Control</kbd> + <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd>... |
| エディターを分割 |  <kbd>⌃ Control</kbd> + <kbd>\\</kbd> |
| 統合ターミナルを表示 | <kbd>⌃ Control</kbd> + <kbd>`</kbd> |
| 新しいターミナルを作成 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>`</kbd> |
| エクスプローラーを表示/フォーカスを切り替え | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>E</kbd> |
| 検索を表示 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>S</kbd> |
| ソース管理を表示 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>G</kbd> |
| デバッグを表示 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>D</kbd> |
| 拡張機能を表示 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>X</kbd> |
| ファイル内で置換 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>H</kbd> |
| 出力パネルを表示 | <kbd>⌃ Control</kbd> + <kbd>&#x21E7; Shift</kbd> + <kbd>U</kbd> |
| Markdownプレビューを横に開く | <kbd>⌃ Control</kbd> + <kbd>K</kbd> <kbd>V</kbd> |

### デバッグ
| | |
| --- | --- |
| ブレークポイントの切り替え | <kbd>F9</kbd> |
| 開始/続行 | <kbd>F5</kbd> |
| ステップオーバー | <kbd>F10</kbd> |
| ステップイン | <kbd>F11</kbd> |
| ステップアウト | <kbd>&#x21E7; Shift</kbd> + <kbd>F11</kbd> |

## その他

* [ガイド](guides)
* [学習](learning)
* [ツール](useful_tools)
