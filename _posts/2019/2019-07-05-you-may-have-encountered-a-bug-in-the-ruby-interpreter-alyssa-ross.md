---
title: You may have encountered a bug in the Ruby interpreter
author: alyssaross
date: "2019-07-05 16:00"
layout: preview
image: '/images/2019/you-may-have-encountered-a-bug-in-the-ruby-interpreter-alyssa-ross.jpg'
description: "People say “it’s never a compiler error”. But very occasionally... it is."
---

People sometimes say “it’s never a compiler error”. They don’t mean it literally — what they mean is that it’s very tempting to blame the compiler or interpreter for a bug that is actually in our own code. But sometimes, when the stars align, there it is. The mythical interpreter bug.

I’m going to show you how I narrowed down from “the website is crashing on my computer” to a real, live bug in the Ruby interpreter. We’ll look at how we can use techniques we already know, like unit testing and git, in the unfamiliar context of Ruby’s C internals. And, when we’ve finally figured out what’s causing our bug, we’ll go through the bug reporting process and learn how to share our findings and help make Ruby better for everyone.
