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
#define CONFIG_FILE "/etc/asterisk/ztscan.conf"

static int debug = 0;
static char *filename = CONFIG_FILE;
static char *cf;
static int ctl = -1;
static int lineno = 0;
static int isnew = -1;

/* Great, now for the ztscan specific functions and vars */

int scanspans();
int show_help();
static char *getalarms(int span, int secondround);
static char *readline();
static void trim(char *buf);
char *facs[] = { "esf,b8zs", "d4,ami", "cas,ami", "ccs,hdb3", "ccs,crc4,hdb3", 0};
static ZT_SPANINFO s[ZT_MAX_SPANS];

static const char *lbostr[] = {
"0 db (CSU)/0-133 feet (DSX-1)",
"133-266 feet (DSX-1)",
"266-399 feet (DSX-1)",
"399-533 feet (DSX-1)",
"533-655 feet (DSX-1)",
"-7.5db (CSU)",
"-15db (CSU)",
"-22.5db (CSU)"
};

/* Done. Lets get to work! */

/* Quick function to print out usage information, this only gets called if they pass an unknown variable */
int show_help()
{
	printf("Usage: ztscan\tDesc: Scans for spans, then writes them to ztscan.conf, for the GUI to parse and setup\n");
	return 0;
}

/* Helper function for readline */
static void trim(char *buf)
{
	/* Trim off trailing spaces, tabs, etc */
	while(strlen(buf) && (buf[strlen(buf) -1] < 33))
		buf[strlen(buf) -1] = '\0';
}

/* Basic function used to parse files. */
static char *readline(FILE *conf)
{
	static char buf[256];
	char *c;
	do {
		if (!fgets(buf, sizeof(buf), conf)) 
			return NULL;
		/* Strip comments */
		c = strchr(buf, '#');
		if (c)
			*c = '\0';
		trim(buf);
		lineno++;
	} while (!strlen(buf));
	return buf;
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
	if(s[span].totalchans <= 23 || s[span].totalchans >= 32) 
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

static const char *sigtype_to_str(const int sig)
{
	switch (sig) {
	case 0:
		return "Unused";
	case ZT_SIG_EM:
		return "E & M";
	case ZT_SIG_EM_E1:
		return "E & M E1";
	case ZT_SIG_FXSLS:
		return "FXS Loopstart";
	case ZT_SIG_FXSGS:
		return "FXS Groundstart";
	case ZT_SIG_FXSKS:
		return "FXS Kewlstart";
	case ZT_SIG_FXOLS:
		return "FXO Loopstart";
	case ZT_SIG_FXOGS:
		return "FXO Groundstart";
	case ZT_SIG_FXOKS:
		return "FXO Kewlstart";
	case ZT_SIG_CAS:
		return "CAS / User";
	case ZT_SIG_DACS:
		return "DACS";
	case ZT_SIG_DACS_RBS:
		return "DACS w/RBS";
	case ZT_SIG_CLEAR:
		return "Clear channel";
	case ZT_SIG_SLAVE:
		return "Slave channel";
	case ZT_SIG_HDLCRAW:
		return "Raw HDLC";
	case ZT_SIG_HDLCNET:
		return "Network HDLC";
	case ZT_SIG_HDLCFCS:
		return "HDLC with FCS check";
	case ZT_SIG_HARDHDLC:
		return "Hardware assisted D-channel";
	default:
		return "Unknown";
	}
}

/* function to parse the configuration file for continue = yes/no */
int parse_value(FILE *conf, char var[10]) {

	char val[96];
	char *var_pt, *sep, *val_pt = val;
	
	var_pt = strdup(var);

	while(!feof(conf)) {
		if(fgets(val_pt, sizeof(val) - 1, conf)) {
			if(!strncasecmp(val_pt, var_pt, strlen(var))) {
				sep = strsep(&val_pt, "=");
				sep = strsep(&val_pt, "=");
				if(!strncmp(sep, "yes", strlen("yes"))) {
					return 1;
				} else {
					return 0;
				}
			}
		}
	}
	return 0;
}

/* function to scan for spans and return 0 for error and anything else for true */
int scanspans() {

	int span = 0;
	int tot_spans = 0;
	int x;
	int res = -1;
	int hasgeneral = 0;
	char *ret;
	char fac[96];
	char lbos[96];
	FILE *conf_check = fopen(CONFIG_FILE, "r");
	FILE *conf = fopen(CONFIG_FILE, "w");
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

	if(!conf_check) {
		isnew = 1;
	} else {
		if(parse_value(conf_check, "continue")) {
			/* ztscan.conf did not previously exist.  */
			isnew = 1;
		}
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
				fprintf(conf, "[general]\ntotalspans=%d\ncontinue=yes\nisnew=%s\n", s[x].totalspans, (isnew == 1) ? "yes" : "no");
				hasgeneral++;
			}
#ifdef ZT_SPANINFO_HAS_LINECONFIG
			snprintf(fac, sizeof(fac), "%3s/%4s", ( s[x].lineconfig & ZT_CONFIG_D4 ? "D4" : s[x].lineconfig & ZT_CONFIG_ESF ? "ESF" : s[x].lineconfig & ZT_CONFIG_CCS ? "CCS" : "CAS" ), ( s[x].lineconfig & ZT_CONFIG_AMI ? "AMI" : s[x].lineconfig & ZT_CONFIG_B8ZS ? "B8ZS" : s[x].lineconfig & ZT_CONFIG_HDB3 ? "HDB3" : "???" ));
			snprintf(lbos, sizeof(lbos), "%s", lbostr[s[x].lbo]);
			if(!strncmp(ret, "OK", 2)) {
				printf("Span %d has Alarm: %s\n", x, ret);
				fprintf(conf, "\n[%d]\nactive=yes\nalarms=%s\ndescription=%s\nname=%s\ntotchans=%d\nusedchans=%d\nfac=%s\nlbo=%s\nsyncsrc=%d\n", x, ret, s[x].desc, s[x].name, s[x].totalchans, s[x].numchans, fac, lbos, s[x].syncsrc);
			} else {
				printf("Span %d has Alarm: %s\n", x, ret);
				fprintf(conf, "\n[%d]\nactive=no\nalarms=%s\ndescription=%s\nname=%s\ntotchans=%d\nusedchans=%d\nfac=%s\nlbo=%s\nsyncsrc=%d\n", x, ret, s[x].desc, s[x].name, s[x].totalchans, s[x].numchans, fac, lbos, s[x].syncsrc);
			}

#else
			if(!strncmp(ret, "OK", 2)) {
				printf("Span %d has Alarm: %s\n", x, ret);
				fprintf(conf, "\n[%d]\nactive=yes\nalarms=%s\ndescription=%s\nname=%s\ntotchans=%d\nusedchans=%d\nfac=NODEF\nlbo=NODEF\nsyncsrc=%d\n", x, ret, s[x].desc, s[x].name, s[x].totalchans, s[x].numchans, s[x].syncsrc);
			} else {
				printf("Span %d has Alarm: %s\n", x, ret);
				fprintf(conf, "\n[%d]\nactive=no\nalarms=%s\ndescription=%s\nname=%s\ntotchans=%d\nusedchans=%d\nfac=NODEF\nlbo=NODEF\nsyncsrc=%d\n", x, ret, s[x].desc, s[x].name, s[x].totalchans, s[x].numchans, s[x].syncsrc);
			}
#endif
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
