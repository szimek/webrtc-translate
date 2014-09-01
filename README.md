# WebRTC Translate

Highly experimental (read: "barely working") app that uses WebRTC API and WebSpeech API to provide almost (read: "not really") real-time translations during a video call. You'll need Google Translate API key to run it yourself.

You can try it out at https://webrtc-translate.herokuapp.com/. It doesn't really work on a single computer, so you'll need a second one - just make sure that you open the same URL (e.g. `https://webrtc-translate.herokuapp.com/rooms/your-awesome-room-name`) on both.

## Installation

* `git clone` this repository
* `npm install`
* `bower install`

## Running

* `GOOGLE_TRANSLATE_API_KEY=XXXXXX ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
