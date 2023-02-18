---
title: "Cache me if you can: How instance variables work in CRuby"
author: jemmaissroff
date: '2022-06-30 12:15'
layout: video
video_source: "videos.brightonruby.com/videos/2022/jemma-issroff-setting-and-getting-instance-variables.mp4"
description: "Instance. Shapes. Performance."
---

We all use instance variables practically every time we write Ruby code. Most of us do this without a second thought for how performant instance variables accesses are or what Ruby is doing behind the scenes.

In this talk, we’ll learn what actually happens each time we access an instance variable. We’ll start with the most naive possible implementation of instance variables, iterate on it until we learn what CRuby is doing today, including how instance variable caching works, and ultimately discuss a new idea for instance variable caching that CRuby could adopt: object shapes.