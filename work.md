---
layout: page
title: Work
---

## Some of the things I've done. 

Read more about my talks, publications, projects, and public vulnerability disclosures.

<h2>Talks</h2>
<ul class="related-posts">
  {% for post in site.categories.talk %}
    <li>
      <h3>
        <a href="{{ post.url }}">
          {{ post.venue }}
          <small>{{ post.title }}</small>
        </a>
      </h3>
    </li>
  {% endfor %}
</ul>

<h2>Public Vulnerability Disclosures</h2>
<ul class="related-posts">
  {% for post in site.categories.disclosure %}
    <li>
      <h3>
        <a href="{{ post.url }}">
          {{ post.product }}
          <small>{{ post.vulnerability }}</small>
        </a>
      </h3>
    </li>
  {% endfor %}
</ul>

<h2>Publications</h2>
<ul class="related-posts">
  {% for post in site.categories.publication %}
    <li>
      <h3>
        <a href="{{ post.url }}">
          {{ post.venue }}
          <small>{{ post.title }}</small>
        </a>
      </h3>
    </li>
  {% endfor %}
</ul>
