---
layout: post
title: Disabling WPS on Wireless APs via Firmware Modification
---

Due to the recent horribleness discovered in WPS, I have been very uncomfortable with the security of my home wireless network. Just last year I purchased new wireless APs from Linksys (E4200 and WRT320N) and unfortunately both of these models continue to respond to PIN External Registrar requests, even if WPS is not configured on the router. As of now no firmware updates have been published by Linksys to disable this so I investigated the possibility to perform the modification myself. Luckily, all of the tools required have already been developed and it appears that the WPS functionality can be easily disabled via filesystem changes.

I took the following steps to disable WPS in the Linksys firmware. Obviously, it's possible I may have jacked up my AP in the process, I heed the warning that you may do the same, and I take no responsibility if you do.

### Download and install the Firmware Modification Kit

This is a set of tools and scripts developed to extract and rebuild firmware filesystems. I had used binwalk and unsquashfs in the past, but this contains a number of modifications to make it easy to perform the rootfs extraction. These instructions are all you will need to get started.

### Download your router's firmware image

Linksys hosts their images at http://homesupport.cisco.com/en-us/support/linksys. For the E4200 I had to use an older version than currently hosted (1.0.01) from http://www.dd-wrt.com/phpBB2/viewtopic.php?p=620773 as the squashfs extraction did not work properly with the latest image.

### Slice and dice the image and extract the rootfs

```
~/firmware-mod-kit-read-only/trunk# ./extract-ng.sh ./FW_E4200_1.0.01.010_US_20110221_code.bin
Firmware Mod Kit (build-ng) 0.73 beta, (c)2011 Craig Heffner, Jeremy Collake
http://www.bitsum.com

Scanning firmware...

DECIMAL     HEX         DESCRIPTION
-------------------------------------------------------------------------------------------------------
32          0x20        TRX firmware header, little endian, header size: 28 bytes,  image size: 9560064 bytes, CRC32: 0x8F8B2A81 flags/version: 0x10000
758932      0xB9494     Squashfs filesystem, little endian, version 3.0, size: 8796875 bytes, 1474 inodes, blocksize: 65536 bytes, created: Mon Feb 21 05:16:54 2011

Extracting 758932 bytes of  header image at offset 0
Extracting squashfs file system at offset 758932
Extracting squashfs files...
Firmware extraction successful!
Firmware parts can be found in 'fmk/*'
```

### Remove WPS related binaries

Identifying these binaries was not an exhaustive task, basically `find / -name "*wps*"` and a quick strings to see if WPS-like things such as `WFA-SimpleConfig-Registrar-1-0` showed up (I'm a mad reverse engineer...). I kept a bogus symlink (busybox will just error) as it seemed like a better idea than `ENOENT`.

tl;dr this is a huge hack and will likely break things

```
~/firmware-mod-kit-read-only/trunk# cd fmk/rootfs/bin/
~/firmware-mod-kit-read-only/trunk/fmk/rootfs/bin# mv wps_monitor wps_monitor.old
~/firmware-mod-kit-read-only/trunk/fmk/rootfs/bin# ln -s busybox wps_monitor
```

For the WRT320N I also removed the files `/bin/wps_ap` and `/bin/wps_enr`. They seemed equally WPS related.

### Rebuild the firmware image

```
~/firmware-mod-kit-read-only/trunk# ./build-ng.sh 
Firmware Mod Kit (build-ng) 0.73 beta, (c)2011 Craig Heffner, Jeremy Collake
http://www.bitsum.com
  
Building new squashfs file system...
Creating little endian 3.0 filesystem on fmk/new-filesystem.squashfs, block size 65536.
  
Little endian filesystem, data block size 65536, compressed data, compressed metadata, compressed fragments
Filesystem size 8590.70 Kbytes (8.39 Mbytes)
  23.00% of uncompressed filesystem size (37343.77 Kbytes)
Inode table size 11992 bytes (11.71 Kbytes)
  25.08% of uncompressed inode table size (47823 bytes)
Directory table size 11251 bytes (10.99 Kbytes)
  42.89% of uncompressed directory table size (26233 bytes)
Number of duplicate files found 162
Number of inodes 1475
Number of files 1244
Number of fragments 183
Number of symbolic links  129
Number of device nodes 0
Number of fifo nodes 0
Number of socket nodes 0
Number of directories 102
Number of uids 1
  root (0)
Number of gids 0
Remaining free bytes in firmware image: 3948
Processing 1 header(s) from fmk/new-firmware.bin...
Processing header at offset 32...checksum(s) updated OK.
CRC(s) updated successfully.
Finished! New firmware image has been saved to: fmk/new-firmware.bin
```
  
### Flash the new firmware image
It's at `./fmk/new-firmware.bin`. This is just the same as you would the factory firmware. I made sure to make a backup of my configuration file first, but to each their own.

### Results
Prior to modifying the firmware, the following happened.

```
~# iw wlan0 scan
BSS 58:6d:8f:aa:bb:cc (on wlan0)
  freq: 2422
  beacon interval: 100
  capability: ESS Privacy ShortSlotTime (0x0411)
  signal: -61.00 dBm
  last seen: 3036 ms ago
  SSID: meganetprime
  Supported rates: 1.0* 2.0* 5.5* 11.0* 18.0 24.0 36.0 54.0 
  ... blah blah ...
  WPS:   * Version: 1.0
     * Manufacturer: Linksys
     * Model: Linksys E4200
     * Device name: Linksys E4200
     * Config methods: Label, PBC
  WMM:   * Parameter version 1
     * u-APSD
     * BE: CW 15-1023, AIFSN 3
     * BK: CW 15-1023, AIFSN 7
     * VI: CW 7-15, AIFSN 2, TXOP 3008 usec
     * VO: CW 3-7, AIFSN 2, TXOP 1504 usec
```

Now, this happens

```
BSS 58:6d:8f:aa:bb:cc (on wlan0)
  TSF: 112947587 usec (0d, 00:01:52)
  freq: 2422
  beacon interval: 100
  capability: ESS Privacy ShortSlotTime (0x0411)
  signal: -67.00 dBm
  last seen: 1640 ms ago
  SSID: meganetprime
  Supported rates: 1.0* 2.0* 5.5* 11.0* 18.0 24.0 36.0 54.0 
   ... blah blah ...
  WMM:   * Parameter version 1
     * u-APSD
     * BE: CW 15-1023, AIFSN 3
     * BK: CW 15-1023, AIFSN 7
     * VI: CW 7-15, AIFSN 2, TXOP 3008 usec
     * VO: CW 3-7, AIFSN 2, TXOP 1504 usec
```

and before with reaver-wps:

```
~# reaver --pin=11223344 -vv -i mon4 -b 58:6d:8f:aa:bb:cc

Reaver v1.3 WiFi Protected Setup Attack Tool
Copyright (c) 2011, Tactical Network Solutions, Craig Heffner 

[+] Waiting for beacon from 58:6D:8F:AA:BB:CC
[+] Switching mon4 to channel 3
[+] Associated with 58:6D:8F:AA:BB:CC (ESSID: meganetprime)
[+] Trying pin 11223344
[!] WARNING: Last message not processed properly, reverting state to previous message
[+] Trying pin 11223344
[+] Trying pin 11223344
[!] WARNING: Last message not processed properly, reverting state to previous message
[+] Trying pin 11223344
[+] Key cracked in 12 seconds
[+] WPS PIN: '11223344'
[+] WPA PSK: 'myridiculouslylongkeythatsimpossibletotypeonakindle'
[+] AP SSID: 'meganetprime'
```

After new firmware:

```
Reaver v1.3 WiFi Protected Setup Attack Tool
Copyright (c) 2011, Tactical Network Solutions, Craig Heffner 

[?] Restore previous session? [n/Y] n
[+] Waiting for beacon from 58:6D:8F:AA:BB:CC
[+] Switching mon5 to channel 3
[+] Associated with 58:6D:8F:AA:BB:CC (ESSID: meganetprime)
... time passes ...
^C
[+] Nothing done, nothing to save.
[+] Session saved.
```

Looks like success to me!

Likely a similar process will work for other vendors and APs and hopefully this will hold down the fort until official firmware updates start being released.
