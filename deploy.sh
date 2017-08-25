#!/usr/bin/env bash
set -ev # halt script on error

bundle
bundle exec jekyll build
bundle exec s3_website push
