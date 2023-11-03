---
title: Configuration-first Open Source
author: Alex Balhatchet
author_social:
  - name: "@kaokun"
    url: "https://twitter.com/kaokun"
author_bio_markdown: "Senior software engineer at CharlieHR, building the HR software for teams with big ideas. Previously CTO at Nestoria so ask me about writing Perl for a decade before switching to Ruby :-)"
date: '2018-07-06 14:40'
layout: video
video_source: "videos.brightonruby.com/videos/2018/alex-configuration-first-open-source.mp4"
image: '/images/2018/configuration-first-open-source-alex-balhatchet.jpg'
description: 'You might not realise it, but your Ruby project probably relies on a popular configuration-first OSS project. The tzdata library is updated regularly as time zones and daylight savings rules change more often than you might think!'
---

You might not realise it, but your Ruby project probably relies on a popular configuration-first OSS project. The `tzdata` library is updated regularly as time zones and daylight savings rules change more often than you might think!

By building a project configuration first, rather than focussing on one programming language, you can get a much wider range of people contributing to your open source package. We built a Ruby gem for public holidays that covered 71 countries. By converting it to a configuration first project we were able to release packages for Ruby, Node.js and Perl so that more people could use the data and we’d be more likely to get patches and bug fixes.
