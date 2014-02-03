---
layout: post
title: Directory Traversal in Archives
---

>*Originally posted on [labs.neohapsis.com](http://labs.neohapsis.com/2009/04/21/directory-traversal-in-archives/) with [Patrick Toomey](http://biasedcoin.com)*

I’m sure on the top of everyone’s list of resolutions from the New Year is the ever forgotten "I will write more secure code" and it seems that each year this task gets harder. With more complex and abstracted frameworks and APIs, the ways security related bugs are being introduced to a code base has become equally complex and abstracted. Being a few months into 2009, hopefully we can help you catch up on your resolutions by presenting something else to look for when reviewing or writing secure code.

In recent engagements, we have run into a slew of issues focusing around the well-known vulnerability of directory path traversal. As a refresher, this typically involves injecting file path meta-characters into a filename string to reference arbitrary files and usually results in the modification or disclosure of files on the system. For example, a user supplies the filename `/../../etc/passwd` which is appended to the path `/tmp/uploaded_pictures` and ends up referencing the password file instead of a file under the intended directory.

We all know, or at least should know, what a typical directory traversal vulnerability and exploit looks like, however, we have recently seen these issues manifest themselves in the handling of user-provided archive files instead of file path strings. Typically, these user provided files are sent via HTTP uploads. Almost all of the common high-level application APIs provide a means, or a third-party library, to handle archive files. Additionally, almost all of these libraries do not check for potential directory path traversal when they perform the extraction of these files. This puts the liability on the developer to check for malicious archives. While file operation calls with a user controlled variable may be obvious, filenames within user-controlled archives may be the vulnerability that slips by. Developers should not only validate user supplied file paths for directory traversal, but also check file paths included in archive files. As a note, this type of vulnerability has been mentioned before and is not groundbreaking by any means, but we want to take a detailed look into what to be aware of as a developer and how to test for this during vulnerability assessments.

To get started lets take a look at an example provided by Sun themselves (!!!) in a technical article for the `java.util.zip` package. Code Sample 1 from the article provides their base example for extracting an archive and is shown below.

```java
import java.io.*;
import java.util.zip.*; 

public class UnZip { 
  final int BUFFER = 2048;
  public static void main (String argv[]) {
    try { 
      BufferedOutputStream dest = null; 
      FileInputStream fis = new FileInputStream(argv[0]);
      ZipInputStream zis = 
        new ZipInputStream(new BufferedInputStream(fis));
      
      ZipEntry entry; 
      while((entry = zis.getNextEntry()) != null) { 
        System.out.println("Extracting: " +entry);
        int count;
        // write the files to the disk
        byte data[] = new byte[BUFFER];
        FileOutputStream fos = 
          new FileOutputStream(entry.getName());
        dest = new BufferedOutputStream(fos, BUFFER);
        while ((count = zis.read(data, 0, BUFFER)) != -1) {
          dest.write(data, 0, count);
        }
        dest.flush();
        dest.close(); 
      }
      zis.close(); 
    } catch(Exception e) { 
      e.printStackTrace();
    }
  }
}
```

We can see where the vulnerability manifests itself in processing each entry of the provided ZIP file:
`FileOutputStream fos = new FileOutputStream(entry.getName());` entry is the current ZIP entry being processed and `getName()` returns the filename stored in that entry. After retrieving this filename, the uncompressed data is written to its value. We can see that by using directory traversal in the filename a malicious user may be able to make arbitrary writes anywhere on the filesystem. Unfortunately, on most platforms, if an attacker can arbitrarily write files they can most likely also get arbitrary code executed on the affected server.

Similar issues exist with a number of ZIP library implementations across various languages. As one might expect, the equivalent Python code is far less verbose. While Python doesn’t provide any sample code, a simple, and vulnerable, ZIP extraction would look as follows:

```python
from zipfile import ZipFile
import sys

zf = ZipFile(sys.argv[1])
zf.extractall()
```

The `extractall` method does what one would expect it to do, except that it does not check for directory traversal in the ZIP entries’ file paths. Python also provides equivalent objects for handling tar archives. Interestingly, the tar archive library documentation does make mention of the risk associated with path traversal within archive files. The documentation for the extractall method states:

>Warning: Never extract archives from untrusted sources without prior inspection. It is possible that files are created outside of path, e.g. members that have absolute filenames starting with “/” or filenames with two dots “..”.

How about PHP, surely they provide a function to work with ZIP files (what don’t they have a function for). The PHP manual provides the following example code for extracting ZIP files.

```php
<?php 
  $zip = new ZipArchive;
  $res = $zip->open('test.zip');
  if ($res === TRUE) { 
    echo 'ok'; 
    $zip->extractTo('test');
    $zip->close();
  } else { 
    echo 'failed, code:' . $res; 
  }
?>
```

Sure enough, this code is also vulnerable to file path manipulation within the archive.

What about everyone’s favorite language du jour, Ruby? Ruby itself does not have ZIP file extraction built in to the language’s core library. However, rubyzip is a popular third-party library and like the prior libraries, is also vulnerable to directory traversal. The example below was stated in a post by the library’s author as how to extract a ZIP file and all of its directories:

```ruby
require 'rubygems'
require 'zip/zipfilesystem'
require 'fileutils'

OUTDIR = "out"

Zip::ZipFile::open("all.zip") { |zf| 
  zf.each { |e| 
    fpath = File.join(OUTDIR, e.name)
    zf.extract(e, fpath)
    FileUtils.mkdir_p(File.dirname(fpath))
  }
}
```

Finally, similar to Ruby, the .Net environment does not have ZIP archive handling built in to the core library. A quick googling for “.Net zip files” leads to an article on MSDN. In this article, the authors detail this gap in the .Net library and then go on to present a solution. The tools released include a signed DLL for use during development and a set of command-line utility programs that utilize the library. One of these command-line utilities is Unzip.exe. Sure enough, Unzip.exe is vulnerable to path traversal within an archive. No warning is presented and the archive is extracted without concern to the fully resolved path of the files within the archive.

How do mainstream, standalone, compression utility programs handle this vulnerability? We tested a large number of archive extraction programs (Winzip, Winrar, command line Info-Zip, unzip on Unix, etc) and noted that all of them either provide a warning when a ZIP file entry contains directory traversal, escape the meta-characters, or just ignore the traversed directory path all together.

When writing code that interacts with archives, the same precautions used by mainstream extraction utilities must be performed by the developer. As with any user-controlled input, the directory filenames should be validated before being processed by any file operation. The developer should verify that path traversal characters do not occur in any entries within the archive. Similarly, the developer may also leverage utility functions within their language to first determine the fully resolved path before extracting an entry (ex. os.path.normpath(path) in Python).

A more drastic mitigation, though perhaps the better long-term solution, would involve modifying these default libraries to work similarly to their standalone application counterparts by default. It is extremely rare to require path traversal characters in a legitimate archive. Perhaps, the libraries should be modified to secure the common case, requiring a developer to explicitly request the atypical case. For example, what if the Python `ZipFile` object changed its default behavior to throw an exception in the presence of file traversal characters? The extractall method signature could be modified as follows:

```python
ZipFile.extractall([path[,members[,pwd[,allow_traverse]]]])
```

By default the `allow_traverse` is set to `False`, throwing `zipfile.BadZipfile` if path traversal characters are encountered. This would provide a secure by default configuration for the library while still allowing the existing behavior if necessary. This requires the developer to explicitly request support for path traversal, thus mitigating accidental and insecure usage. This is unlikely to impact existing code, as archives with path traversal characters are not easy to create and it is extremely unlikely a legitimate archive would accidentally include such characters.

During the course of this write-up we grew tired of hand-editing zip archives in a hex-editor to add directory traversal characters. So, we put together a Python script that can be used to generate ZIP archives with path traversal sequences automatically inserted. It can create directories in both Unix and Windows environments for ZIP files (including jar) and tar files with and without compression (gzip or bzip2). You can specify an arbitrary number of directories to traverse and an additional path to append (think `var/www` or `Windows\System32`).

The full usage follows:

```
Usage: evilarc <input file>

Create archive containing a file with directory traversal

Options:
  --version             show program's version number and exit
  -h, --help            show this help message and exit
  -f OUT, --output-file=OUT
                        File to output archive to.  Archive type is based off
                        of file extension.  Supported extensions are zip, jar,
                        tar, tar.bz2, tar.gz, and tgz.  Defaults to evil.zip.
  -d DEPTH, --depth=DEPTH
                        Number directories to traverse. Defaults to 8.
  -o PLATFORM, --os=PLATFORM
                        OS platform for archive (win|unix). Defaults to win.
  -p PATH, --path=PATH  Path to include in filename after traversal.  Ex:
                        WINDOWS\System32\

$ ./evilarc.py test.txt -p Windows\\System32\\ 
Creating evil.zip containing ..\..\..\..\..\..\..\..\Windows\System32\test.txt  
$ java javaunzip evil.zip
Extracting: ..\..\..\..\..\..\..\..\Windows\System32\test.txt
$ ls -al /cygdrive/c/Windows/System32/test.txt
-rwxr-x---+ 1 gose mkgroup-l-d 21 Feb 24 11:52 /cygdrive/c/Windows/System32/test.txt
```

This script available for download on [GitHub](https://github.com/Neohapsis/evilarc).
