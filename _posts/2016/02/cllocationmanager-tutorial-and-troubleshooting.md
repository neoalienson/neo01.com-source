---
title: CLLocationManager Tutorial and Troubleshooting
tags:
  - iOS
  - Swift
id: 7010
categories:
  - Development
date: 2016-02-28
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
excerpt: "Location services not working after iOS 8? Complete guide to fixing common CLLocationManager issues with NSLocationUsageDescription."
comments: true
---

Many developers complain that mobile application development is more difficult than web application development. They try to follow tutorials online precisely, but the mobile application still doesn't work. This is because mobile platforms evolve rapidly, and tutorials just can't keep up to date.

My friend had the above situation and failed to get any location update from the location manager. He added the CoreLocation.framework library to Link Binary,

![CLLocationSample1](CLLocationSample1.png)

![CLLocationSample2](CLLocationSample2.png)

Then, he put the code below, and it seems right.

{% gist 18ab0cc09e57cc2a4e6b AppDelegate.swift %}

However, nothing comes out to the console. This is because, starting from iOS 8, you need to add NSLocationAlwaysUsageDescription or NSLocationWhenInUseUsageDescription, depending on requestAlwaysAuthorization (for background location) or requestWhenInUseAuthorization (location only when foreground).

![CLLocationSample3](CLLocationSample3.png)

![CLLocationSample4](CLLocationSample4.png)

Let's start to build and run the app. You should see the alert below if you start it for the first time.

![CLLocationManager5](CLLocationManager5.png)

You should get an update after tapping Allow. You may need to adjust the location if you are running the Simulator by choosing a location from Debug -> Location.

I have uploaded the project to [https://github.com/neoalienson/CLLocationManagerSample](https://github.com/neoalienson/CLLocationManagerSample)

Good luck, and I hope this tutorial does not become outdated very soon!

&nbsp;
