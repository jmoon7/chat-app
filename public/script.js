
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
	// Unread messages. Dictionary.
	// TODO::: Push the dictionary with unique token ID.
	var unread = {};
	// Test variables. subject to change
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
		if (name && name.length < 40) {
			// Clear text field
			$("#popuptext").val("");
			/* Create a chatroom in the database. 
			   child_changed gets called and adds <td> automatically */
			var newChatroom = chatroomRef.push({
				name: name,
				created: Date.now()
			});
			// Close popup
			closePopup();
		} else {
			alert("No input or Too long");
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
			currentChatRef.push(text);
		}
	}

	// go to the selected chatroom. called by <td> listener.
	function goToChat() {
		if (currentKey !== this.id) {
			// Move the boldness + highlight. Remove badge
			$("#" + currentKey).removeClass("chatnamebold");
			$("#" + this.id + " " + ".badge").remove();
			unread[this.id] = 0;
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
	function loadChatrooms() {
		// Remove previous listeners
		chatroomRef.off();
		
		var addChatlobby = function(data) {
		    // data is the chatroom folder. val are the individual chatrooms (with name, created)
	    	var val = data.val();
			var container = document.createElement('tr');
			container.innerHTML = "<td id=" + data.key + ">" + val.name + "</td>";
			$("tbody").prepend(container);
			// add listener to chatroom button
			$("#" + data.key).click(goToChat);
			// click the new chatroom and scroll top
			// BUG::: this is triggered in every user. Only the current user should trigger it
			$("#" + data.key).trigger("click");
			var msgs = $("#chatlobby");
			msgs.scrollTop(0);
			
		};

		var addBadge = function(data) {
			if (data.key !== currentKey) {
				if (!unread[data.key]) {
					unread[data.key] = 0; 
				}
				unread[data.key]++;
				// Find the <tr> element and replace text. Remember, this only updates for the current user.
				var existingText = data.val().name;
				console.log(existingText);
				// Add badge to the triggered chatroom.
				$("#" + data.key).html(existingText + "<span class='badge'>" + unread[data.key] + "</span>");
			}
		};
		/* When page loads, 30 chatroom listeners are added and called.
		 * Every addChat call, child_added will fire addChatlobby
		 * Every submitMessage call, child_changed will fire addBadge */
		chatroomRef.limitToLast(testNumChatrooms).on('child_added', addChatlobby);
		chatroomRef.limitToLast(testNumChatrooms).on('child_changed', addBadge);

	}

	// Load messages. Called by gotoChat.
	function loadMessages() {
		// Erase messages from other chat
		$("#messages").empty();

		// Remove previous listeners
		currentChatRef.off();

		var setChatroom = function(data) {
			var chatroomOfMessage = data.ref.parent.parent;
			if (chatroomOfMessage.key === currentKey) {
			    // data is the message folder. val is the message.
		    	var val = data.val();
				var container = document.createElement('h4');
				container.innerHTML = "<span class='label label-default'>" + val + "</span>";
				$("#messages").append(container); 
				// Scroll to bottom
				var msgs = $("#messages");
				msgs.scrollTop(msgs.prop("scrollHeight"));
			}
		};
		/* Child add/change listeners. Limited to 30 messages
		 * Called when 1. chatroom is clicked (gotoChat), 2. message is submitted (submitMessage) */
		currentChatRef.limitToLast(30).on('child_added', setChatroom);
	}

});
