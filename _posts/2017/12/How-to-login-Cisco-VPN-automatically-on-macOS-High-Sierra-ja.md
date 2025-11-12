---
title: macOS High SierraでCisco VPNに自動ログインする方法
date: 2017-12-06
tags:
  - MacOS
category:
  - Cybersecurity
lang: ja
excerpt: "VPNパスワードの入力にうんざりしていませんか？AppleScriptとAutomatorを使ってmacOS上でCisco IPSec VPNログインを自動化しましょう。ワンクリック接続を簡単に実現！"
comments: true
---

Macintoshオペレーティングシステム（macOS）でCisco IPSec VPNにログインする際、パスワードを保存する方法はありません。

![セキュリティ上の理由でパスワードを保存できない？](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/vpn_login.png)

私にとって最適な解決策は、Automatorでアップルスクリプトを作成するか、コマンドラインから実行して、ログインプロセスを自動化することです。

## AutomatorでAppleScript

1. AppleのAutomatorを開きます
![Automator](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/automator.png)

2. `新規書類`を選択します
![新規書類](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/new_document.png)

3. `サービス`を選択します
作成されたサービスは、デフォルトで`選択された` `テキスト`を`受け取る`設定になっています。これは、サービスを有効にするためにテキストを選択するか、テキストエディタにフォーカスを当てる必要があることを意味します。
![サービス](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/service.png)

4. アクション`AppleScriptを実行`を検索します。次に、そのアクションを右側にドラッグします。
![アクション「AppleScriptを実行」を検索し、右側にドラッグします](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/run_apple_script.png)

5. 以下のコードをエディタに貼り付けます

{% codeblock lang:applescript %}
on run {input, parameters}

  set vpn_name to "'your VPN name'"
  set user_name to "your username"
  set passwd to "your password"

	tell application "System Events"
		set rc to do shell script "scutil --nc status " & vpn_name
		if rc starts with "Disconnected" then
			do shell script "scutil --nc start " & vpn_name & " --user " & user_name
			delay 3
			keystroke passwd
			keystroke return
		end if
	end tell
	return input
end run
{% endcodeblock %}

![スクリプトを含むエディタ](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/script_editor.png)

6. スクリプト内の`vpn_name`、`username`、`passwd`を更新します

`vpn_name`については、以下のスクリーンショットを参照してください。この例では`VPN (Cisco IPSec)`です。スクリプトは`scutil --nc status`を使用してVPN接続ステータスを確認し、`scutil --nc start`を使用してVPN接続を開始します。通常、VPNログインダイアログは3秒以内に表示されます。お使いのラップトップが遅い場合は、`delay 3`の値を更新してください。プロセスを自動化するには、再生ボタンを使用してスクリプトを実行し、動作を確認してください。

![VPN名](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/vpn_name.png)

7. `VPN Login`などの名前でスクリプトを保存します
`システム環境設定 -> キーボード -> ショートカット`で、自動化スクリプトを見つけることができます。ショートカットキーを割り当てます。デフォルトでは、スクリプトは作成時にテキストサービスに割り当てられます。キーボードショートカットを使用するには、テキストを選択するか、テキストエディタにフォーカスを当てる必要があります。
![VPNのホットキーを割り当てる](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/keyboard_shortcuts.png)

8. Atomなどのテキストエディタからテキストを選択してみてください。適切なショートカットキーを設定すれば、VPNログインを自動化できるはずです。このスクリプトはSierraまたはそれ以前のバージョンのmacOSでも動作するはずですが、私自身は古いシステムでテストしていません。古いmacOSプラットフォームでこの方法を使用した結果があれば、お知らせください。

![成功！](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/success.png)

## コマンドラインからAppleScript

1. AppleのScript Editorを開きます
![Automator](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/apple_script_editor.png)

2. `新規書類`を選択します

3. 以下のコードをエディタに貼り付けます。[AutomatorでAppleScript](?#automatorでapplescript)を参照してください

{% codeblock lang:applescript %}
set vpn_name to "'your VPN name'"
set user_name to "your username"
set passwd to "your password"

tell application "System Events"
	set rc to do shell script "scutil --nc status " & vpn_name
	if rc starts with "Disconnected" then
		do shell script "scutil --nc start " & vpn_name & " --user " & user_name
		delay 3
		keystroke passwd
		keystroke return
	end if
end tell
{% endcodeblock %}

4. スクリプトを保存します。ターミナルから`osascript [programfile]`でスクリプトを実行できます。

楽しんでください！
