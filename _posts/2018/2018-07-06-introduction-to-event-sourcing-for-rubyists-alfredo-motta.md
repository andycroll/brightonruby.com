---
title: Introduction to Event Sourcing for Rubyists
author: alfredomotta
date: '2018-07-06 14:45'
layout: video
video_source: "videos.brightonruby.com/videos/2018/alfredo-introduction-to-event-sourcing-for-rubyists.mp4"
image: '/images/2018/introduction-to-event-sourcing-for-rubyists-alfredo-motta.jpg'
description: 'Event sourcing is a git-like approach to data storage, a log of change rather than a database.'
---

[Event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) is a design pattern to help build applications that are focused on the domain and easy to extend.

The key idea is to use a persistent event log to store every change to your data as an alternative the more classical relational database model for Rails applications. In one sentence, it is a git-like approach to manage your data.

Once you accept the premise of having an event log you can use it to extend your application in all sort of creative ways. You can use it to synchronize the data between your microservices, or you can trigger side effects without cluttering your controllers, or you can build data views optimized for your query needs.
