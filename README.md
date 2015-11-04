# WebRTC Translate

Highly experimental (read: "barely working") app that uses WebRTC API and WebSpeech API to provide almost (read: "not really") real-time translations during a video call. At the moment it works only in Chrome, though there's an experimental Web Speech Recognition API implementation in Firefox Nightly, so it's possible that it will work in Firefox soon as well. The UI was inspired by [iTranslate](http://www.itranslateapp.com) app. If you want to host it yourself, you'll need a Google Translate API key.



You can see a short demo video [here](https://youtu.be/Tv8ilBOKS2o) or you can try it out yourself at https://webrtc-translate.herokuapp.com - once you open this page it will redirect you to a URL with randomly generated room ID. Open the same URL on another computer and you should see and hear the other person. If you really want to, you can try it out on a single computer as well, but you'll have to turn off audio to avoid nasty feedback and miss speech synthesis :/

You can select the language you speak in from the select box on the top left. Click the flag button under the video to start speech recognition. The speech recognition will stop automatically once you stop speaking or press the flag button again.

The previous version had speech recognition always on, but due to the way Web Speech API works it was rather unstable. This version is still available in [continuous](https://github.com/szimek/webrtc-translate/tree/continuous) branch and there's a short screencast of it available [here](http://www.youtube.com/watch?v=R8ejjVAZweg).

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM) and [Bower](http://bower.io/)

## Installation

* `git clone <repository-url>` this repository
* change into the new directory
* `npm install`
* `bower install`

## Running / Development

* `GOOGLE_TRANSLATE_API_KEY=XXXXXX ember server`
* Visit your app at [http://localhost:4200](http://localhost:4200).
