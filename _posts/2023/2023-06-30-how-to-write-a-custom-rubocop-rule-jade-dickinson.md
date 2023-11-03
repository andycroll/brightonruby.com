---
title: "How to Write a Custom Rubocop Rule"
date: "2023-06-30 14:20"
author: Jade Dickinson
author_bio_markdown: "Based in London, Jade Dickinson is a Senior Software Engineer at Theta Lake. She studied biology, then worked in science journal publishing while studying computer science. In her spare time, she likes walking her Shiba Inu and attempting ever more elaborate recipes."
author_social:
  - name: "@_jadedickinson"
    url: "https://twitter.com/_jadedickinson"
  - url: "https://ruby.social/@jadedickinson"
layout: video
video_source: "videos.brightonruby.com/videos/2023/jade-dickinson-how-to-write-a-custom-rubocop-rule.mp4"
description: "Feel confident writing a basic Rubocop rule e.g. for correcting spelling, and know where to look to find out how to write more advanced rules"
---

You want to enforce a standard in your codebase, like making sure a company name is in title case. So you add "always check for correct capitalisation" to your pull request guidelines. Over time, people forget to check and mistakes sneak in.

But wait - there’s an easier way! I’ll show you how you can write a custom Rubocop rule to check for you. So if someone breaks the rule, your CI tooling will flag it up so they can fix it, freeing you up to focus on more important things.