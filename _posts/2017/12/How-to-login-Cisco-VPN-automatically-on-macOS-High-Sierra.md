---
title: How to login Cisco VPN automatically on macOS High Sierra
date: 2017-12-06
tags:
  - MacOS
category:
  - Cybersecurity
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
excerpt: "Tired of typing your VPN password every time? Automate Cisco IPSec VPN login on macOS with AppleScript and Automator. One-click connection made easy!"
comments: true
---

There is no way to save a password when logging into a Cisco IPSec VPN on a Macintosh operating system (macOS).

![No save password for security reason?](vpn_login.png)

The best solution for me is writing an AppleScript in Automator, or running it from the command line, to automate the login process.

## AppleScript in Automator

1. Open Apple's Automator,
![Automator](automator.png)

2. Choose `New Document`
![New Document](new_document.png)

3. Select `Service`
The service created has `receives selected` `text` by default. It means you need to select text or having focus in a text editor to enable the service.
![Service](service.png)

4. Try to search for action `Run AppleScript`. Then, drag the action into the right-hand-side.
![Search for action "Run AppleScript", and then drag it to the right-hand-side](run_apple_script.png)

5. Paste below code into the editor,

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

![Editor with the script](script_editor.png)

6. Update `vpn_name`, `username` and `passwd` in the script.

You can refer to the screenshot below for the `vpn_name`, which is `VPN (Cisco IPSec)`. The script uses `scutil --nc status` to check the VPN connection status, and `scutil --nc start` to initiate the VPN connection. Typically, the VPN login dialog appears within 3 seconds. If your laptop is slow, please update the value in `delay 3`. To automate the process, try running the script using the play button and observe how it works.

![Your VPN name](vpn_name.png)

7. Save the script with a name such as `VPN Login`.
In the `System Preferences -> Keyboard -> Shortcuts`, you can find the automation script. Assign a shortcut key. By default, the script is assigned to the Text service during its creation. To use the keyboard shortcut, you will need to select some text or have focus in a text editor enabled.
![Assign hotkey for your VPN](keyboard_shortcuts.png)

8. Try selecting text from a text editor, such as Atom. With the proper shortcut key set up, you should be able to automate the VPN login. This script should work with Sierra or earlier versions of macOS, although I haven't tested it on older systems myself. Please let me know if you have any results using this method on older macOS platforms

![Success!](success.png)

## AppleScript from command line

1. Open Apple's Script Editor,
![Automator](apple_script_editor.png)

2. Choose `New Document`

3. Paste below code into the editor. Please refers to [AppleScript in Automator](?#applescript-in-automator)

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

4. Save the script. You can run the script with `osascript [programfile]` from Terminal.

Have fun!
