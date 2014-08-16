/* global SimpleWebRTC */
/* global webkitSpeechRecognition */
/* global jQuery */

import Ember from 'ember';
import Message from '../models/message';

export default Ember.ArrayController.extend({
    roomId: null,
    recognition: null,
    isRemoteVideo: false,
    isDataChannelOpened: false,
    isSpeechRecognitionActive: false,
    languages: [
        'en-GB',
        'en-US',
        'de-DE',
        'fr-FR',
        'it-IT',
        'hu-HU',
        'nl-NL',
        'pl-PL',
        'pt-PT',
        'sk-SK',
        'sv-SE'
    ],

    remoteSpeechLanguage: 'de-DE',

    remoteTranslationLanguage: function () {
        return this.get('remoteSpeechLanguage').split('-')[0];
    }.property('remoteSpeechLanguage'),

    remoteFlagName: function () {
        var name = this.get('remoteSpeechLanguage').split('-')[1].toUpperCase();
        return  '/images/flags/' + name + '.png';
    }.property('remoteSpeechLanguage'),

    localSpeechLanguage: 'en-GB',

    localTranslationLanguage: function () {
        return this.get('localSpeechLanguage').split('-')[0];
    }.property('localSpeechLanguage'),

    localFlagName: function () {
        var name = this.get('localSpeechLanguage').split('-')[1].toUpperCase();
        return  '/images/flags/' + name + '.png';
    }.property('localSpeechLanguage'),

    localSpeechLanguageChanged: function () {
        var language = this.get('localSpeechLanguage');

        // Send local speech language to the other peer
        this.sendLanguage(language);

        // Update and restart speech recognition
        var recognition = this.get('recognition');
        if (recognition) {
            recognition.lang = language;
            recognition.stop();
        }
    }.observes('localSpeechLanguage'),

    roomIdChanged: function () {
        console.log(this.get('roomId'));

        if (this.get('roomId')) {
            this.setup();
        }
    }.observes('roomId'),

    setup: function () {
        var self = this;

        var webrtc = new SimpleWebRTC({
            enableDataChannels: true,
            url: 'https://webrtc-translate-signalmaster.herokuapp.com/',
            debug: false
        });

        webrtc.on('readyToCall', function () {
            webrtc.joinRoom(self.get('roomId'));
        });

        webrtc.on('joinedRoom', function () {
        });

        webrtc.on('videoAdded', function () {
            self.set('isRemoteVideo', true);
        });

        webrtc.on('videoRemoved', function () {
            self.set('isRemoteVideo', false);
        });

        webrtc.on('channelOpen', function (channel) {
            // Data channel with label 'simplewebrtc' is opened by SimpleWebRTC by default
            if (channel.label === 'simplewebrtc') {
                self.set('isDataChannelOpened', true);
                console.info('Data channel opened.', arguments);

                // Send local speech language to the other peer
                self.sendLanguage(self.get('localSpeechLanguage'));

                // Setup speech recognition
                var recognition = new webkitSpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = self.get('localSpeechLanguage');
                self.set('recognition', recognition);

                var finalTranscript;

                recognition.onstart = function () {
                    self.set('isSpeechRecognitionActive', true);
                    console.info('recognition:start');

                    finalTranscript = '';
                };

                recognition.onresult = function (event) {
                    var interimTranscript = '';
                    var message = self.get('message');

                    if (!message) {
                        message = Message.create();
                        self.set('message', message);
                        self.pushObject(message);
                    }

                    console.log(event.results);

                    for (var i = event.resultIndex; i < event.results.length; ++i) {
                        var result = event.results[i];

                        if (result.isFinal) {
                            finalTranscript += result[0].transcript;
                            console.log("Final: ", finalTranscript);
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

                        self.translate({
                            source: self.get('localTranslationLanguage'),
                            target: self.get('remoteTranslationLanguage'),
                            q: message.get('formattedOriginalContent')
                        })
                        .done(function (data) {
                            message.set('translatedContent', data);

                            self.sendMessage(message);

                            finalTranscript = '';
                            self.set('message', Message.create());
                            self.pushObject(self.get('message'));
                        });
                    }
                };

                recognition.onerror = function (event) {
                    self.set('isSpeechRecognitionActive', false);
                    console.info('recognition:error', event.error);
                };

                recognition.onend = function () {
                    self.set('isSpeechRecognitionActive', false);
                    console.info('recognition:end');

                    // Restart recognition on errors like no-speech timeout etc.
                    // Use a small timeout to prevent crashing Chrome.
                    if (self.get('isDataChannelOpened')) {
                        setTimeout(function () {
                            recognition.start();
                        }, 50);
                    }
                };

                recognition.start();
            }
        });

        webrtc.on('channelClose', function (channel) {
            if (channel.label === 'simplewebrtc') {
                self.set('isDataChannelOpened', false);
                console.info('Data channel closed.', arguments);
            }
        });

        webrtc.on('channelError', function (channel) {
            if (channel.label === 'simplewebrtc') {
                self.set('isDataChannelOpened', false);
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
                        self.pushObject(message);

                        var lang = self.get('localSpeechLanguage');

                        console.log('Speaking with language: ', lang);

                        self.say({
                            text: message.get('translatedContent'),
                            lang: self.get('localSpeechLanguage')
                        });
                        break;

                    case 'language':
                        self.set('remoteSpeechLanguage', payload.language);
                        break;
                }

                console.log('Got message: ', data);
            }
        });

        this.webrtc = webrtc;
    },

    translate: function (options) {
        return jQuery.get('/api/translate', {
            source: options.source,
            target: options.target,
            q:      options.q
        });
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

    say: function (options) {
        var msg = new window.SpeechSynthesisUtterance();
        msg.lang = options.lang;
        msg.text = options.text;
        window.speechSynthesis.speak(msg);
    }
});
