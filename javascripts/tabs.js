/*
* Skeleton V1.1
* Copyright 2011, Dave Gamache
* www.getskeleton.com
* Free to use under the MIT license.
* http://www.opensource.org/licenses/mit-license.php
* 8/17/2011
*/
$(document).ready(function(){var e=$("ul.tabs");e.each(function(e){var t=$(this).find("> li > a");t.click(function(e){var n=$(this).attr("href");n.charAt(0)=="#"&&(e.preventDefault(),t.removeClass("active"),$(this).addClass("active"),$(n).show().addClass("active").siblings().hide().removeClass("active"))})})});