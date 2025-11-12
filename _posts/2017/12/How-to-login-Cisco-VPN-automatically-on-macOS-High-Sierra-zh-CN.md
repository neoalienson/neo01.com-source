---
title: 如何在 macOS High Sierra 上自动登录 Cisco VPN
date: 2017-12-06
tags:
  - MacOS
category:
  - Cybersecurity
lang: zh-CN
excerpt: "厨烦每次输入 VPN 密码？使用 AppleScript 和 Automator 自动化 Cisco VPN 登录，一键连接！"
comments: true
---

在 Macintosh 操作系统（macOS）上登录 Cisco IPSec VPN 时，无法保存密码。

![基于安全原因无法保存密码？](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/vpn_login.png)

对我来说最好的解决方案是在 Automator 中编写 AppleScript，或从命令行运行它，以自动化登录过程。

## Automator 中的 AppleScript

1. 打开 Apple 的 Automator，
![Automator](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/automator.png)

2. 选择 `New Document`
![New Document](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/new_document.png)

3. 选择 `Service`
创建的服务默认为 `receives selected` `text`。这意味着您需要选择文本或在文本编辑器中有焦点才能启用该服务。
![Service](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/service.png)

4. 尝试搜索动作 `Run AppleScript`。然后，将动作拖曳到右侧。
![搜索动作"Run AppleScript"，然后将其拖曳到右侧](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/run_apple_script.png)

5. 将以下代码粘贴到编辑器中，

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

![带有脚本的编辑器](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/script_editor.png)

6. 更新脚本中的 `vpn_name`、`username` 和 `passwd`。

您可以参考下面的屏幕截图来获取 `vpn_name`，即 `VPN (Cisco IPSec)`。脚本使用 `scutil --nc status` 检查 VPN 连接状态，并使用 `scutil --nc start` 启动 VPN 连接。通常，VPN 登录对话框会在 3 秒内出现。如果您的笔记本电脑速度较慢，请更新 `delay 3` 中的值。要自动化该过程，请尝试使用播放按钮运行脚本并观察其工作方式。

![您的 VPN 名称](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/vpn_name.png)

7. 使用名称（如 `VPN Login`）保存脚本。
在 `System Preferences -> Keyboard -> Shortcuts` 中，您可以找到自动化脚本。分配快捷键。默认情况下，脚本在创建期间被分配给文本服务。要使用键盘快捷键，您需要选择一些文本或在启用的文本编辑器中有焦点。
![为您的 VPN 分配热键](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/keyboard_shortcuts.png)

8. 尝试从文本编辑器（如 Atom）中选择文本。设置适当的快捷键后，您应该能够自动化 VPN 登录。此脚本应该适用于 Sierra 或更早版本的 macOS，尽管我自己没有在较旧的系统上测试过。如果您在较旧的 macOS 平台上使用此方法有任何结果，请告诉我

![成功！](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/success.png)

## 从命令行运行 AppleScript

1. 打开 Apple 的 Script Editor，
![Automator](/2017/12/How-to-login-Cisco-VPN-automatically-on-macOS-High-Sierra/apple_script_editor.png)

2. 选择 `New Document`

3. 将以下代码粘贴到编辑器中。请参阅 [Automator 中的 AppleScript](?#automator-中的-applescript)

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

4. 保存脚本。您可以从终端使用 `osascript [programfile]` 运行脚本。

玩得开心！
