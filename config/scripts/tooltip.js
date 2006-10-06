

var lang = 'en';
var tooltips = new Object;

function show_tooltip(lang, file,tip){
	$('tooltip').innerHTML = 	tooltips[file][lang][tip];
}


//	Tooltips for users.html in english
	tooltips['users']= new Object;
	tooltips['users'] .en = new Array;

	tooltips['users'] .en[0] = "<BR><B>Extension:</B> The numbered extension, i.e. 1234, that will be associated with this particular User / Phone." ;  //Extension
	tooltips['users'] .en[1] = "<BR><B>Name:</B> A character-based name for this user, i.e. \"Bob Jones\" " ;  //Name
	tooltips['users'] .en[2] = "<BR><B>Password:</B> The password for this user or Phone, i.e. \"1234\" " ; //Password
	tooltips['users'] .en[3] = "<BR><B>E-Mail:</B> The e-mail address for this user, i.e. \"bobjones@bobjones.null\"";  //E-mail
	tooltips['users'] .en[4] = "<BR><B>Caller ID:</B> The Caller ID (CID) string used when this user calls another user or number, i.e. \"800-555-1234\" "; //Caller ID
	tooltips['users'] .en[5] = "<BR><B>Analog Phone:</B> If this user is attached to an analog port on the system, please choose the port number here.";  //Analog Phone
	tooltips['users'] .en[6] = "<BR><B>Calling Rule:</B> Please choose the Calling Rule plan for this user as defined under the \"Calling Rules\" option to the left."; //Calling Rules
	tooltips['users'] .en[7] = "<BR>Advanced User and Phone options."; //Advanced
	tooltips['users'] .en[8] = "<BR><B>Voicemail:</B> Check this box if the user should have a voicemail account."; //Voicemail
	tooltips['users'] .en[9] = "<BR><B>In Directory:</B> Check this option if the user is to be listed in the telephone directory."; //In Directory
	tooltips['users'] .en[10] = "<BR><B>Session Initiation Protocol</B> Check this option if the User or Phone is using SIP or is a SIP device."; //SIP
	tooltips['users'] .en[11] = "<BR><B>InterAsterisk eXchange Protocol:</B> Check this option if the User or Phone is using IAX or is an IAX device.";  //IAX
	tooltips['users'] .en[12] = "<BR><B>Computer Telephony Integration:</B> Check this option if the user is allowed to connect client applications to the Asterisk server."; //CTI:
	tooltips['users'] .en[13] = "<BR><B>Call Waiting:</B> Check this option if the User or Phone should have Call-Waiting capability."; //Call Waiting
	tooltips['users'] .en[14] = "<BR><B>3-Way Calling:</B>Check this option if the User or Phone should have 3-Way Calling capability."; //3-Way Calling:
	tooltips['users'] .en[15] = "<BR><B>Is Agent:</B> Check this option if this User or Phone is an Call Queue Member (Agent)"; //Is Agent:

// Tooltips for Conferencing (meetme)
	tooltips['meetme']= new Object;
	tooltips['meetme'] .en = new Array;

	tooltips['meetme'] .en[0] = "<BR><B>Extension:</B> This is the number dialed to reach this Conference Bridge.";  //Extension:
	tooltips['meetme'] .en[1] = "<BR><B>Personal Identification Number:</B> Defining this option, i.e. \"1234\" sets a code that must be entered in order to access the Conference Bridge."; // Personal Identification Number
	tooltips['meetme'] .en[2] = "<BR><B>Administrator PIN Code:</B> Defining this option sets a PIN for Conference Administrators."; // Administrator PIN Code
	tooltips['meetme'] .en[3] = "<BR><B>Play Hold Music for First Caller:</B> Checking this option causes Asterisk to play Hold Music to the first user in a conference, until another user has joined the same conference.";
	tooltips['meetme'] .en[4] = "<BR><B>Enable Caller Menu:</B> Checking this option allows a user to access the Conference Bridge menu by pressing the * \"Asterisk\" key on their dialpad.";
	tooltips['meetme'] .en[5] = "<BR><B>Announce Callers:</B> Checking this option announces, to all Bridge participants, the joining of any other participants.";
	tooltips['meetme'] .en[6] = "<BR><B>Advanced:</B> Advanced Conference Bridge configuration options.";
	tooltips['meetme'] .en[7] = "<BR><B>Room Override:</B> This option allows the entry of a secondary extension that may be used to access this Conference Bridge. This is useful in the event that one wants to set a separate extension, having different options, to access the same Bridge.";
	tooltips['meetme'] .en[8] = "<BR><B>Quiet Mode:</B> This option enables Quiet mode.  If this option is checked, all users entering this conference will be marked as quiet, and will be in Listen-Only mode.";
	tooltips['meetme'] .en[9] = "<BR><B>Wait for Market User:</B> If this option is set, then users joining the conference will not be able to speak to one-another until the marked user has joined the conference.";
	tooltips['meetme'] .en[10] = "<BR><B>Set Marked User:</B> This option sets the person that enters the bridge using this extension as Marked.  This option works in conjunction with the obove \"Wait for marked user\" option.";

// Tooltips for Voicemail
	tooltips['voicemail']= new Object;
	tooltips['voicemail'] .en = new Array;

	tooltips['voicemail'] .en[0] = "<BR><B>Extension for checking Message:</B>This option, i.e. \"2345,\" defines the extension that Users call in order to access their voicemail accounts.";
	tooltips['voicemail'] .en[1] = "<BR><B>Attach recording to e-mail:</B> This option defines whether or not voicemails are sent to the Users' e-mail addresses as attachments.";
	tooltips['voicemail'] .en[2] = "<BR><B>Say Message Caller-ID:</B> If this option is enabled, the Caller ID of the party that left the message will be played back before the voicemail message begins playing back.";
	tooltips['voicemail'] .en[3] = "<BR><B>Say Message Duration:</B> If this optino is set, the duration of the message will be played back before the voicemail message begins playing back.";
	tooltips['voicemail'] .en[4] = "<BR><B>Send messages by e-mail only:</B> If this option is set, then voicemails will not be checkable using a Phone.  Messages will be sent via e-mail, only.";
	tooltips['voicemail'] .en[5] = "<BR><B>Maximum messages per folder:</B> This select box sets the maximum number of messages that a user may have in any of their folders.";
	tooltips['voicemail'] .en[6] = "<BR><B>Maximum Message Time:</B> This select box sets the maximum duration of a voicemail message. Message recording will not occur for times greater than this amount.";
	tooltips['voicemail'] .en[7] = "<BR><B>Minimum message Time:</B> This select box sets the minimum duration of a voicemail message. Messages below this threshold will be automatically deleted.";
	tooltips['voicemail'] .en[8] = "<BR><B>Advanced:</B> Advanced Voicemail configuration options.";
	tooltips['voicemail'] .en[9] = "<BR><B>Dail 'O' for Operator:</B> Checking this option enables callers entering the voicemail application to dial '0' to back out of the application and be sent to a voicemenu or operator.";
	tooltips['voicemail'] .en[10] = "<BR><B>Message Format:</B> This selection box controls the format in which messages are stored on the system and delivered by e-mail.";
	tooltips['voicemail'] .en[11] = "<BR><B>Allow Users to Review:</B> Checking this option allows the caller leaving the voicemail the opportunity to review their recorded message before it is submitted as a voicemail message.";
	tooltips['voicemail'] .en[12] = "<BR><B>Play Envelope:</B> Selecting this option causes Asterisk not to play introductions about each message when accessing them from the voicemail application.";
	tooltips['voicemail'] .en[13] = "<BR><B> Max Greeting:</B> Defining this option sets a maximum time for a users's voicemail away message.";

// Tooltips for CallQueues (queues)
	tooltips['queues']= new Object;
	tooltips['queues'].en = new Array;

	tooltips['queues'].en[0] = "<BR><B>Queue:</B> This option defines the numbered extension that may be dialed to reach this Queue.";
	tooltips['queues'].en[1] = "<BR><B>Full Name:</B> This option defines a name for this Queue, i.e. \"Sales\"";
	tooltips['queues'].en[2] = "<BR><B>Strategy:</B>This option sets the Ringing Strategy for this Queue.  The options are:<BR> RingAll - Ring All available Agents until one answers.<BR> RoundRobin - Take turns ringing each available Agent<BR> LeastRecent - Ring the Agent which was least recently called<BR> FewestCalls - Ring the Agent with the fewest completed calls<BR> Random - Ring a Random Agent<BR> RRmemory - RoundRobin with Memory, Rembers where it left off in the last ring pass<BR>";
	tooltips['queues'].en[3] = "<BR><B>Agents:</B> This selection shows all Users defined as Agents in their User conf.  Checking a User here makes them a member of the current Queue.";
	tooltips['queues'].en[4] = "<BR><B>Advanced:</B> Advanced Queue Configuration Options";
	tooltips['queues'].en[5] = "<BR><B>Timeout:</B> This option defines the time in seconds that an Agent's phone rings before the next Agent is rung, i.e. \"15\" ";
	tooltips['queues'].en[6] = "<BR><B>Wraup Time:</B> After a successful call, time time in seconds that an Agent remains free before another call is sent to them. Default is 0, which is No Delay.";
	tooltips['queues'].en[7] = "<BR><B>AutoFill</B> Defining this option causes the Queue, when multiple calls are in it at the same time, to push them to Agents simultaneously.  Thus, instead of completing one call to an Agent at a time, the Queue will complete as many calls simultaneously to the available Agents.";
	tooltips['queues'].en[8] = "<BR><B> AutoPause:</B> Enabling this option pauses an Agent if they fail to answer a call.";
	tooltips['queues'].en[9] = "<BR><B> MaxLen:</B> This option sets the maximum number of callers that may wait in a Queue. Default is 0, Unlimited.";
	tooltips['queues'].en[10] = "<BR><B> JoinEmpty:</B> Defining this option allows callers to enter the Queue when no Agents are available. If this option is not defined, callers will not be able to enter Queues with no available agents.";
	tooltips['queues'].en[11] = "<BR><B>LeaveWhenEmpty:</B> Defining this option forces all callers to exit the Queue if New Callers are also not able to Enter the Queue. This option should generally be set in concert with the JoinEmpty option.";
	tooltips['queues'].en[12] = "<BR><B> Report Hold Time:</B> Enabling this option causes Asterisk to report, to the Agent, the hold time of the caller before the caller is connected to the Agent.";
