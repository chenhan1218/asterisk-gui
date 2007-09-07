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
# Added support for ztscan 8/8/07 - Brandon Kruse <bkruse@digium.com>

ifeq ($(PBX_ZAPTEL),1)
TOOLS:=zapscan.bin ztscan
endif

all: $(TOOLS)

zapscan.bin: zapscan.o
	$(CC) -o $@ $^

ztscan.bin: ztscan.o
	$(CC) -o $@ $^

zapscan.o: CFLAGS+=$(ZAPTEL_INCLUDE) $(ASTCFLAGS)

ztscan.o: CFLAGS+=$(ZAPTEL_INCLUDE) $(ASTCFLAGS)


install:
ifeq ($(PBX_ZAPTEL),1)
	mkdir -p $(ASTSBINDIR)
	$(INSTALL) -m 755 zapscan.bin $(ASTSBINDIR)
	$(INSTALL) -m 755 zapscan $(ASTSBINDIR)
	$(INSTALL) -m 755 ztscan $(ASTSBINDIR)
	
endif

clean: 
	rm -f zapscan.o
	rm -f zapscan.bin
	rm -f ztscan
	rm -f /sbin/zapscan.bin
	rm -f /sbin/zapscan
	rm -f /sbin/ztscan

.PHONY: all install clean
