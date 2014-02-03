---
layout: post
title: CSRF File Uploads in Firefox 4
---

So apparently the ability to send `multipart/form-data` file uploads via CSRF is a "thing". See <http://blog.kotowicz.net/2011/04/how-to-upload-arbitrary-file-contents.html> and <http://kuza55.blogspot.com/2008/02/csrf-ing-file-upload-fields.html>.

Last year I stumbled upon the same issue as kuza55, a rather ridiculous injection flaw in Firefox 3. An input field's name is not properly escaped for quotes and could be used to inject a filename parameter into the `Content-Disposition` of a `multipart/form-data` POST.

I just revisited this in Firefox 4 and discovered that they now attempt to escape quotes. A quote now becomes `\"` in an input field's name. However, they failed Escaping 101 and do not escape backslashes. It is possible to craft an input field's name that still escapes the name parameter and injects a filename into the `Content-Disposition`.

A name value of:

```
\"; name=param_name; filename=filename.ext;
```

will create the `Content-Disposition` of:

```
Content-Disposition: form-data; name="\\"; name=param_name; filename=filename.ext;"
```

In a quick Sinatra test app this post is still parsed as a valid file upload with a parameter name of `param_name` and a filename of `filename.ext`. I am guessing successful parsing of this request may vary depending on the web / application server.

I posted a jQuery POC for this CSRF at: <https://gist.github.com/5d5615e3ea6a26f257de>

FYI, looks like WebKit browsers URL encode quotes, sensibly preventing this type of injection. IE 8 still appears to still be susceptible to the initial quote injection.

