---
title: Accelerate the Android Emulator
date: 2013-07-17
tags:
  - Android
category:
  - Development  
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
excerpt: Tired of waiting minutes for Android emulator to boot? Intel HAXM slashes startup time from minutes to just 10 seconds. Here's how to supercharge your development workflow.
comments: true
---

For a long time, the most frequent complaints about the Android emulator were its slow startup and operational speeds. Using the Intel Atom x86 system image helped slightly, but not significantly. However, last year, Intel released the Intel Hardware Accelerated Execution Manager (HAXM), which dramatically improved the situation. Previously, it took several minutes from the Android boot animation to reach the screen lock, but now it takes just 10 seconds!

## Installing HAXM
First, ensure your CPU supports VT, which most CPUs today do. Then, go to the Extras section in the Android SDK Manager and install the Intel x86 Emulator Accelerator (HAXM). Note that this step only downloads the package; you must complete the installation by locating it in the SDK Path. For example, on a Mac, it is downloaded to `SDK Path /extras/intel/Hardware_Accelerated_Execution_Manager.` You then open the `IntelHAXM.dmg` file and run the package inside to finish the installation.

After running the Emulator, if successful, you will see in the Console: `Emulator] HAX is working and emulator runs in fast virt mode.` If you want to see how fast the Android emulator runs on a MacBook Air, you can watch the following video.

{% youtube 1jwX_n8B3mI %}
