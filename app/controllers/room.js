import Ember from 'ember';
import Message from '../models/message';
import config from '../config/environment';

const inject = Ember.inject;
const alias = Ember.computed.alias;

export default Ember.Controller.extend({
    roomId: null,
    isRemoteVideo: false,
    isDataChannelOpened: false,
    tour: inject.service('tour'),
    recognition: inject.service('speech-recognition'),
    isSpeechRecognitionActive: alias('recognition.isActive'),
    remoteSpeechLanguage: 'de-DE',
    remoteTranslationLanguage: Ember.computed('remoteSpeechLanguage', function () {
        return this.get('remoteSpeechLanguage').split('-')[0];
    }),

    localSpeechLanguage: 'en-GB',
    localTranslationLanguage: Ember.computed('localSpeechLanguage', function () {
        return this.get('localSpeechLanguage').split('-')[0];
    }),
    localFlagName: Ember.computed('localSpeechLanguage', function () {
        return this.get('localSpeechLanguage').split('-')[1].toUpperCase();
    }),
    localSpeechLanguageChanged: Ember.observer('localSpeechLanguage', function () {
        var language = this.get('localSpeechLanguage');

        this.sendLanguage(language);
        this.set('recognition.language', language);
    }),

    roomIdChanged: Ember.observer('roomId', function () {
        console.log('Room ID: ', this.get('roomId'));

        if (this.get('roomId')) {
            this.setup();
        }
    }),

    // TODO: Cleanup init, initializeWebRTC and setup methods
    init: function () {
        this._super();

        var controller = this;

        // Initialize WebRTC
        var webrtc = new window.SimpleWebRTC({
            enableDataChannels: true,
            url: 'https://webrtc-translate-signalmaster.herokuapp.com:443',
            debug: false
        });

        webrtc.webrtc.on('localStream', function (stream) {
            console.log('localStream: ', stream);
            controller.set('localMediaStream', stream);
        });

        webrtc.webrtc.on('localStreamStopped', function () {
            console.log('localStreamStopped');
            controller.set('localMediaStream', null);
        });

        this.set('webrtc', webrtc);

        // TODO move it somewhere
        this.initializeWebRTC();
    },

    setup: function () {
        var controller = this;
        var webrtc = this.get('webrtc');
        var recognition = this.get('recognition');

        webrtc.on('readyToCall', function () {
            webrtc.joinRoom(controller.get('roomId'));
        });

        webrtc.on('joinedRoom', function () {
        });

        webrtc.on('videoAdded', function () {
            controller.set('isRemoteVideo', true);
        });

        webrtc.on('videoRemoved', function () {
            controller.set('isRemoteVideo', false);
        });

        webrtc.on('channelOpen', function (channel) {
            // Data channel with label 'simplewebrtc' is opened by SimpleWebRTC by default
            if (channel.label === 'simplewebrtc') {
                controller.set('isDataChannelOpened', true);
                console.info('Data channel opened.', arguments);

                // Send local speech language to the other peer
                controller.sendLanguage(controller.get('localSpeechLanguage'));

                // var finalTranscript;
                //
                // recognition.on('start', function () {
                //     finalTranscript = '';
                // });

                recognition.on('result', function (event) {
                    var interimTranscript = '';
                    var finalTranscript = '';
                    var message = controller.get('message');

                    // Create an empty message
                    if (!message) {
                        message = Message.create();
                        controller.set('message', message);
                        controller.get('messages').pushObject(message);
                    }

                    for (var i = event.resultIndex; i < event.results.length; ++i) {
                        var result = event.results[i];

                        if (result.isFinal) {
                            finalTranscript = result[0].transcript;
                            console.log("Final: ", finalTranscript);
                            break;
                        } else {
                            interimTranscript += result[0].transcript;
                            console.log("Interim: ", interimTranscript);
                        }
                    }

                    message.set('originalContent', interimTranscript);

                    if (finalTranscript) {
                        message.setProperties({
                            originalContent: finalTranscript,
                            isFinal: true
                        });

                        controller.translate({
                            source: controller.get('localTranslationLanguage'),
                            target: controller.get('remoteTranslationLanguage'),
                            q: message.get('formattedOriginalContent')
                        })
                        .done(function (data) {
                            if (data.error) {
                                console.error(data.error.message);
                            } else {
                                var translation = data.data.translations[0].translatedText;
                                message.set('translatedContent', translation);
                                controller.sendMessage(message);
                            }
                        })
                        .always(function () {
                            finalTranscript = '';
                            controller.set('message', null);
                        });
                    }

                    console.log(event.results);
                });
            }
        });

        webrtc.on('channelClose', function (channel) {
            if (channel.label === 'simplewebrtc') {

                // TODO: extract into function
                controller.set('isDataChannelOpened', false);
                recognition.off('result');
                console.info('Data channel closed.', arguments);
            }
        });

        webrtc.on('channelError', function (channel) {
            if (channel.label === 'simplewebrtc') {

                // TODO: extract into function
                controller.set('isDataChannelOpened', false);
                recognition.off('result');
                console.info('Data channel error.', arguments);
            }
        });

        webrtc.on('channelMessage', function (peer, channelName, data) {
            if (channelName === 'simplewebrtc') {
                var payload = data.payload;

                switch (data.type) {
                    case 'message':
                        payload.isRemote = true;
                        payload.ifFinal = true;
                        var message = Message.create(payload);
                        controller.get('messages').pushObject(message);

                        var lang = controller.get('localSpeechLanguage');

                        console.log('Speaking with language: ', lang);

                        controller.say({
                            text: message.get('translatedContent'),
                            lang: controller.get('localSpeechLanguage')
                        });
                        break;

                    case 'language':
                        controller.set('remoteSpeechLanguage', payload.language);
                        break;
                }

                console.log('Got message: ', data);
            }
        });
    },

    // TODO move it to the rest of webrtc initialization code
    initializeWebRTC: function () {
        const controller = this;
        const webrtc = this.get('webrtc');
        webrtc.config.localVideoEl = "local-video";
        webrtc.config.remoteVideosEl = "remote-video";

        webrtc.startLocalVideo();

        if (!window.localStorage.getItem('show-tour')) {
            webrtc.on('readyToCall', function () {
                window.localStorage.setItem('show-tour', 'nope');
                controller.get('tour').start();
            });
        }
    },

    sendMessage: function (message) {
        var webrtc = this.get('webrtc');

        webrtc.sendDirectlyToAll('simplewebrtc', 'message', {
            originalContent: message.get('formattedOriginalContent'),
            translatedContent: message.get('translatedContent')
        });
    },

    sendLanguage: function (language) {
        var webrtc = this.get('webrtc');

        webrtc.sendDirectlyToAll('simplewebrtc', 'language', {
            language: language
        });
    },

    translate: function (options) {
        return Ember.$.getJSON('https://www.googleapis.com/language/translate/v2?callback=?', {
            key: config.GOOGLE_TRANSLATE_API_KEY,
            source: options.source,
            target: options.target,
            q:      options.q
        });
    },

    say: function (options) {
        var msg = new window.SpeechSynthesisUtterance();
        msg.lang = options.lang;
        msg.text = options.text;
        window.speechSynthesis.speak(msg);
    }
});
