/*
 * Auto Detection of Digital Cards. 
 * 
 * Written by Brandon Kruse <bkruse@digium.com>
 * Copyright (c) 2007 Brandon Kruse
 *
 * Based on zttool written by Mark Spencer <markster@digium.com>
 *
 * All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under thet erms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA. 
 *
 */

#include <stdio.h> 
#include <string.h>
#include <stdarg.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <fcntl.h>
#include <errno.h>
#ifdef STANDALONE_ZAPATA
#include "zaptel.h"
#include "tonezone.h"
#else
#include <zaptel/zaptel.h>
#include <zaptel/tonezone.h>
#endif

static int debug = 0;

static int ctl = -1;

/* Great, now for the ztscan specific functions and vars */

int scanspans();
int show_help();
static char *getalarms(int span, int secondround);
char *facs[] = { "esf,b8zs", "d4,ami", "cas,ami", "ccs,hdb3", "ccs,crc4,hdb3", 0};
static ZT_SPANINFO s[ZT_MAX_SPANS];

/* Done. Lets get to work! */

/* Quick function to print out usage information, this only gets called if they pass an unknown variable */
int show_help()
{
	printf("Usage: ztscan\tDesc: Scans for spans, then writes them to ztscan.conf, for the GUI to parse and setup\n");
	return 0;
}

/* Function that accesses returns the information about a specific span, using /dev/zap/ctl ioctl */
static char *getalarms(int span, int err)
{
	int res;
	static char tmp[256];
	char alarms[50];
	if(span == 0) {
		span = 1; /* you cannot have a span of 0 */
	}
	s[span].spanno = span;
	res = ioctl(ctl, ZT_SPANSTAT, &s[span]);
	if (res) {
		if (err)
			fprintf(stderr, "Unable to get span info on span %d: %s\n", span, strerror(errno)); 
		return NULL;
	}
	/* If this is not a digital card, skip it. */
	if(s[span].totalchannels != 24 || s[span].totalchannels != 31) 
		return NULL;

	strcpy(alarms, "");
	if (s[span].alarms > 0) {
		if (s[span].alarms & ZT_ALARM_BLUE)
			strcat(alarms,"BLU/");
		if (s[span].alarms & ZT_ALARM_YELLOW)
			strcat(alarms, "YEL/");
		if (s[span].alarms & ZT_ALARM_RED)
			strcat(alarms, "RED/");
		if (s[span].alarms & ZT_ALARM_LOOPBACK)
			strcat(alarms,"LB/");
		if (s[span].alarms & ZT_ALARM_RECOVER)
			strcat(alarms,"REC/");
		if (s[span].alarms & ZT_ALARM_NOTOPEN)
			strcat(alarms, "NOP/");
		if (!strlen(alarms))
			strcat(alarms, "UUU/");
		if (strlen(alarms)) {
			/* Strip trailing / */
			alarms[strlen(alarms)-1]='\0';
		}
	} else {
		if (s[span].numchans)
			strcpy(alarms, "OK");
		else
			strcpy(alarms, "UNCONFIGURED");
	}
		
	snprintf(tmp, sizeof(tmp), "%s", alarms);
	return tmp;
}

/* function to scan for spans and return 0 for error and anything else for true */
int scanspans() {

	int span = 0;
	int x;
	int res = -1;
	int hasgeneral = 0;
	char *ret;
	FILE *conf = fopen("/etc/asterisk/ztscan.conf", "w");
	s[span].spanno = span;

	if(!ctl) {
		printf("Unable to get span info, could not open /dev/zap/ctl\n");
	}

	res = ioctl(ctl, ZT_SPANSTAT, &s[span]);
	if (!res) {
		printf("Unable to get span info on span %d: %s\n", span, strerror(errno)); 
		if(debug)
			printf("Cannot open /dev/zap/ctl for control\n");
		return 0;
	}

	if(!conf) {
		printf("cannot open config file /etc/asterisk/ztscan.conf for writing\n");
		exit(1);
	}
	
	/* Get alarms for all of our aloud spans. */
	for (x=1;x<ZT_MAX_SPANS;x++) { 
		ret = getalarms(x, 0);	
		if(ret) {
			if(hasgeneral != 1) {
				fprintf(conf, "[general]\ntotalspans=%d\ncontinue=yes\n\n", s[x].totalspans);
				hasgeneral++;
			}

			if(!strncmp(ret, "OK", 2)) {
			printf("Span %d has Alarm: %s\n", x, ret);
			fprintf(conf, "\n[%d]\nactive=yes\nalarms=%s\ndescription=%s\nname=%s\ntotchans=%d\nusedchans=%d\n", x, ret, s[x].desc, s[x].name, s[x].totalchans, s[x].numchans );
			if(debug) 
				printf("\n[%d]\nactive=yes\nalarms=%s\ndescription=%s\nname=%s\ntotchans=%d\nusedchans=%d\n", x, ret, s[x].desc, s[x].name, s[x].totalchans, s[x].numchans );
			} else {
			printf("Span %d has Alarm: %s\n", x, ret);
			fprintf(conf, "\n[%d]\nactive=no\nalarms=%s\ndescription=%s\nname=%s\ntotchans=%d\nusedchans=%d\n", x, ret, s[x].desc, s[x].name, s[x].totalchans, s[x].numchans );
			}
		span++;
		}
	}
	/* We did not find ANY spans. */
	if(hasgeneral != 1) {  
		fprintf(conf, "[general]\ncontinue=no\nerror=No Spans Found\n");
	} 
	if(conf) 
		fclose(conf);
	return 1;
}

static int reloadmodules(char *type) 
{

	system("for i in `lsmod | grep zap| sed 's/,/ /g'`; do rmmod $i >> /dev/null; done; rmmod zaptel"); /* this is a horrible hack :[ */
	if(!strcmp(type, "e1")) {
		if(debug)
			printf("Setting modules into e1\n");
		system("modprobe zaptel; modprobe zttranscode; modprobe wct4xxp t1e1override=1; modprobe wcte11xp t1e1override=1; modprobe wct1xxp t1e1override=1; ztcfg");
		/*XXX rmmod and modprobe with e1 settings */
	} 
	if(!strcmp(type, "t1")) {
		if(debug)
			printf("Setting modules into t1\n");
		system("modprobe zaptel; modprobe zttranscode; modprobe wct4xxp t1e1override=0; modprobe wcte11xp t1e1override=0; modprobe wct1xxp t1e1override=0; ztcfg");
	}
	return 1;	
}

int main(int argc, char *argv[])
{
	ctl = open("/dev/zap/ctl", O_RDWR);
	if (ctl < 0) {
		fprintf(stderr, "Unable to open /dev/zap/ctl: %s\n", strerror(errno));
		fprintf(stderr, "Trying to modprobe zaptel and retry...\n");
		system("modprobe zaptel; modprobe wct4xxp; modprobe wcte11xp; modprobe wct1xxp"); 
		/* retrying to open /dev/zap/ctl */
		ctl = open("/dev/zap/ctl", O_RDWR);
		if(ctl < 0) {
			fprintf(stderr, "Could not find /dev/zap/ctl again: %s\n", strerror(errno));
			exit(1);
		} else {
			fprintf(stderr, "Found /dev/zap/ctl after modprobing for zaptel!\n\n");
		}
			
	}
	

	if(argv[2] && !strncmp(argv[2], "--debug", 7)) {
		debug = 1;
	} 
		
	if(!argv[1]) {
		printf("Scanning for spans....\n");
		if(scanspans()) {
			printf("Scan successfull and results written to ztscan.conf\n");
			exit(0);
		} else {
			printf("Scan unsuccessfull, error listed above\n");
		}
	}
	
	if(argv[1] && !strcmp(argv[1], "--help")) {
		show_help();
		exit(1);
	}
 
	exit(0);
}
