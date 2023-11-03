---
title: Defragging Ruby
author: Aaron Patterson
author_social:
  - name: "@tenderlove"
    url: "https://twitter.com/tenderlove"
author_bio_markdown: "Aaron is on the Ruby core team, the Rails core team, and the team that takes care of his cat, Gorby puff.  During the day he works for a small technology company called GitHub.  Someday he will find the perfect safety gear to wear while extreme programming."
date: '2019-07-05 17:00'
layout: video
video_source: "videos.brightonruby.com/videos/2019/aaron-defragging-ruby.mp4"
image: "/images/2019/defragging-ruby-aaron-patterson.jpg"
description: "It’s been said that programmers like garbage collectors, so let’s take a look at Ruby’s GC!"
---

It’s been said that programmers like garbage collectors, so let’s take a look at Ruby’s GC! In this talk we'll walk through how Ruby allocates objects, then talk about how we can optimize object layout and memory usage via compaction. Finally we’ll take a look at how to actually build a compacting GC for Ruby as well as the interesting challenges that can be found within.
