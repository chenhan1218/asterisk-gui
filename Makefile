#
# Asterisk -- A telephony toolkit for Linux.
#
# Top level Makefile
#
# Copyright (C) 1999-2006, Digium, Inc.
#
# Mark Spencer <markster@digium.com>
#
# This program is free software, distributed under the terms of
# the GNU General Public License
#

# Basics...
INSTALL?=install
BASENAME?=basename

# Overwite config files on "make samples"
OVERWRITE=y

# Staging directory
# Files are copied here temporarily during the install process
# For example, make DESTDIR=/tmp/asterisk-gui would put things in
# /tmp/asterisk/etc/asterisk
# !!! Watch out, put no spaces or comments after the value !!!
#DESTDIR?=/tmp/asterisk-gui
#
# Asterisk var/lib directory...
#
ASTVARLIB?=$(shell cat $(DESTDIR)/etc/asterisk/asterisk.conf  2>/dev/null | grep -v ^\; | grep astvarlibdir | cut -f 3 -d ' ')
ifeq ($(ASTVARLIB),)
  ASTVARLIB=/var/lib/asterisk
endif
ASTETCDIR?=$(shell cat $(DESTDIR)/etc/asterisk/asterisk.conf  2>/dev/null | grep -v ^\; | grep astetcdir | cut -f 3 -d ' ')
ifeq ($(ASTETCDIR),)
  ASTETCDIR=/etc/asterisk
endif
HTTPDIR=$(DESTDIR)$(ASTVARLIB)/static-http
CONFIGDIR=$(HTTPDIR)/config
ASTETCDIR?=$(shell cat $(DESTDIR)/etc/asterisk/asterisk.conf  2>/dev/null | grep -v ^\; | grep astetcdir | cut -f 3 -d ' ')
ifeq ($(ASTETCDIR),)
  ASTETCDIR=/etc/asterisk
endif
HTTPHOST?=$(shell hostname)
HTTPBINDPORT?=$(shell cat $(DESTDIR)/etc/asterisk/http.conf  2>/dev/null | grep -v ^\; | grep bindport | cut -f 2 -d '=')
ifeq ($(HTTPBINDPORT),)
  HTTPBINDPORT=8088
endif
HTTPPREFIXBASE?=$(shell cat $(DESTDIR)/etc/asterisk/http.conf  2>/dev/null | grep -v ^\; | grep prefix )
HTTPPREFIX?=$(shell echo $(HTTPPREFIXBASE) | cut -f 2 -d '=')
ifeq ($(HTTPPREFIXBASE),)
  HTTPPREFIX=asterisk
endif
HTTPURL=http://$(HTTPHOST):$(HTTPBINDPORT)/$(HTTPPREFIX)/static/config/cfgbasic.html

# Nothing to do yet for building, but one day there could be...

checkconfig:
	@echo " --- Checking Asterisk configuration to see if it will support the GUI ---"
	@echo -n "* Checking for http.conf: "
	@if [ -f $(ASTETCDIR)/http.conf ]; then \
		echo "OK" ; \
	else \
		echo "FAILED"; \
		echo " -- Please run 'make samples' in *Asterisk* or " ; \
		echo " -- create your own $(ASTETCDIR)/http.conf" ; \
		exit 1; \
	fi
	@echo -n "* Checking for manager.conf: "
	@if [ -f $(ASTETCDIR)/manager.conf ]; then \
		echo "OK" ; \
	else \
		echo "FAILED"; \
		echo " -- Please run 'make samples' in *Asterisk* or " ; \
		echo " -- create your own $(ASTETCDIR)/manager.conf" ; \
		exit 1; \
	fi
	@echo -n "* Checking if HTTP is enabled: "
	@if grep -v ^\; $(ASTETCDIR)/http.conf | grep enabled | grep -q yes 2>/dev/null; then \
		echo "OK" ; \
	else \
		echo "FAILED"; \
		echo " -- Please be sure you have 'enabled = yes'" ; \
		echo " -- in $(ASTETCDIR)/http.conf" ; \
		exit 1; \
	fi
	@echo -n "* Checking if HTTP static support is enabled: "
	@if grep -v ^\; $(ASTETCDIR)/http.conf | grep enablestatic | grep -q yes 2>/dev/null; then \
		echo "OK" ; \
	else \
		echo "FAILED"; \
		echo " -- Please be sure you have 'enablestatic = yes'" ; \
		echo " -- in $(ASTETCDIR)/http.conf" ; \
		exit 1; \
	fi
		
	@echo -n "* Checking if manager is enabled: "
	@if grep -v ^\; $(ASTETCDIR)/manager.conf | grep ^enabled | grep -q yes 2>/dev/null; then \
		echo "OK" ; \
	else \
		echo "FAILED"; \
		echo " -- Please be sure you have 'enabled = yes'" ; \
		echo " -- in $(ASTETCDIR)/manager.conf" ; \
		exit 1; \
	fi
	@echo -n "* Checking if manager over HTTP is enabled: "
	@if grep -v ^\; $(ASTETCDIR)/manager.conf | grep webenabled | grep -q yes 2>/dev/null; then \
		echo "OK" ; \
	else \
		echo "FAILED"; \
		echo " -- Please be sure you have 'webenabled = yes'" ; \
		echo " -- in $(ASTETCDIR)/manager.conf" ; \
		exit 1; \
	fi

	@echo " --- Everything looks good ---	"
	@echo " * GUI should be available at $(HTTPURL) "
	@echo " * The login and password should be an entry from $(ASTETCDIR)/manager.conf"
	@echo "   which has 'config' permission in read and write.  For example:"
	@echo ""
	@echo "    [admin]"
	@echo "    secret = mysecret$$$$"
	@echo "    read = system,call,log,verbose,command,agent,config"
	@echo "    write = system,call,log,verbose,command,agent,config"
	@echo ""
	@echo " --- Good luck! ---	"
all:
	@echo " +------- Asterisk-GUI Build Complete -------+"
	@echo " + Asterisk-GUI has successfully been built, +"
	@echo " + and can be installed by running:          +"
	@echo " +                                           +"
	@echo " +               make install                +"
	@echo " +-------------------------------------------+"

_install:
	@echo "Installing into $(HTTPDIR)"
	mkdir -p $(CONFIGDIR)
	mkdir -p $(CONFIGDIR)/images
	mkdir -p $(CONFIGDIR)/scripts
	mkdir -p $(CONFIGDIR)/stylesheets
	for x in config/images/*; do \
		$(INSTALL) -m 644 $$x $(CONFIGDIR)/images/ ; \
	done
	for x in config/scripts/*; do \
		$(INSTALL) -m 644 $$x $(CONFIGDIR)/scripts/ ; \
	done
	for x in config/stylesheets/*; do \
		$(INSTALL) -m 644 $$x $(CONFIGDIR)/stylesheets/ ; \
	done
	for x in config/*.html; do \
		$(INSTALL) -m 644 $$x $(CONFIGDIR)/ ; \
	done
	@if [ -x /usr/sbin/asterisk-gui-post-install ]; then \
		/usr/sbin/asterisk-gui-post-install $(DESTDIR) . ; \
	fi

install:_install
	
	@echo " +---- Asterisk GUI Installation Complete ---+"
	@echo " +                                           +"
	@echo " +    YOU MUST READ THE SECURITY DOCUMENT    +"
	@echo " +                                           +"
	@echo " + Asterisk-GUI has successfully been        +"
	@echo " + installed.  If you would like to install  +"
	@echo " + the addtional sample configuration files  +"
	@echo " + (overwriting any existing config files),  +"
	@echo " + run:                                      +"
	@echo " +                                           +"
	@echo " +               $(MAKE) samples                +"
	@echo " +                                           +"
	@echo " +-------------------------------------------+"
	@echo " +                                           +"
	@echo " +          BEFORE THE GUI WILL WORK         +"
	@echo " +                                           +"
	@echo " + Before the GUI will run, you must perform +"
	@echo " + some modifications to the Asterisk        +"
	@echo " + configuration fiels in accordance with    +"
	@echo " + the README file.  When done, you can      +"
	@echo " + check your changes by doing:              +"
	@echo " +                                           +"
	@echo " +               $(MAKE) checkconfig            +"
	@echo " +                                           +"
	@echo " +-------------------------------------------+"

samples:
	mkdir -p $(DESTDIR)$(ASTETCDIR)
	for x in configs/*.sample; do \
		if [ -f $(DESTDIR)$(ASTETCDIR)/`$(BASENAME) $$x .sample` ]; then \
			if [ "$(OVERWRITE)" = "y" ]; then \
				if cmp -s $(DESTDIR)$(ASTETCDIR)/`$(BASENAME) $$x .sample` $$x ; then \
					echo "Config file $$x is unchanged"; \
					continue; \
				fi ; \
				mv -f $(DESTDIR)$(ASTETCDIR)/`$(BASENAME) $$x .sample` $(DESTDIR)$(ASTETCDIR)/`$(BASENAME) $$x .sample`.old ; \
			else \
				echo "Skipping config file $$x"; \
				continue; \
			fi ;\
		fi ; \
		$(INSTALL) -m 644 $$x $(DESTDIR)$(ASTETCDIR)/`$(BASENAME) $$x .sample` ;\
	done
