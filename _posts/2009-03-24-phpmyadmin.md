---
layout: post
title: phpMyAdmin Static Code Injection
vulnerability: Static Code Injection
product: phpMyAdmin
category: disclosure
---

>*Originally posted on [labs.neohapsis.com](http://labs.neohapsis.com/2009/04/06/about-cve-2009-1151/)*

During an evaluation of tools for internal use, we took a look at phpMyAdmin. During the assessment, we identified that the `scripts/setup.php` script is used to generate a configuration file to `config/config.inc.php`. Anytime PHP code is being generated, extremely careful filtering must be done to ensure that the intended output cannot be escaped and will not allow the injection of arbitrary code.

While the most obvious inputs, those set by the configuration fields, were escaped properly, other attacker accessible data was not. The script passes PHP serialized data back and forth through the configuration parameter. When a save action is performed, this data is then written as PHP variables to the configuration file. The data contains associative arrays with key and value pairs. On output, the values are properly escaped using add_slashes, however the keys that are also output are not filtered. By modifying the array keys in the serialized data passed to a save POST request, the key name can be escaped and arbitrary PHP code injected. If `config/` is writable by the web server user, the `config.inc.php` file is written to it and can be executed directly out of the document root.

The issue was disclosed to the phpMyAdmin team and they did an amazing job responding to this disclosure with a patch out in less than 24 hours!

Lessons learned? Anytime you are programmatically generating code (be it HTML, JavaScript, PHP, etc.) ensure that your output is properly filtered and make sure all installation scripts and unneeded administration tools are removed.

### More Info

* [PMASA-2009-3](http://www.phpmyadmin.net/home_page/security/PMASA-2009-3.php)
* [CVE-2009-1151](http://web.nvd.nist.gov/view/vuln/detail?vulnId=CVE-2009-1151)
