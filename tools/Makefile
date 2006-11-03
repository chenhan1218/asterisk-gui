#
# Asterisk -- A telephony toolkit for Linux.
#
# Tools makefile
#
# Copyright (C) 1999-2006, Digium, Inc.
#
# Mark Spencer <markster@digium.com>
#
# This program is free software, distributed under the terms of
# the GNU General Public License
#
all: zapscan.bin


zapscan.bin: zapscan.o
	$(CC) -o zapscan.bin zapscan.o

install:
	$(INSTALL) -m 755 zapscan $(DESTDIR)/sbin
	$(INSTALL) -m 755 zapscan.bin $(DESTDIR)/sbin

clean: 
	rm -f zapscan.o
	rm -f zapscan.bin
