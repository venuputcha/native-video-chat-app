# Hello
There are 2 versions of hello app currently live.
1. A P2P video chat (w/ signaling server). https://itshello.co
2. A 100% P2P version (w/o signaling server). https://vasanthv.github.io/hello/

`master` branch has the source of the https://itshello.co.

## Why Hello?
There are many video chat solutions out there like Skype, Hangouts, Whatsapp, Appear.in etc. But everyone wants me to download their app in my mobile or desktop. WebRTC is so cool that it can run in your browser, why do I need to download your app? _So I built it myself_.

### For trying out locally
Run the following commands
```
git clone https://github.com/vasanthv/hello.git

cd hello

npm install

npm start
```

Point your browser to http://localhost:3000/
