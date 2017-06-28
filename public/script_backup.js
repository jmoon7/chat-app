
'use strict';

/*
/* TODO:
/* Build functions outside of the document.ready call.
/* Pass in arguments in parameters to access variables.
/* "jQuery ready method should be used only when it's really needed, 
/*  it means when you *really have to wait for the DOM to be ready"


/* Authentication
/* to implement database rules, read/write premission etc.
/*

/* Other's message is on the right side. Probably needs token id?
/*

/* When message is written on another chat, make a badge and increase counter. (bug)
/*

/* Mobile view 

/* ------------------------------------------ */

$(document).ready(function() {

	// Check the version
	console.log("new version3");

	// Initialize Firebase.
	var database = firebase.database();
	var storage = firebase.storage();

	/* --- Variables --- */
	// Reference to chatrooms
	var chatroomRef = database.ref('chatrooms');
	// Reference to messages of a chatroom
	var currentChatRef;
	// Key of chatroom.
	var currentKey;
	var testState = 0;
	var testNumChatrooms = 30;


	/* --- Listeners --- */
	$("#addchat").click(bringPopup);
	$("#popupclose").click(closePopup);
	$("#popupform").submit(addChat);
	$("#inputtext").click(inputAnimate);
	$("#inputform").submit(submitMessage);
	$("#submit").click(submitMessage);
	$("td").click(goToChat);

	loadChatrooms();

/* ------------ Listeners and Functions ------------ */

	// Click anywhere outside of input text to animate pink line
	$(document).click(function(event) { 
	    if(!$(event.target).closest('#inputtext').length) {
	        if(testState) {
	        	inputAnimate();
	        }
	    }
	    /* TODO :::: Click outside popup to close it

	    if(!$(event.target).closest('#popuptext').length) {
	        closePopup();
	    }
	    */
	});

	function bringPopup() {
		$("#popupcontainer").fadeTo(200, 1);
		$("#popupcontainer").removeClass("invisible");	
		$("#popuptext").focus();
	}

	function closePopup() {
		$("#popupcontainer").fadeTo(200, 0);
		$("#popupcontainer").addClass("invisible");	
	}

	// Add a chatroom. Called by #popupform.
	function addChat(e) {
		e.preventDefault();

		var name = $("#popuptext").val();
		if (name) {
			// Clear text field
			$("#popuptext").val("");
			/* Create a chatroom in the database. 
			   child_changed gets called and adds <td> automatically */
			chatroomRef.push({
				name: name,
				created: Date.now()
			});
			// Close popup
			closePopup();
		}
	}

	// Animate the inputtext line. Called by #inputtext and document.
	function inputAnimate() {
		if (testState === 0) {
			$("#inputLine").animate({
				width: "100%"
			}, 150, "swing");
			testState = 1;
		} else {
			$("#inputLine").animate({
				width: "0%"
			}, 150, "swing");
			testState = 0;
		}
	}

	// submit the input text. called by #inputform and #submit
	function submitMessage(e) {
		e.preventDefault();
		var text = $("#inputtext").val();
		$("#inputtext").val("");
		if (currentChatRef) {
			// Push the message to the chatroom. Calls currentChatRef child_added listener
			// this triggers both addChatlobby and setChatroom's child_added.......
			currentChatRef.push(text);
		}
	}

	// go to the selected chatroom. called by <td> listener.
	function goToChat() {
		if (currentKey !== this.id) {
			// Move the boldness + highlight. Remove badge
			$("#" + currentKey).removeClass("chatnamebold");
			$("#" + this.id + " " + ".badge").remove();
			$("#" + this.id).addClass("chatnamebold");
			currentKey = this.id;
			currentChatRef = database.ref('chatrooms/' + currentKey + '/messages');
			loadMessages();
			console.log
			$("#inputtext").focus();
        	// inputAnimate();
		}
	}

/* ---------------- Firebase calls ---------------- */

	// Load the chatrooms. Called by document

	// **** Handle submitMessage here? it listens to all descendents, not just a particular
	// chatroom's children.
	function loadChatrooms() {
		// Remove previous listeners
		chatroomRef.off();
		
		var addChatlobby = function(data) {
			console.log("lob");
		    // data is the chatroom folder. val are the individual chatrooms (with name, created)
	    	var val = data.val();
			var container = document.createElement('tr');
			container.innerHTML = "<td id=" + data.key + ">" + val.name + "</td>";
			$("tbody").prepend(container);
			// add listener to chatroom button
			$("#" + data.key).click(goToChat);
		};

		var changeChat = function(data) {
			console.log("changed");
		}
		/* Child add listener. Limited to testNumChatrooms (30) chatrooms
		 * Called when 1. page is loaded (document), 2. chat is added (addChat) */
		chatroomRef.limitToLast(testNumChatrooms).on('child_added', addChatlobby);
		// chatroomRef.limitToLast(testNumChatrooms).on('child_changed', addChatlobby);

	}

	// Load messages. Called by gotoChat.
	function loadMessages() {
		// Erase messages from other chat
		$("#messages").empty();

		// Remove previous listeners
		currentChatRef.off();
		var setChatroom = function(data) {
			var chatroomOfMessage = data.ref.parent.parent;

			/* If another sends a message, and the message's chatrooms' key is different. 
			   gotoChat can't trigger because it sets the currentKey beforehand*/
			if (chatroomOfMessage.key !== currentKey) {
				/* TODO::::: fix this weird bug ^^^ setChatroom is not called.
				 ::::::::: So the user receiving the notification needs to have visited that chatroom before.
				 ::::::::: I think what's happening is before calling loadMessages(), the messages dont have
						   listeners on them. So before accessing the other chat, the user won't know what is happening
						   to the messages in the other chat since they are not listening.
						   A better way may be using child_changed on chatroomRef.
				 ::::::::: But also, we want this notification to stay in the database. (Refreshing resets)
				*/
				console.log("TEST");
				console.log(chatroomOfMessage.key);
				// Find the <tr> element and replace text. Remember, this only updates for the current user.
				var existingText = $("#" + chatroomOfMessage.key).text();
				console.log(existingText);
				// Add badge to the triggered chatroom.
				$("#" + chatroomOfMessage.key).html(existingText + "<span class='badge'>1</span>");
			}
		    // data is the message folder. val is the message.
	    	var val = data.val();
			var container = document.createElement('h4');
			container.innerHTML = "<span class='label label-default'>" + val + "</span>";
			$("#messages").append(container); 
			// Scroll to bottom
			var msgs = $("#messages");
			msgs.scrollTop(msgs.prop("scrollHeight"));
		};

		/* Child add/change listeners. Limited to 30 messages
		 * Called when 1. chatroom is clicked (gotoChat), 2. message is submitted (submitMessage) */
		currentChatRef.limitToLast(30).on('child_added', setChatroom);
	}
});
