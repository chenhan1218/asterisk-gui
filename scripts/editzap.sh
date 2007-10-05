#!/bin/bash

####################################################################
####	Copyright Brandon Kruse <bkruse@digium.com> && Digium	####
####################################################################

# Quick script for applying zaptel settings from the GUI.

ZAPCONF="/etc/zaptel.conf"
ZTCFG_OUTPUT="/var/lib/asterisk/static-http/config/ztcfg_output.html"

# Note: Changing modules requires sed
if [ $(which sed) == "" ] ; then
	error_out("Sed not installed, needed to reload modules, you can do it manually by forcing the modules in via t1e1override")
fi

case ${1} in
	changemodes)
		type=${2}
		$(for i in `lsmod | grep zap| sed 's/,/ /g'`; do rmmod $i >> /dev/null; done; rmmod zaptel) 
		case ${type} in
			e1)
				t1e1override=0
				$(modprobe zaptel; modprobe zttranscode; modprobe wct4xxp t1e1override=0; modprobe wcte11xp t1e1override=0; modprobe wct1xxp t1e1override=0; ztcfg)
			;;
			t1)
				t1e1override=1		
				$(modprobe zaptel; modprobe zttranscode; modprobe wct4xxp t1e1override=1; modprobe wcte11xp t1e1override=1; modprobe wct1xxp t1e1override=1; ztcfg)
			;;
			*)
				error_out("No mode to change specified!")
			;;
		esac	
		;;
	applysettings)	
		# Split based on ||| delimeter, and apply to zaptel.
		blob=`echo ${2} | sed 's/|||/\n/g'`
		mv ${ZAPCONF} ${ZAPCONF}.b4editzap
		cmd=`zapscan`
		echo "${blob}" >> /etc/zaptel.conf
		ztcfg -vv 2> $ZTCFG_OUTPUT
		;;
esac

function error_out() {
	echo "${1}" > ${ZTCFG_OUTPUT}
}
