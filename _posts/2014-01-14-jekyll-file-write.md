---
layout: post
title: Jekyll Arbitrary File Write
product: Jekyll
vulnerability: Arbitrary file write
category: disclosure
---

Because Jekyll was sanitizing file paths prior to URL decoding the path, it was possible to set a permalink to write a generated page outside of the output directory. This is not an issue for most users of Jekyll. It *is* if you are GitHub and build users' sites for [pages.github.com](http://pages.github.com).

### More Info

* [Jekyll Release Notes](http://jekyllrb.com/news/2014/01/14/jekyll-1-4-3-released/)
