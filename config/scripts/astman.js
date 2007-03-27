/*
 * Asterisk -- An open source telephony toolkit.
 *
 * Javascript routines or accessing manager routines over HTTP.
 *
 * Copyright (C) 1999 - 2006, Digium, Inc.
 *
 * Mark Spencer <markster@digium.com>
 *
 * See http://www.asterisk.org for more information about
 * the Asterisk project. Please do not directly contact
 * any of the maintainers of this project for assistance;
 * the project provides a web site, mailing lists and IRC
 * channels for your use.
 *
 * This program is free software, distributed under the terms of
 * the GNU General Public License Version 2. See the LICENSE file
 * at the top of the source tree.
 *
 */

var sc_displaytime = 1000;
var asterisk_guiappname =  "Asterisk GUI (Beta)";
var asterisk_guitools = "asterisk_guitools";
var asterisk_guitoolsversion = "0.7";
var asterisk_guiversion = "$Revision$";
var asterisk_guifbt = 3000; // Feedback msg time
var asterisk_ConfigBkpPath = "/var/lib/asterisk/gui_configbackups/" ;
var asterisk_menusRecord_path = "/var/lib/asterisk/sounds/record/";
var asterisk_guiSysInfo = "sh /etc/asterisk/gui_sysinfo" ;
var asterisk_guiSysInfo_output = "./sysinfo_output.html";
var asterisk_rawmanPath = "../../rawman" ;

var sortbynames = false;
var dragdata = new Object;
var asterisk_guiTDPrefix = "DID_";

function gui_feedback(a,b,c){ 
// a is msg, b is color (optional ), c is display time in milliseconds(optional, default to asterisk_guifbt)
	if(!b){
		var b = "#DA2804"; // dark reddish brown
	}
	if(b=='blue'){ 
		b = "#303BCA"; // dark blue
	}else if(b=='green'){
		b = "#448156"; // dark green
	}

	if(!c){c = asterisk_guifbt;}
	var _f = top._$('feedback_round');
	var _g = top._$('feedback');
	_g.style.color = b;
	_g.innerHTML = a ;
	_f.style.display = '';
	window.setTimeout( function(){top._$('feedback_round').style.display = "none"; }, c );
}


function  gui_alert(msg){
	gui_alertmsg( 1, msg );
}

function gui_alertmsg( msgtype, msg ){
	// Alternative to javascript's alert box - the native alert boxes are stopping the background XHRs
	//  usage - msgtype could be 1 or 2 or 3 , msg is the alert message
	top.alertframename = "alertiframe";
	top.alertmsg = msg ;
	top.alertmsgtype = msgtype ;
	if( !top.document.getElementById(top.alertframename)){
		var h= top.document.createElement("IFRAME");
		h.setAttribute("id", top.alertframename );
		h.setAttribute("ALLOWTRANSPARENCY", "true");
		var _hs = h.style ;
		_hs.position="absolute";
		_hs.left= 0;
		_hs.top= 0;
		_hs.width= '100%';
		_hs.height= '100%';
		_hs.zIndex = 9999 ;
		h.src = "guialert.html" ;
		h.frameBorder="0";
		h.scrolling="no";
		_hs.filter='progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=90)';
		//h.style.MozOpacity = .90;
		top.document.body.appendChild(h);
	}else{
		top.document.getElementById( top.alertframename ).contentWindow.update( );
		top.document.getElementById( top.alertframename ).style.display = "";
	}
}


// Douglas Crockford's purge function for IE Memory leaks
// http://javascript.crockford.com/memory/leak.html
// No details about copyrights or License mentioned - assumed to be in public domain
function purge(d) {
    var a = d.attributes, i, l, n;
    if (a) {
        l = a.length;
        for (i = 0; i < l; i += 1) {
            n = a[i].name;
            if (typeof d[n] === 'function') {
                d[n] = null;
            }
        }
    }
    a = d.childNodes;
    if (a) {
        l = a.length;
        for (i = 0; i < l; i += 1) {
            purge(d.childNodes[i]);
        }
    }
}


function add_event( a , b, c ){  
	// cross browser function for adding events
	// a is element , b is event (string) , c is the function 
	if ( a.addEventListener){
		a.addEventListener(b, c, false);
	} else if (a.attachEvent){
		a.attachEvent('on'+b, c);
	}
}

function remove_event(a,b,c){ 
	// cross browser function for removing events
	// a is element , b is event (string) , c is the function 
	if(a.removeEventListener){
		a.removeEventListener( b, c , false);
	}else if(a.detachEvent){
		a.detachEvent("on"+b, c);
	}
}

function config2json(a, b, c){		// a is filename (string) , b is 0 or 1 , c is callback function
	var opt = { method: 'get', asynchronous: true,
		onSuccess: function(originalRequest) {  var f = toJSON(originalRequest.responseText, b) ;  c(f) ; },
		onFailure: function(t) { gui_alert("Config Error: " + t.status + ": " + t.statusText); },
		parameters: "action=getconfig&filename="+a };
	var tmp = new Ajax.Request(asterisk_rawmanPath , opt);
}

function toJSON(z, p){
	// This function converts z,  the asterisk config file as read using 'action=getconfig' to a JSON string 
	// where z is originalRequest.responseText of the getconfig on a asterisk format config file, 
	// and p is 0 or 1, 
	//	 0 for non unique subfields ( extensions.conf context where there are multiple subfields with same name - -  Ex: 'exten ='   )
	//	 1 for unique subfields ( config files where there are no two subfields of a context have same name )
	//  if not sure ,  use p = 0 
	var a = [ ] ;
	var  json_data = "";
	var t = z.split("\n");
	for(var r=0; r < t.length ; r++){
		var f = t[r].split("-") ;
		var h = f[0].toLowerCase();
		var catno = parseInt( f[1] ,10 );
		if( h == "category" ){
			var g = t[r].indexOf(":") ; 
			var catname = t[r].substr(g+1) ; // catogory 
			catname = catname.replace(/^\s*|\s*$/g,'') ; // trim 
			a[ catno ] = { };
			a[ catno ].categoryname = catname  ;
			if(!p)
				a[ catno ].subfields = [] ;
			else
				a[ catno ].subfields = {} ;
		}else if ( h == "line" ){
			var j = t[r].indexOf(":") ;
			var subfield = t[r].substr(j+1) ; // subfield
			subfield = subfield.replace(/^\s*|\s*$/g,'') ; // trim 
			if( !p){
				a[ catno ].subfields.push( subfield ) ;
			}else{
				var v = subfield.indexOf("=");
				var subfield_a = subfield.substring(0,v); // subfield variable
				var subfield_b =  subfield.substr(v+1) ; // subfield variable value
				a[ catno ].subfields[subfield_a] = subfield_b;
			}
		}
	}
	// start building the json string
	json_data = "{" ;
	if(!p){
		for( var s=0; s < a.length; s++ ){
			var b = a[s].subfields ;
			json_data += '"' + a[s].categoryname + '" : [ ' ;
			for ( var y = 0 ;  y < b.length ;  y++ ){
				json_data += '"' + b[y] + '"' ;
				if( y < b.length - 1 ){	json_data += ',' ;	}
			}
			if( s < a.length - 1 ){ json_data += ' ],' ; }else{ json_data += ' ]}' ; }
		}
	}else{
		for( var s=0; s < a.length; s++ ){
			var b = a[s].subfields ;
			json_data += '"' + a[s].categoryname + '" :  {' ;
			var hascomma = 0;
			for ( var y in b ){ 
				if ( b.hasOwnProperty(y) ){ 
					if(hascomma){
						json_data += ', "' + y + '":"' + b[y] + '"' ; 
					}else{
						json_data += '"' + y + '":"' + b[y] + '"' ; 
						hascomma = 1;
					}
				} 
			}
			if( s < a.length - 1 ){ json_data += ' },' ; }else{ json_data += ' }}' ; }
		}
	}
	if(json_data == "{"){ return '{}';}
	// done building the json string
	return json_data ;
}

function setWindowTitle(a){
	top.document.title = asterisk_guiappname + " -- " + a ;
}

function startDrag(event, movethis ){
	dragdata.movethis = movethis ;
	if(typeof window.scrollX != "undefined"){
		dragdata.initialcursorX = event.clientX + window.scrollX;
		dragdata.initialcursorY = event.clientY + window.scrollY;
	}else{
		dragdata.initialcursorX =  window.event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
		dragdata.initialcursorY = window.event.clientY + document.documentElement.scrollTop + document.body.scrollTop;
	}
	dragdata.initialwindowleft = parseInt( $(dragdata.movethis).style.left) ;
	dragdata.initialwindowtop = parseInt($(dragdata.movethis).style.top) ;
	if(typeof window.innerWidth != "undefined"){
		dragdata.maxleft = window.innerWidth - parseInt($(dragdata.movethis).style.width) ;
		dragdata.maxtop = window.innerHeight - parseInt($(dragdata.movethis).style.height) ;
	}else{
		dragdata.maxleft = document.body.offsetWidth - parseInt($(dragdata.movethis).style.width) ;
		dragdata.maxtop = document.body.offsetWidth- parseInt($(dragdata.movethis).style.height) ;
	}
	add_event( document , "mousemove" , movewindow ) ;
	add_event( document , "mouseup" , stopDrag ) ;
}


function stopDrag(){
	remove_event( document , "mousemove" , movewindow ) ;
	remove_event( document , "mouseup" , stopDrag ) ;
}

function movewindow(event){
	if(typeof window.scrollX != "undefined"){
	  x = event.clientX + window.scrollX;
	  y = event.clientY + window.scrollY;
	}else{
		x =  window.event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
		y = window.event.clientY + document.documentElement.scrollTop + document.body.scrollTop;
	}
	  var tmp_top = dragdata.initialwindowtop  + y - dragdata.initialcursorY ; 
	  var tmp_left = dragdata.initialwindowleft + x - dragdata.initialcursorX;
	  if( tmp_left > 0 && tmp_left < dragdata.maxleft ){ $(dragdata.movethis).style.left = tmp_left  + "px"; }
	  if( tmp_top > 0 && tmp_top < dragdata.maxtop ){ $(dragdata.movethis).style.top  = tmp_top + "px"; }
}

function check_patternonfields(fields){
	// for checking validity of field contents before form submitting 
	for (var i=0; i < fields.length; i++){
		var x = document.getElementById(fields[i]);
		if( x.getAttribute('pattern') && !check_pattern(x.getAttribute('pattern') , x.value)   ){
			gui_alert("Invalid Characters in "+ fields[i]);
			x.focus();
			return false;
		}
	}
	return true;
}

function showdiv_statusmessage(){
        var h= document.createElement("div");
	h.setAttribute("id","status_message");
	var _hs = h.style;
	_hs.display="none";
	_hs.position="absolute";
	_hs.left= 170;
	_hs.top= 190;
	_hs.width= 350;
	_hs.height= 115;
	_hs.backgroundColor= "#F4EFE5";
	_hs.borderWidth= "1px";
	_hs.borderColor= "#7E5538";
	_hs.borderStyle= "solid";
	h.innerHTML = "<BR><BR><TABLE border=0 cellpadding=0 cellspacing=3 align=\"center\"> <TR>	<TD><img src=\"images/loading.gif\"></TD> <TD valign=\"middle\" align=\"center\">&nbsp;&nbsp;<div id=\"message_text\"></div></TD> </TR> </TABLE> ";
	document.body.appendChild(h);
}

function combo_box(a, b, c ){	
	var combo_text = document.getElementById(a);
	var combo_selectdiv = document.getElementById(b);
	var combo_selectbox = document.getElementById(c);
	var TAB = 9;
	var ENTER = 13;
	var ESC = 27;
	var KEYUP = 38;
	var KEYDN = 40;
	var BKSPACE = 8;

	function xyz(event){
		if( event.keyCode == ENTER || event.keyCode == ESC || event.keyCode == TAB){
			combo_selectdiv.style.display = "none";
			return false;
		}else if( event.keyCode == KEYDN ||  event.keyCode == KEYUP ){
			combo_selectbox.focus();
			return false;
		}else if( event.keyCode == BKSPACE && combo_text.value.length ==0 ){
			combo_selectdiv.style.display = "none";
			return false;
		}else{
			combo_selectdiv.style.display = "";
			return true;
		}
	}
	
	function abcd(event){
		if( event.keyCode == ENTER || event.keyCode == ESC || event.keyCode == TAB){
		return false;
		}
		for (var i=0; i < combo_selectbox.options.length; i++){
			if(combo_selectbox.options[i].value.toLowerCase().match(combo_text.value.toLowerCase()) ){
				combo_selectbox.selectedIndex = i;
				return true;
			}
		}
		combo_selectdiv.style.display = "none";				
	}

	function efgh(event) {
		if( event.keyCode == ENTER ){
			combo_text.value = combo_selectbox.value;
			combo_text.focus();
			combo_selectdiv.style.display = "none";
			return false;
		}else if( event.keyCode == ESC ){
			combo_text.focus();
			combo_selectdiv.style.display = "none";
		}else{
			return true;
		}
	}
	function ijkl(event) {
		combo_text.value = combo_selectbox.value;
		combo_text.focus();
		combo_selectdiv.style.display = "none";
	}

	combo_selectdiv.style.position ="absolute";
	combo_selectdiv.style.top = "0px";
	combo_selectdiv.style.left = "0px";
//	combo_selectdiv.style.z-index = 10000;
	combo_selectdiv.style.display = "none";

	add_event( combo_text , 'keychange' , combobox_activate ) ;
	add_event( combo_text , 'focus' , combobox_activate ) ;
	add_event( combo_text , 'focusout' , function(){ combo_selectdiv.style.display ='none'; } ) ;
	add_event( combo_text , 'keypress' , xyz) ;
	add_event( combo_text , 'keyup' , abcd ) ;
	add_event( combo_selectbox, 'keypress' , efgh ) ;
	add_event( combo_selectbox, 'click' , ijkl ) ;

	function combobox_activate(){
		var tmp_left = combo_text.offsetLeft;
		var tmp_top = combo_text.offsetTop + combo_text.offsetHeight;
		var tmp_parent = combo_text;
		while(tmp_parent.offsetParent != document.body){
			tmp_parent = tmp_parent.offsetParent;
			tmp_left += tmp_parent.offsetLeft;
			tmp_top += tmp_parent.offsetTop;
		}
		combo_selectdiv.style.left = tmp_left;
		combo_selectdiv.style.top = tmp_top ;
		combo_selectdiv.style.width = combo_text.offsetWidth;
		combo_selectdiv.style.display = "";
	}
}

function  InArray(search_array, searchstring ){
	var i = search_array.length
	if( i>0){
		for(i=0; i < search_array.length; i++ ){
			if( search_array[i] === searchstring )
				return true;
		}
	}

	return false;	
}

function objcopy(orig) {
	var copy = new Object;
	for (i in orig) {
		if (typeof orig[i] == 'object') {
			copy[i] = objcopy(orig[i]);
		} else {
			copy[i] = orig[i];
		}
	}
	return copy;
};

function do_compare(box, a, b){
	var ret;
	if (box.callbacks.compare) {
		return box.callbacks.compare(box, a,b);
	} else if (a.innerHTML < b.innerHTML)
		return true;
	return false;
}

function insert_option(box, res, value, core_name){
	var z;
	if (res) {
		var opt_new = box.ownerDocument.createElement('option');
		opt_new.text = res  ;
		opt_new.value = value ;
		opt_new.core_name = core_name;

		// Now decide where to add in box, and add it to box
		var add = 0;
		for ( var g=0; g < box.options.length  ; g++) {
			if(	opt_new.text < box.options[g].text  ){ // add before this element in box
				add = 1;
				try{
					box.add(opt_new, box.options[g] );
					break;
				}catch(err){
					box.add(opt_new, g);
					break;
				}
			}
		}
		if ( add ==0 ){ try{ box.add(opt_new, null); } catch(err){ box.add(opt_new); }}
	}
}

function reformat_option(box, index){
	var v, tmp, res;
	var cfg = box.stored_config;
	v = box.options[index].value;
	tmp = v.split(']');
	res = ( tmp.length > 1 ) ? box.callbacks.format(cfg.catbyname[tmp[0]], tmp[1]) : box.callbacks.format(cfg.catbyname[v]) ;
	if (res){ box.options[index].innerHTML = res;}
}

function update_option(box, index){
	var v, tmp;
	var cfg = box.stored_config;
	v = box.options[index].value;
	tmp = v.split(']');
	box.remove(index);
	if (tmp.length > 1) {
		res = box.callbacks.format(cfg.catbyname[tmp[0]], tmp[1]);
		insert_option(box, res, tmp[0] + "]" + tmp[1], cfg.catbyname[tmp[0]].subfields[tmp[1]]['name']); 
	} else {
		res = box.callbacks.format(cfg.catbyname[v]);
		insert_option(box, res, cfg.catbyname[v].name, cfg.categories[x].name);
	}
}

function update_box(box) {
	var x,y,z;
	var res;
	var oldselect = box.value;

	cfg = box.stored_config;

	while (box.options.length)
		box.remove(0);
	for (x=0;x<cfg.catcnt;x++) {
		if (box.callbacks.eachline) {
			if (box.callbacks.includecats) {
				res = box.callbacks.format(cfg.categories[x]);
				insert_option(box,res,cfg.categories[x].name,cfg.categories[x].name);
			}
			for (y=0;cfg.categories[x].names[y];y++) {
				cfg.categories[x].subfields[y] = new Object;
				res = box.callbacks.format(cfg.categories[x], y);
				insert_option(box,res,cfg.categories[x].name + "]" + y,cfg.categories[x].subfields[y]['name']);
			}
		} else {
			res = box.callbacks.format(cfg.categories[x]);
			insert_option(box,res,cfg.categories[x].name,cfg.categories[x].name);
		}
	}
	box.oldselect = -1;
	box.selectedIndex = -1;
	box.value = null;
	for (x=0;x<box.options.length;x++) {
		if (box.options[x].value == oldselect)
			box.selectedIndex = x;
	}
	select_item(box);
}

function select_item(box, errmsg) {
	var category;
	var tmp;
	if (!errmsg)
		errmsg = "Discard changes?";
	if ((box.widgets['save'] && !box.widgets['save'].disabled)) {
		if (!confirm(errmsg)) {
			box.selectedIndex = box.oldselect;
			return false;
		}
	}
	tmp = box.value.split(']');
	if (box.oldselect && (box.oldselect > -1)) {
		if ((tmp.length > 1) && (box.stored_config.catbyname[tmp[0]].subfields[tmp[1]].name == "")) {
			box.remove(box.oldselect);
			box.oldselect = -1;
			box.stored_config.catbyname[tmp[0]].subfields.splice(tmp[1], 1);
			box.stored_config.catbyname[tmp[0]].names.splice(tmp[1], 1);
			try{
			box.stored_config.catbyname[tmp[0]].values.splice(tmp[1], 1);
			}
			catch(err){
			
			}
		} else if (box.options[box.oldselect].value == "") {
			box.remove(box.oldselect);
			box.oldselect = -1;
			box.stored_config.catbyname[""] = null;
			box.stored_config.categories[--box.stored_config.catcnt] = null;
		} else if (box.options[box.oldselect].text == "New Entry") {
			box.remove(box.oldselect);
			box.oldselect = -1;
		}
	}

	if (tmp.length > 1) {
		category = box.stored_config.catbyname[tmp[0]].subfields[tmp[1]];
	} else {
		category = box.stored_config.catbyname[box.value];
	}
	box.engine.cat2fields(box.widgets, category);
	if (box.widgets['delete']) {
		if (category)
			box.widgets['delete'].disabled = false;
		else
			box.widgets['delete'].disabled = true;
	}
	box.oldselect = box.selectedIndex;
	if (box.widgets['new'])
		box.widgets['new'].disabled = false;
	if (box.widgets['newitem'])
		box.widgets['newitem'].disabled = false;
	if (box.callbacks.postselect)
		box.callbacks.postselect(box, box.value);
	return true;
};

function cancel_item(box) {
	var tmp = box.options[box.selectedIndex].value.split(']');
	if (tmp.length > 1) {
		if (box.stored_config.catbyname[tmp[0]].subfields[tmp[1]].name.length < 1) {
			if (select_item(box,"Discard new entry?") && box.widgets['status']){
				box.widgets['status'].innerHTML = "<i>New entry cancelled!</i>";
				box.selectedIndex = -1;
			}
		} else {
			if (select_item(box) && box.widgets['status'])
				box.widgets['status'].innerHTML = "<i>Changes cancelled!</i>";
		}
	} else {
		if (box.options[box.selectedIndex].value == "") {
			if (select_item(box,"Discard new entry?") && box.widgets['status']){
				box.widgets['status'].innerHTML = "<i>New entry cancelled!</i>";
				//box.selectedIndex = -1;
				if (box.callbacks.cancelnewcategory) 
					box.callbacks.cancelnewcategory();
			}
		} else {
			if (select_item(box) && box.widgets['status']){
				box.widgets['status'].innerHTML = "<i>Changes cancelled!</i>";
				if (box.callbacks.cancelchanges) 
					box.callbacks.cancelchanges();
			}
		}
	}
}

function first_free_exten(box, start) {
	var x = start;
	var y;
	for (;;) {
		for (y=0;y<box.options.length;y++) {
			if (box.options[y].core_name == x)
				break;
		}
		if (y >= box.options.length)
			break;
		x++;
	}
	return x;
}

function action_issuccess(responseText) {
	if ( responseText.indexOf("Response: Success") == -1 ){
		return false;
	}else{
		return true;
	}
}

function action_errmsg (responseText){
	var tmp = responseText.split("Message:");
	return tmp[1];
}

function delete_item(box, value, noconfirm) {
	var opt = {
		method: 'get',
		asynchronous: true,
		onSuccess: function(t) { 
//			if(action_issuccess(t.responseText) ){
				if (box.callbacks.oncategorydelete) 
					box.callbacks.oncategorydelete(value);
				if (box.widgets['status']) 
					box.widgets['status'].innerHTML = "<i>Deleted.</i>";
				if (box.callbacks.delchanges)
					box.callbacks.delchanges(box, box.delvalue, box.delcat);
//			}else{
//				alert( action_errmsg (t.responseText) );
//			}
		},
		onFailure: function(t) {
			gui_alert("Config Error: " + t.status + ": " + t.statusText);
		}
	};
	var tmp, tmp2, uri;
	var x,y;
	var updatebox = 0;
	var subcat, subname, suborig;
	if (!noconfirm) {
		if( box.options[box.selectedIndex].text == "New Entry" && box.widgets['cancel'] ){
			box.widgets['cancel'].click();
			return true;
		}
		if (!confirm("Delete entry?")) {
			return false;
		}
	}
	if (!value) {
		updatebox = 1;
		value = box.value;
	}
	box.delvalue = value;
	tmp = value.split(']');
	if (tmp.length > 1) {
		var oldname;
		box.delcat = box.stored_config.catbyname[tmp[0]].subfields[tmp[1]];
		oldname = box.stored_config.catbyname[tmp[0]].subfields[tmp[1]].name;
		subname = box.stored_config.catbyname[tmp[0]].names[tmp[1]];
		suborig = box.stored_config.catbyname[tmp[0]].fields[tmp[1]];
		box.stored_config.catbyname[tmp[0]].subfields.splice(tmp[1], 1);
		box.stored_config.catbyname[tmp[0]].names.splice(tmp[1], 1);
		box.stored_config.catbyname[tmp[0]].fields.splice(tmp[1], 1);
		for (x=0;x<box.options.length;x++) {
			tmp2 = box.options[x].value.split(']');
			/* Renumber remaining line numbers */
			if ((tmp2.length > 1) && (tmp2[0] == tmp[0])) {
				if (tmp2[1] > tmp[1]) {
					var newname = tmp2[0] + "]" + String(Number(tmp2[1]) - 1);
					box.options[x].value = newname;
				}
			}
		}
		if (updatebox && oldname == "") {
			if (box.widgets['status']) 
				box.widgets['status'].innerHTML = "<i>Deleted.</i>";
		} else {
			uri = build_action('delete', 0, tmp[0], subname, "", suborig);
			opt.parameters="action=updateconfig&srcfilename=" + encodeURIComponent(box.config_file) + "&dstfilename=" +
						encodeURIComponent(box.config_file) + uri;
			tmp = new Ajax.Request(box.engine.url, opt);
		}
	} else {	
		for (x=0;x<box.stored_config.catcnt;) {
			if (box.stored_config.categories[x] == box.stored_config.catbyname[value]) {
				box.stored_config.categories.splice(x, 1);
			} else
				x++;
		}
		for (;y<box.stored_config.catcnt;y++) {
			box.stored_config.categories[y] = null;
		}
		delete box.stored_config.catbyname[value];
		--box.stored_config.catcnt;
		if (updatebox && box.options[box.selectedIndex].value == "") {
			if (box.widgets['status']) 
				box.widgets['status'].innerHTML = "<i>Deleted.</i>";
		} else {
			uri = build_action('delcat', 0, value, "", "");
			opt.parameters="action=updateconfig&srcfilename=" + encodeURIComponent(box.config_file) + "&dstfilename=" +
						encodeURIComponent(box.config_file) + uri;
			tmp = new Ajax.Request(box.engine.url, opt);
		}
	}

	if (updatebox) {
		box.remove(box.selectedIndex);
		for (x=0;x<box.options.length;) {
			var tmp = box.options[x].value.split(']');
			if (tmp.length > 1) {
				if (tmp[0] == value) {
					box.remove(x);
				} else
					x++;
			} else
				x++;
		}
		box.oldselect = -1;
		box.selectedIndex = -1;
		box.value = null;
		select_item(box);
	}
};

function new_item(box) {
	var category = null;
	var name = null;

	if (box.widgets['save'] && box.widgets['save'].disabled == false){
		if (!confirm( "Discard changes?")) {
			box.selectedIndex = box.oldselect;
			return false;
		}
	}
	if (box.callbacks.newcategory) {
		category = box.callbacks.newcategory();
	}
	if (!category) {
		category = new Object;
		category.fieldbyname = { };
		category.fields = new Array;
	}

	var newoption = box.ownerDocument.createElement("option");
	newoption.text = "New Entry";
	newoption.value = "";
	box.options.add(newoption);
	box.selectedIndex = box.options.length - 1;
	box.oldselect = box.options.length - 1;
	box.stored_config.catbyname[""] = category;
	box.stored_config.categories[box.stored_config.catcnt++] = category;
	name = category.name;
	category.name = '';
	box.engine.cat2fields(box.widgets, category);
	if (box.widgets['new'])
		box.widgets['new'].disabled = true;
	if (box.widgets['newitem'])
		box.widgets['newitem'].disabled = true;
	if (box.widgets['save'])
		box.widgets['save'].disabled = false;
	if (box.widgets['delete'])
		box.widgets['delete'].disabled = false;
	if (box.widgets['cancel'])
		box.widgets['cancel'].disabled = false;
	if (box.widgets['status']) 
		box.widgets['status'].innerHTML = "<i>Creating new entry!</i>";
	if (box.widgets['name']){
		box.widgets['name'].value = name;
		//box.widgets['name'].focus();
	}
}

function new_subitem(box) {
	var name = null;
	var tmp;
	var pos;
	var subname, subitem, subcat;
	var category;
	var newoption = box.ownerDocument.createElement("option");
	newoption.text = "New Entry";

	if (box.callbacks.newsubitem) {
		tmp = box.callbacks.newsubitem();
		if (tmp) {
			subcat = tmp[0];
			subname = tmp[1];
			subitem = tmp[2];
		}
	}
	if (!subitem) {
		subitem = new Object;
	}
	if (!subcat)
		subcat = box.current_category;
	if (!subcat || !subcat.length || !subname || !subname.length)
		return;

	box.options.add(newoption);
	box.selectedIndex = box.options.length - 1;
	box.oldselect = box.options.length - 1;

	category = box.stored_config.catbyname[subcat];
	pos = category.names.length;
	category.subfields[pos] = subitem;
	category.names[pos] = subname;
	category.fields[pos] = null;
	newoption.value = subcat + "]" + pos;
	newoption.core_name = category.subfields[pos].name;
	box.value = newoption.value;
	name = subitem.name;
	subitem.name = '';
	box.engine.cat2fields(box.widgets, subitem);
	if (box.widgets['new'])
		box.widgets['new'].disabled = true;
	if (box.widgets['newitem'])
		box.widgets['newitem'].disabled = true;
	if (box.widgets['save'])
		box.widgets['save'].disabled = false;
	if (box.widgets['delete'])
		box.widgets['delete'].disabled = false;
	if (box.widgets['cancel'])
		box.widgets['cancel'].disabled = false;
	if (box.widgets['status']) 
		box.widgets['status'].innerHTML = "<i>Creating new entry!</i>";
	if (box.widgets['name'])
		box.widgets['name'].value = name;
}

function apply_uri(box, uri){
	var opt = {
		method: 'get',
		asynchronous: true,
		onSuccess: function() { 
			if (box.widgets['save'])
				box.widgets['save'].disabled = true;
			if (box.widgets['new'])
				box.widgets['new'].disabled = false;
			if (box.widgets['newitem'])
				box.widgets['newitem'].disabled = false;
			if (box.widgets['cancel'])
				box.widgets['cancel'].disabled = true;
			if (box.widgets['status']) 
				box.widgets['status'].innerHTML = "<i>Configuration saved!</i>";
			if (box.callbacks.savechanges)
				box.callbacks.savechanges();
		},
		onFailure: function(t) {
			gui_alert("Config Error: " + t.status + ": " + t.statusText);
		}
	};
	var tmp;
	
	opt.parameters="action=updateconfig&srcfilename=" + encodeURIComponent(box.config_file) + "&dstfilename=" +
		encodeURIComponent(box.config_file) + uri;
	tmp = new Ajax.Request(box.engine.url, opt);
}


function save_item(box) {
	if (box.callbacks.beforeSaving){	 // like for field validations etc.
		var tmp =	box.callbacks.beforeSaving();
		if ( tmp == false )
			return false;
	}
	var opt = {
		method: 'get',
		asynchronous: true,
		onSuccess: function() { 
			if (box.widgets['save'])
				box.widgets['save'].disabled = true;
			if (box.widgets['new'])
				box.widgets['new'].disabled = false;
			if (box.widgets['newitem'])
				box.widgets['newitem'].disabled = false;
			if (box.widgets['cancel'])
				box.widgets['cancel'].disabled = true;
			if (box.widgets['status']) 
				box.widgets['status'].innerHTML = "<i>Configuration saved!</i>";
			if (box.callbacks.savechanges)
				box.callbacks.savechanges();
		},
		onFailure: function(t) {
			gui_alert("Config Error: " + t.status + ": " + t.statusText);
		}
	};
	var uri = "" ;
	var tmp;
	var temp;
	var newval;
	var cattmp = new Object;
	cattmp.catname = box.value;
	
	if (box.callbacks.checkparams) {
		if (box.callbacks.checkparams(box))
			return;
	}
	tmp = box.value.split(']');

	if (tmp.length > 1) {
		box.engine.fields2changes(box.widgets, box.stored_config, cattmp);
		newval = box.callbacks.fields2val(box, box.stored_config.catbyname[tmp[0]].subfields[tmp[1]]);
		if (newval != box.stored_config.catbyname[tmp[0]].fields[tmp[1]]) {
			if (box.stored_config.catbyname[tmp[0]].fields[tmp[1]]) {
				uri = build_action('update', 0, tmp[0], box.stored_config.catbyname[tmp[0]].names[tmp[1]], newval, box.stored_config.catbyname[tmp[0]].fields[tmp[1]]);

			} else {
				if (box.stored_config.catbyname[tmp[0]].subfields[tmp[1]]['>'])
					uri = build_action('append', 0, tmp[0], box.stored_config.catbyname[tmp[0]].names[tmp[1]], newval, 'object');
				else
					uri = build_action('append', 0, tmp[0], box.stored_config.catbyname[tmp[0]].names[tmp[1]], newval);
			}
			box.stored_config.catbyname[tmp[0]].fields[tmp[1]] = newval;
			box.options[box.selectedIndex].core_name = box.stored_config.catbyname[tmp[0]].subfields[tmp[1]]['name'];
			tmp = box.callbacks.format(box.stored_config.catbyname[tmp[0]], tmp[1]);
			if (tmp) {
				box.options[box.selectedIndex].innerHTML = tmp;
    			var tmp_newopt = box.ownerDocument.createElement('option');
				tmp_newopt.text = box.options[box.selectedIndex].innerHTML ;
				tmp_newopt.value = box.options[box.selectedIndex].value;

				for (var y = 0; y < box.options.length + 1; y++) {
					if (!box.options[y] || 
						do_compare(box, box.options[box.selectedIndex], box.options[y])) {
						try{
							box.options.add(box.options[box.selectedIndex], y);
						}catch(e){
							box.remove(box.selectedIndex);
							box.add(tmp_newopt, y); 
						}
						break;
					}
				}
			} else
				box.remove(box.selectedIndex);
			opt.parameters="action=updateconfig&srcfilename=" + encodeURIComponent(box.config_file) + "&dstfilename=" +
						encodeURIComponent(box.config_file) + uri;
			temp = new Ajax.Request(box.engine.url, opt);
		}
	} else {
		if (box.widgets['name']) {
			/* Check for conflict in the name */
			if (box.widgets['name'].value.length) {
				if (box.widgets['name'].value != cattmp.catname) {
					if (box.stored_config.catbyname[box.widgets['name'].value]) {
						gui_alert("Sorry, an entry named " + box.widgets['name'].value + " already exists!");
						return;
					}
				}
			} else {
				gui_alert("Sorry, a " + box.callbacks.identifier + " must be specified!");
				return;
			}
		}
		uri = box.engine.fields2changes(box.widgets, box.stored_config, cattmp);
		if (uri.length) {
			if (box.callbacks.format) {
				tmp = box.callbacks.format(box.stored_config.catbyname[cattmp.catname]);
				box.options[box.selectedIndex].value = cattmp.catname;
				box.options[box.selectedIndex].core_name = cattmp.catname;
				if (tmp) {
					box.options[box.selectedIndex].innerHTML = tmp;
					for (var y = 0; y < box.options.length + 1; y++) {
						if (!box.options[y] ||  do_compare(box, box.options[box.selectedIndex], box.options[y])) {
							try{
								box.options.add(box.options[box.selectedIndex], y);
							}catch(err){
								var new_option = box.ownerDocument.createElement('option') ;
								new_option.text = box.options[box.selectedIndex].text  ;
								new_option.value = box.options[box.selectedIndex].value ;
								new_option.core_name = box.options[box.selectedIndex].core_name ;
								box.remove(box.selectedIndex);
								box.add( new_option , y);
							}
							break;
						}
					}
				} else{
					box.remove(box.selectedIndex);
				}
			}
			opt.parameters="action=updateconfig&srcfilename=" + encodeURIComponent(box.config_file) + "&dstfilename=" + encodeURIComponent(box.config_file) + uri;
			temp = new Ajax.Request(box.engine.url, opt);
		}
	}
	if (!uri.length) {
		if (!box.callbacks.savechanges || !box.callbacks.savechanges()) {
			if (box.widgets['status']){  box.widgets['status'].innerHTML = "<i>No changes made!</i>"; }
		}
		if (box.widgets['save']){  box.widgets['save'].disabled = true; }
		if (box.widgets['cancel']) { box.widgets['cancel'].disabled = true; }
	}
}

function ast_true(s){
	if ( s == 'yes' || s == 'true' || s == 'y' || s == 't' || s == '1' || s == 'on' ){
			return true;
	}else{
		return false;
	}
}

function build_action(action, count, cat, name, value, match){
	var s="";
	var cnt = "" + count;
	while(cnt.length < 6)
		cnt = "0" + cnt;

	s += "&Action-" + cnt + "=" + encodeURIComponent(action);
	s += "&Cat-" + cnt + "=" + encodeURIComponent(cat);
	s += "&Var-" + cnt + "=" + encodeURIComponent(name);
	s += "&Value-" + cnt + "=" + encodeURIComponent(value);
	if (match)
		s += "&Match-" + cnt + "=" + encodeURIComponent(match);
	return s;
}

function check_pattern(pattern, text){
	if(typeof text != "undefined"){
		if (text.search(pattern) == -1)
			return false;
		else
			return true;
	}
	return true;
}


function Astman() {
	var me = this;
	var channels = new Array;
	var lastselect;
	var selecttarget;
	this.setURL = function(url) {
		this.url = url;
	};
	this.setEventCallback = function(callback) {
		this.eventcallback = callback;
	};
	this.setDebug = function(debug) {
		this.debug = debug;
	};

	this.run_tool = function(tool, callback) {
		var opt = {
			method: 'get',
			asynchronous: true,
			onSuccess: function() { 
				if (callback)
					callback();
			},
			onFailure: function(t) {
				gui_alert("Tool Error: " + t.status + ": " + t.statusText);
			}
		};
		var tmp;
		opt.parameters="action=originate&channel=" + encodeURIComponent("Local/executecommand@"+asterisk_guitools ) + "&Variable=command%3d"+ encodeURIComponent(tool) + "&application=noop&timeout=60000";
		tmp = new Ajax.Request(this.url, opt);
	}

	this.clickChannel = function(ev) {
		var target = ev.target;
		// XXX This is icky, we statically use astmanEngine to call the callback XXX 
		if (me.selecttarget)
			me.restoreTarget(me.selecttarget);
		while(!target.id || !target.id.length)
			target=target.parentNode;
		me.selecttarget = target.id;
		target.className = "chanlistselected";

		if(channelsCallback ){
			channelsCallback (target.id);
		}
		//me.chancallback(target.id);
	};

	this.restoreTarget = function(targetname) {
		var other;
		target = $(targetname);
		if (!target)
			return;
		if (target.previousSibling) {
			other = target.previousSibling.previousSibling.className;
		} else if (target.nextSibling) {
			other = target.nextSibling.nextSibling.className;
		}
		if (other) {
			if (other == "chanlisteven") 
				target.className = "chanlistodd";
			else
				target.className = "chanlisteven";
		} else
			target.className = "chanlistodd";
	};
	this.channelUpdate = function(msg, channame) {
		var fields = new Array("callerid", "calleridname", "context", "extension", "priority", "account", "state", "link", "uniqueid" );

		if (!channame || !channame.length)
			channame = msg.headers['channel'];

		if (!channels[channame])
			channels[channame] = new Array();
			
		if (msg.headers.event) {
			if (msg.headers.event == "Hangup") {
				delete channels[channame];
			} else if (msg.headers.event == "Link") {
				var chan1 = msg.headers.channel1;
				var chan2 = msg.headers.channel2;
				if (chan1 && channels[chan1])
					channels[chan1].link = chan2;
				if (chan2 && channels[chan2])
					channels[chan2].link = chan1;
			} else if (msg.headers.event == "Unlink") {
				var chan1 = msg.headers.channel1;
				var chan2 = msg.headers.channel2;
				if (chan1 && channels[chan1])
					delete channels[chan1].link;
				if (chan2 && channels[chan2])
					delete channels[chan2].link;
			} else if (msg.headers.event == "Rename") {
				var oldname = msg.headers.oldname;
				var newname = msg.headers.newname;
				if (oldname && channels[oldname]) {
					channels[newname] = channels[oldname];
					delete channels[oldname];
				}
			} else {
				channels[channame]['channel'] = channame;
				for (x=0;x<fields.length;x++) {
					if (msg.headers[fields[x]])
						channels[channame][fields[x]] = msg.headers[fields[x]];
				}
			}
		} else {
			channels[channame]['channel'] = channame;
			for (x=0;x<fields.length;x++) {
				if (msg.headers[fields[x]])
					channels[channame][fields[x]] = msg.headers[fields[x]];
			}
		}
	};
	this.channelClear = function() {
		channels = new Array;
	}
	this.channelInfo = function(channame) {
		return channels[channame];
	};
	this.channelTable = function(callback) {
		var s, x;
		var cclass, count=0;
		var found = 0;
		var foundactive = 0;
		var fieldlist = new Array("channel", "callerid", "calleridname", "context", "extension", "priority");

		me.chancallback = callback;
		s = "<table class='chantable' align='center'>\n";
		s = s + "\t<tr class='labels' id='labels'><td>Channel</td><td>State</td><td>Caller</td><td>Location</td><td>Link</td></tr>";
		count=0;
		for (x in channels) {
			if (channels[x].channel) {
				if (count % 2)
					cclass = "chanlistodd";
				else
					cclass = "chanlisteven";
				if (me.selecttarget && (me.selecttarget == x)) {
					cclass = "chanlistselected";
					foundactive = 1;
				}
				count++;
				s = s + "\t<tr class='" + cclass + "' id='" + channels[x].channel + "' onClick='astmanEngine.clickChannel(event)'>";
				s = s + "<td class='field_text'>" + channels[x].channel + "</td>";
				if (channels[x].state)
					s = s + "<td class='field_text'>" + channels[x].state + "</td>";
				else
					s = s + "<td class='field_text'><i class='light'>unknown</i></td>";
				if (channels[x].calleridname && channels[x].callerid && channels[x].calleridname != "<unknown>") {
					cid = channels[x].calleridname.escapeHTML() + " &lt;" + channels[x].callerid.escapeHTML() + "&gt;";
				} else if (channels[x].calleridname && (channels[x].calleridname != "<unknown>")) {
					cid = channels[x].calleridname.escapeHTML();
				} else if (channels[x].callerid) {
					cid = channels[x].callerid.escapeHTML();
				} else {
					cid = "<i class='light'>Unknown</i>";
				}
				s = s + "<td class='field_text'>" + cid + "</td>";
				if (channels[x].extension) {
					s = s + "<td class='field_text'>" + channels[x].extension + "@" + channels[x].context + ":" + channels[x].priority + "</td>";
				} else {
					s = s + "<td class='field_text'><i class='light'>None</i></td>";
				}
				if (channels[x].link) {
					s = s + "<td class='field_text'>" + channels[x].link + "</td>";
				} else {
					s = s + "<td class='field_text'><i class='light'>None</i></td>";
				}
				s = s + "</tr>\n";
				found++;
			}
		}
		if (!found)
			s += "<tr><td colspan=" + fieldlist.length + "><i class='light'>No active channels</i></td>\n";
		s += "</table>\n";
		if (!foundactive) {
			me.selecttarget = null;
		}
		return s;
	};
	this.parseResponse = function(t, callback, userdata) {
		var msgs = new Array();
		var inmsg = 0;
		var msgnum = 0;
		var x,y;
		var s = t.responseText;
		var allheaders = s.split('\r\n');
		if (me.debug) 
			me.debug.value = "\n";
		for (x=0;x<allheaders.length;x++) {
			if (allheaders[x].length) {
				var fields = allheaders[x].split(': ');
				if (!inmsg) {
					msgs[msgnum] = new Object();
					msgs[msgnum].headers = {};
					msgs[msgnum].names = new Array();
					y=0;
				}
				msgs[msgnum].headers[fields[0].toLowerCase()] = fields[1];
				msgs[msgnum].names[y++] = fields[0].toLowerCase();
				if (me.debug)
					me.debug.value = me.debug.value + "field " + fields[0] + "/" + fields[1] + "\n";
				inmsg=1;
			} else {
				if (inmsg) {
					if (me.debug)
						me.debug.value = me.debug.value + " new message\n";
					inmsg = 0;
					msgnum++;
				}
			}
		}
		if (me.debug) {
			me.debug.value = me.debug.value + "msgnum is " + msgnum + " and array length is " + msgs.length + "\n";
			me.debug.value = me.debug.value + "length is " + msgs.length + "\n";
			var x, y;
			for (x=0;x<msgs.length;x++) {
				for (y=0;y<msgs[x].names.length;y++)  {
					me.debug.value = me.debug.value + "msg "+ (x + 1) + "/" + msgs[x].names[y] + "/" + msgs[x].headers[msgs[x].names[y]] + "\n";
				}
			}
		}
		callback(msgs, userdata);
	};

	this.fields2changes = function(widgets, config, cattmp) {
		var thevalue;
		var changes="";
		var count = 0;
		var override=0;
		var tmp;
		var cat;
		
		tmp = cattmp.catname.split(']');
		if (tmp.length > 1)
			cat = config.catbyname[tmp[0]].subfields[tmp[1]];
		else
			cat = config.catbyname[cattmp.catname];
		
		if (widgets['name']) {
			if (cat.name != widgets['name'].value) {
				if (cat.name.length) {
					changes += build_action('renamecat', count++, cat.name, "", widgets['name'].value);
				} else {
					changes += build_action('newcat', count++, widgets['name'].value, "", "");
					override = 1;
				}
				cat.name = widgets['name'].value;
				if (cat.fieldbyname) {
					config.catbyname[cattmp.catname] = null;
					config.catbyname[cat.name] = cat;
					cattmp.catname = cat.name;
				}
			}
		}
		
		for (var x in widgets) {  if( widgets.hasOwnProperty(x) ){
			var src;
			if ((x == 'save') || (x == 'cancel') || (x == 'name') || (x == 'new') || (x == 'newitem') || (x == 'status') || (x == 'delete'))
				continue;
			if (widgets[x].name)
				src = widgets[x].name;
			else
				src = x;
			if (widgets[x] && widgets[x].type) {
				if (cat.fieldbyname) {
					if (cat.fieldbyname[src])
						thevalue = cat.fieldbyname[src];
					else
						thevalue = '';
				} else if (cat[src])
					thevalue = cat[src];
				else
					thevalue = '';
				if (widgets[x].type == 'radio') {
					if (widgets[x].checked) {
						if (override || !thevalue.length || (widgets[x].value != thevalue)) {
							if (cat.fieldbyname)
								cat.fieldbyname[src] = widgets[x].value;
							else
								cat[src] = widgets[x].value;
							if (cat.fieldbyname)
								changes += build_action('update', count++, cat.name, src, cat.fieldbyname[src]);
						}
					}
				} else if (widgets[x].type == 'checkbox') {
					if (override || !thevalue.length || (widgets[x].checked != ast_true(thevalue))) {
						if (widgets[x].checked) {
							if (cat.fieldbyname)
								cat.fieldbyname[src] = 'yes';
							else
								cat[src] = 'yes';
						} else if (cat.fieldbyname)
							cat.fieldbyname[src] = 'no';
						else
							cat[src] = 'no';
						if (cat.fieldbyname)
							changes += build_action('update', count++, cat.name, src, cat.fieldbyname[src]);
					}
				} else if (widgets[x].options && widgets[x].multiple && widgets[x].splitchar) {
					var answers = new Array;
					for (var y=0;y<widgets[x].options.length;y++) {
						if (widgets[x].options[y].selected)
							answers.push(widgets[x].options[y].value);
					}
					if (cat.fieldbyname) {
						cat.fieldbyname[src] = answers.join(widgets[x].splitchar);
						if (thevalue != cat.fieldbyname[src])
							changes += build_action('update', count++, cat.name, src, cat.fieldbyname[src]);
					} else
						cat[src] = answers.join(widgets[x].splitchar);
				} else if (override || (widgets[x].value != thevalue)) {
					if (cat.fieldbyname) {
						cat.fieldbyname[src] = widgets[x].value;
						changes += build_action('update', count++, cat.name, src, cat.fieldbyname[src]);
					} else
						cat[src] = widgets[src].value;
				}
			}
		}}
		return changes;
	};
	
	this.cat2fields = function(widgets, cat) {
		var thevalue;
		var savewidget = widgets['save'];
		var cancelwidget = widgets['cancel'];
		var statuswidget = widgets['status'];
		if (savewidget) {
			savewidget.activateSave = function(t) {
				if (this.statuswidget)
					this.statuswidget.innerHTML = '';
				savewidget.disabled = false;
				if (savewidget.cancelwidget) {
					savewidget.cancelwidget.disabled = false;
				}
			};
			savewidget.disabled = true;
			if (cancelwidget) {
				savewidget.cancelwidget = cancelwidget;
				cancelwidget.disabled = true;
			}
		}
		for (var x in widgets) { if( widgets.hasOwnProperty(x) ){
			var src;
			if ((x == 'save') || (x == 'cancel') || (x == 'new') || (x == 'newitem') || (x == 'status') || (x == 'delete'))
				continue;
			if (widgets[x].name)
				src = widgets[x].name;
			else
				src = x;
			if (!widgets[x])
				continue;
			if (widgets[x].options) {
				var all;
				if (!cat) {
					if (widgets[x].options[0])
						thevalue = widgets[x].options[0].value;
					else
						thevalue = '';
				} else if (cat.fieldbyname) { 
					if (cat.fieldbyname[src])
						thevalue = cat.fieldbyname[src];
				} else if (cat[x])
					thevalue = cat[x];
				if (widgets[x].splitchar) {
					for (var z=0;z<widgets[x].options.length;z++)
						widgets[x].options[z].selected = false;
					if (thevalue) {
						all = thevalue.split(widgets[x].splitchar);
						for (var y=0;y<all.length;y++) {
							for (var z=0;z<widgets[x].options.length;z++) {
								if (widgets[x].options[z].value == all[y])
									widgets[x].options[z].selected = true;
							}
						}
					}
				} else {
					widgets[x].selectedIndex = -1;
					widgets[x].value = thevalue;
				}
				
				if (cat)
					widgets[x].disabled = false;
				else
					widgets[x].disabled = true;

				if (savewidget) {
					widgets[x].savewidget = savewidget;
					widgets[x].statuswidget = statuswidget;
					widgets[x].onclick = function() {
						this.oldvalue = this.value;
						return true;
					}
					widgets[x].onchange = function() {
						this.savewidget.activateSave();
						if (this.altonchange)
							this.altonchange();
					}
				}
				if (widgets[x].altonchange)
					widgets[x].altonchange();

			} else if (widgets[x].type) {
				if (!cat) {
					thevalue = '';
				} else if (x == 'name')
					thevalue = cat.name;
				else if (cat.fieldbyname) { 
					if (cat.fieldbyname[src])
						thevalue = cat.fieldbyname[src];
					else
						thevalue='';
				} else if (cat[x])
					thevalue = cat[x];
				else
					thevalue = '';
				if (widgets[x].type == 'checkbox') {
					dfalt = widgets[x].getAttribute('dfalt');
					if( dfalt && thevalue=='' )
							widgets[x].checked = ast_true(dfalt);
					else 
							widgets[x].checked = ast_true(thevalue);
				} else if (widgets[x].type == 'radio') {
					if (widgets[x].value == thevalue)
						widgets[x].checked = true;
					else
						widgets[x].checked = false;
				} else{
					dfalt = widgets[x].getAttribute('dfalt');
					if( dfalt && thevalue=='' )
						widgets[x].value = dfalt;
					else 
						widgets[x].value = thevalue;
				}

				if (cat)
					widgets[x].disabled = false;
				else
					widgets[x].disabled = true;

				if (savewidget) {
					widgets[x].savewidget = savewidget;
					widgets[x].statuswidget = statuswidget;
					if ((widgets[x].type == 'checkbox') || (widgets[x].type == 'radio')) {
						widgets[x].onclick = function() {
							this.savewidget.activateSave();
							if (this.altonclick)
								this.altonclick();
						}
						if (widgets[x].altonclick)
							widgets[x].altonclick();
					} else {
						widgets[x].onkeydown = function() {
							this.oldvalue = this.value;
							return true;
						}
						widgets[x].onkeyup = function(event) {
							if (this.oldvalue == this.value){return true;}
							pattern = this.getAttribute('pattern');
							if (pattern && check_pattern(pattern, this.oldvalue) && !check_pattern(pattern, this.value)) {
								this.value = this.oldvalue;
								if (widgets['status']) 
									widgets['status'].innerHTML = "<font size='-1' color=red>Invalid Character !</font>";
							} else{
								if (widgets['status']) 
									widgets['status'].innerHTML = "";
								this.savewidget.activateSave();
							}
							return true;
						}
					}
				}
			} else if (widgets[x].src != null) {
				if (!cat) {
					thevalue = '';
				} else if (x == 'name')
					thevalue = cat.name;
				else if (cat.fieldbyname) { 
					if (cat.fieldbyname[src])
						thevalue = cat.fieldbyname[src];
					else
						thevalue='';
				} else if (cat[x])
					thevalue = cat[x];
				else
					thevalue = '';
				if (thevalue.length) {
					widgets[x].src = thevalue;
					widgets[x].style.visibility = 'inherit';
				} else 
					widgets[x].style.visibility = 'hidden';
			} else if (widgets[x].innerHTML != null) {
				if (!cat) {
					thevalue = '';
				} else if (x == 'name')
					thevalue = cat.name;
				else if (cat.fieldbyname) { 
					if (cat.fieldbyname[src])
						thevalue = cat.fieldbyname[src];
					else
						thevalue='';
				} else if (cat[x])
					thevalue = cat[x];
				else
					thevalue = '';
				widgets[x].innerHTML = thevalue;
			}
		}}
		if (widgets['status']) 
			widgets['status'].innerHTML = "";
	};
	this.doConfig = function(t, box) {
		if( t[0].headers['message'] && t[0].headers['message'] == "Config file not found" ){
			if( box.config_file == "zapscan.conf" || box.config_file == "contactinfo.conf" || box.config_file == "jingle.conf" || box.config_file == "providers.conf" ){
				parent.astmanEngine.run_tool("/bin/touch /etc/asterisk/"+box.config_file, function(){ window.location.href = window.location.href ; } );
				return ;
			} else {
				alert( "Asterisk says it cannot find a required config file (" + box.config_file + ") \n You will be now redirected to the main page !" );
				parent.window.location.href = parent.window.location.href ;
				return ;
			}
		}
		var x,y=0;
		var cfg = new Object;
		var map;
		var curcat;
		var catcnt = -1;
		var tmp, tmp2;
		var res;

		box.innerHTML = '';
		cfg.categories = new Array;
		cfg.catbyname = { };
		cfg.names = new Array;
		for (x=0;t[0].names[x];x++) {
			map = t[0].names[x].split('-');
			if (map[0] == 'category') {
				catcnt++;
				cfg.names[catcnt] = t[0].headers[t[0].names[x]];

				cfg.categories[catcnt] = new Object;
				cfg.categories[catcnt].fields = new Array;
				cfg.categories[catcnt].fieldbyname = { };
				cfg.categories[catcnt].names = new Array;
				cfg.categories[catcnt].subfields = new Array;
				cfg.categories[catcnt].name = t[0].headers[t[0].names[x]];
				cfg.catbyname[t[0].headers[t[0].names[x]]] = cfg.categories[catcnt];

				y=0;
			} else if (map[0] == 'line') {
				if (catcnt >= 0) {
					tmp = t[0].headers[t[0].names[x]].split('=');
					tmp2 = t[0].headers[t[0].names[x]].split('=');
					tmp2.splice(0,1);
					tmp[1] = tmp2.join('=');
					cfg.categories[catcnt].fields[y] = tmp[1];
					cfg.categories[catcnt].names[y] = tmp[0];
					cfg.categories[catcnt].fieldbyname[tmp[0]] = tmp[1];
					y++;
				}
			}
		}

		cfg.catcnt = catcnt + 1;
		box.stored_config = cfg;

		update_box(box);
		if (box.size == 1)
			box.selectedIndex = 0;
		if (box.callbacks.loaded)
			box.callbacks.loaded();
	};
	this.managerResponse = function(t) {
		me.parseResponse(t, me.callback);
	};
	this.doEvents = function(msgs) {
		me.eventcallback(msgs);
	};
	this.eventResponse = function(t) {
		if( t.responseText.match("Message: Authentication Required") ){		
				parent.window.location.href = parent.window.location.href ;
		}
		var _nu = navigator.userAgent; 
		if( _nu.indexOf("MSIE") != -1 || _nu.indexOf("Konqueror") != -1 || _nu.indexOf("Safari") != -1 || _nu.indexOf("Opera") != -1){
			// Donot Poll events for non mozilla Browsers			
		}else{ 
			me.parseResponse(t, me.doEvents);
		}
	};
	this.gotConfig = function(t, box) {
		me.parseResponse(t, me.doConfig, box);
	};
	this.sendRequest = function(request, callback) {
		var tmp;
		var opt = {
			method: 'get',
			asynchronous: true,
			onSuccess: this.managerResponse,
			onFailure: function(t) {
				gui_alert("Error: " + t.status + ": " + t.statusText);
			}
		};
		me.callback = callback;
		opt.parameters = request;
		tmp = new Ajax.Request(this.url, opt);
	};
	this.pollEvents = function() {
		var tmp;
		var opt = {
			method: 'get',
			asynchronous: true,
			onSuccess: this.eventResponse,
			onFailure: function(t) {
				gui_alert("Event Error: " + t.status + ": " + t.statusText);
			}
		};
		opt.parameters="action=waitevent";
		tmp = new Ajax.Request(this.url, opt);
	};

	this.config2list = function(config,box,widgets,callbacks) {
		var tmp;
		var opt = {
			method: 'get',
			asynchronous: true,
			onSuccess: function(t) {
				me.gotConfig(t, box);
			},
			onFailure: function(t) {
				gui_alert("Config Error: " + t.status + ": " + t.statusText);
			}
		};
		if (!callbacks.identifier)
			callbacks.identifier = "name";
		opt.parameters = "action=getconfig&filename=" + encodeURIComponent(config);
		box.config_file = config;
		box.callbacks = callbacks;
		box.widgets = widgets;
		box.engine = me;
		box.oldselect = -1;
		box.selectitem = function(t) {
			box.selectedIndex = t;
			return select_item(this);
		}
		box.onchange = function() {
			return select_item(this)
		};
		if (widgets['save']) {
			widgets['save'].hostselectbox = box;
			widgets['save'].onclick = function() {
				save_item(this.hostselectbox);
			}
		}
		if (widgets['cancel']) {
			widgets['cancel'].hostselectbox = box;
			widgets['cancel'].onclick = function() {
				cancel_item(this.hostselectbox);
			}
		}
		if (widgets['new']) {
			widgets['new'].hostselectbox = box;
			widgets['new'].disabled = false;
			widgets['new'].onclick = function() {
				new_item(this.hostselectbox);
			}
		}
		if (widgets['newitem']) {
			widgets['newitem'].hostselectbox = box;
			widgets['newitem'].disabled = false;
			widgets['newitem'].onclick = function() {
				new_subitem(this.hostselectbox);
			}
		}
		if (widgets['delete']) {
			widgets['delete'].hostselectbox = box;
			widgets['delete'].disabled = true;
			widgets['delete'].onclick = function() {
				delete_item(this.hostselectbox);
			}
		}
		if (widgets['status']) {
			widgets['status'].disabled = false;
		}
		
		tmp = new Ajax.Request(this.url, opt);
	};

};

/* Extension handling below */
	var specialcontext = "default";

	Special = Class.create();
	Special.prototype = {
		initialize: function(name, macro, label) {
			this.name = name;
			this.macro = macro;
			this.label = label;
		}
	};
	
	Extension = Class.create();
	Extension.prototype = {
		initialize: function(priority, label, app, appdata) {
			this.priority = priority;
			this.label = label;
			this.app = app;
			this.appdata = appdata;
		}
	}
	
	specials = new Array;
	specials.push(
		new Special("VoiceMailMain", null, "Check Voicemail"),
		new Special("MeetMe", null, "Conference Bridge"),
		new Special("Queue", null, "Call Queue")
	);

	function app2label(app) {
		var appo;
		if ((appo = findapp(app)))
			return appo.label;
		return "Custom";
	};
	
	function findapp(app) {
		for (x=0;x<specials.length;x++) {
			if (specials[x].name.toLowerCase() == app.toLowerCase())
				return specials[x];
		}
		return null;
	}
	
	function format_extension(box, t, x, multipriority) {
		var tmp;
		var exten, app, rest, args, label, priority;
		if ((t.names[x] != 'exten'))
			return null;
		tmp = t.fields[x].split(',');
		priority = tmp[1];

		// if it is a Voicemenu alias .. return "extension -- Voicemenu"
		if ( tmp[2].match("Goto") && tmp[2].match("voicemenu-custom-" )  ){
			t.subfields[x]['context'] = t.name;
			t.subfields[x]['name'] = tmp[0];
			t.subfields[x]['app'] = "Goto";
			t.subfields[x]['label'] = "Voice Menu";
			t.subfields[x]['args'] = "";
			t.subfields[x]['priority'] = priority;

			box.calcname = tmp[0];
			box.calccontext = t.name;
			box.calcpriority = priority;
			if( sortbynames ){
				return " Voice Menu ("  + tmp[0] + ")" ;
			}else{
				return tmp[0] + " -- Voice Menu"  ;
			}
		}
		//

		if (!multipriority && (tmp[1] != '1'))
			return null;
		exten = tmp[0];
		tmp.splice(0,2);
		rest = tmp.join(',');
		tmp = rest.split('(');
		if (!tmp[0])
			return null;
		app = tmp[0];
		label = app2label(app);
		tmp.splice(0,1);
		args = tmp.join('(');
		
		tmp = args.split(')');
		if ((tmp.length > 1) && (!tmp[tmp.length-1].length))
			tmp.splice(tmp.length-1, 1);
		args = tmp.join(')');
		
		t.subfields[x]['context'] = t.name;
		t.subfields[x]['name'] = exten;
		t.subfields[x]['app'] = app;
		t.subfields[x]['label'] = label;
		t.subfields[x]['args'] = args;
		t.subfields[x]['priority'] = priority;
		
		if (priority == 'n') {
			if ((box.calcname == exten) && (box.calccontext == t.name))
				box.calcpriority++;
			else
				box.calcpriority = 1;
		}else if(priority != 's'){
			box.calcpriority = priority;
		}
		t.subfields[x]['realpriority'] = box.calcpriority;
		box.calcname = exten;
		box.calccontext = t.name;
		if( sortbynames ){
			return label+" ("  + exten + ")" ;
		}else{
			return exten + " -- " + label;
		}
	}	

function merge_users(e, u) { // read u and add into e according to sort order
	merge_extensions(e, u);
}

function merge_extensions(u, e) { // read e and add into u according to sort order
	var t = e.options.length ;
	for( var f =0 ; f < t ; f++ ){
		// take each element in e
		var opt_new = e.ownerDocument.createElement('option');
		opt_new.text = e.options[f].text ;
		opt_new.value = 'reserved';
		//if( navigator.userAgent.indexOf("Firefox") != -1 ){ opt_new.disabled = true; }
		opt_new.style.color = "#ABABAB";

		// Now decide where to add in u, and add it to u
		var add = 0;
		for ( var g=0; g < u.options.length  ; g++) {
			if(	opt_new.text < u.options[g].text  ){ // add before this element in u 
				add = 1;
				try{
					u.add(opt_new, u.options[g]);
					break;
				}catch(err){
					u.add(opt_new, g);
					break;
				}
			}
		}
		if ( add ==0 ){ try{ u.add(opt_new, null); } catch(err){ u.add(opt_new); }}
	}
}

astmanEngine = new Astman();