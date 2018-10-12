// Room statuses ['initiated', 'offered', 'connected' , 'closed']

const appURL = () => {
	const protocol = 'http'+((location.hostname == 'localhost') ? '' : 's')+'://';
	return protocol+location.hostname + ((location.hostname == 'localhost') ? ':3000' : '') +'/'; 
}
const randomName = () => Math.random().toString(36).substr(2, 6);
const getRoomName = () => {
	let roomName = location.pathname.substring(1);
	if(roomName == '') {
		roomName = randomName();
		const newurl = appURL() + roomName;
		window.history.pushState({url: newurl}, roomName, newurl);
	}
	return roomName;
}
getRoomName();

if(!window.sessionStorage.type){
	console.log('----');
	window.sessionStorage.type = "hello";
}else{
	console.log(window.sessionStorage.type);
}
const peerConfig = {
	'iceServers': [
		{'urls': 'stun:stun.l.google.com:19302'},
		{'urls': 'stun:stun.stunprotocol.org:3478'},
		{'urls': 'stun:stun.sipnet.net:3478'},
		{'urls': 'stun:stun.ideasip.com:3478'},
		{'urls': 'stun:stun.iptel.org:3478'}
	]
};
let peerConnection, signalChannel, msgChannel, localStream, signal, isPeer;
const remoteMessage = {sdp: null, ice: []};
const isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);

const onGetUserMediaSuccess = (stream) => document.getElementById('selfVideo').srcObject = stream;
const errorHandler = (error) => console.error(error);

if(navigator.mediaDevices.getUserMedia) {
	navigator.mediaDevices.getUserMedia({
		video: true,
		audio: true
	})
	.then((stream) => {
		localStream = stream;
		onGetUserMediaSuccess(stream);
		startApp();
	})
	.catch(errorHandler);
} else {
	alert('Your browser does not support getUserMedia API');
}
const signalMsgHandler = async event => {
	signal = JSON.parse(event.data);
	isPeer && peerConnection.addStream(localStream);
	await setPeerDescription(signal);
	await setPeerIceCandidates(signal);
}
const msgHandler = event => addChat(event.data, false);

const setUpPeerConnection = () => {
	peerConnection = new RTCPeerConnection(peerConfig);
	peerConnection.addStream(localStream);
	peerConnection.onicecandidate = (event) => {
		if(event.candidate != null) remoteMessage.ice.push(event.candidate);
		else {
			// Completed the gathering of ICE candidate.
			if(signalChannel){
				if(signalChannel.readyState === 'open'){
					signalChannel.send(JSON.stringify(remoteMessage));
					return;
				}
			}
			fetch('/push/'+getRoomName(), {
				method: "POST",
				body: JSON.stringify({type: 'offer', data: remoteMessage}),
				headers: { "Content-type": "application/json"}
			}).then(console.log).catch(console.error);
			// const signalHash = LZString.compressToBase64(JSON.stringify(remoteMessage));

			// if(isPeer){
			// 	document.getElementById('copyMessage').value = signalHash;
			// 	document.querySelector('#step1 .desc').innerHTML = "<i>Copy the below message and share it with your peer.</i>";
			// 	document.getElementById('step1').style.display = 'block';
			// }else{
			// 	document.getElementById('copyMessage').value = window.location.href+'#'+signalHash;                
			// 	document.getElementById('step1').style.display = 'block';
			// 	document.getElementById('step2').style.display = 'block';
			// }
		}
	}
	peerConnection.ontrack = (event) => {
		console.log(event.streams[0]);
		// document.getElementById('peerVideo').srcObject = event.streams[0];
		// document.getElementById('blanket').style.display = 'none';
	};
}
const addStream = (stream) => peerConnection.addStream(stream);
const createOffer = async () => {
	const description = await peerConnection.createOffer({offerToReceiveAudio: 1, OfferToReceiveVideo: 1});
	await setLocalDescription(description);
}

const setLocalDescription = async (description) => {
	await peerConnection.setLocalDescription(description);
	remoteMessage.sdp = peerConnection.localDescription;
};

const setPeerDescription = async (signal) => {
	await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
	// Only create answers in response to offers
	if(signal.sdp.type == 'offer') {
		const description = await peerConnection.createAnswer();
		isSafari && setTimeout(() => peerConnection.onicecandidate({candidate: null}), 1000);
		await setLocalDescription(description);
	}
};

const setPeerIceCandidates = async (signal) => {
	const addIceCandidatePromises = signal.ice.map(ice => peerConnection.addIceCandidate(new RTCIceCandidate(ice)));
	await Promise.all(addIceCandidatePromises);
}

const onPeerSignal = async (signalMsg) => {
	signal = JSON.parse(LZString.decompressFromBase64(signalMsg));
	await setPeerDescription(signal);
	await setPeerIceCandidates(signal);
	// peerConnection.addStream(localStream);
	// createDataChannel('messages', msgHandler);
	// await createOffer();
	// isSafari && setTimeout(() => peerConnection.onicecandidate({candidate: null}), 1000);
}

const startApp = async () => {
	peerConnection || setUpPeerConnection();

	if(!isPeer){
		await createOffer();
		isSafari && setTimeout(() => peerConnection.onicecandidate({candidate: null}), 1000);
	}else{
		await setPeerDescription(signal);
		await setPeerIceCandidates(signal);
	}
}

// if the location.hash is present, treat as peer
if(window.location.hash.length > 1){
	signal = JSON.parse(LZString.decompressFromBase64(window.location.hash.substring(1)));
	isPeer = true;
}
// startApp();

const copyBtn = () => {
	document.getElementById('copyMessage').select();
	document.execCommand('copy');
	const copyBtn = document.querySelector('#step1 button');
	copyBtn.innerHTML = "Copied";
	setTimeout(() => {
		copyBtn.innerHTML = "Copy";
	}, 3000);
}

const connectBtn = () => {
	document.getElementById('pasteMessage').value && onPeerSignal(document.getElementById('pasteMessage').value);
}

const toggleChat = () => {
	document.getElementById('chatWrap').style.display = document.getElementById('chatWrap').style.display == 'none' ? 'block' : 'none';
}

const addChat = (msg, isMine) => {
	const chat = document.createElement('div');
	chat.className = 'chat ' +(isMine ? 'mine': '');
	chat.innerHTML = msg;
	document.getElementById('chats').appendChild(chat);
	document.getElementById('chatWrap').style.display = 'block';
}
