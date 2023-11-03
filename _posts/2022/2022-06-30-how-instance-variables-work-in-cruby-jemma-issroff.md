---
title: "Cache me if you can: How instance variables work in CRuby"
author: Jemma Issroff
author_social:
  - name: "@jemmaissroff"
    url: "https://twitter.com/jemmaissroff"
author_bio_markdown: "Jemma Issroff works on Shopify's Ruby Infrastructure team. She is also a co-founder of WNB.rb, a women / non-binary Ruby community, a co-host on The Ruby on Rails Podcast, the author of both Ruby Weekly's Tip of the Week, and an ebook about Ruby garbage collection."
date: '2022-06-30 12:15'
layout: video
video_source: "videos.brightonruby.com/videos/2022/jemma-issroff-setting-and-getting-instance-variables.mp4"
description: "Instance. Shapes. Performance."
---

We all use instance variables practically every time we write Ruby code. Most of us do this without a second thought for how performant instance variables accesses are or what Ruby is doing behind the scenes.

In this talk, we’ll learn what actually happens each time we access an instance variable. We’ll start with the most naive possible implementation of instance variables, iterate on it until we learn what CRuby is doing today, including how instance variable caching works, and ultimately discuss a new idea for instance variable caching that CRuby could adopt: object shapes.