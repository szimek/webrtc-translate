/* global SimpleWebRTC */
/* global jQuery */

import Ember from 'ember';
import Message from '../models/message';
import config from '../config/environment';

var injection = Ember.computed.injection;
var alias = Ember.computed.alias;

export default Ember.ArrayController.extend({
    roomId: null,
    isRemoteVideo: false,
    isDataChannelOpened: false,
    recognition: injection('service:speech-recognition'),
    isSpeechRecognitionActive: alias('recognition.isActive'),

    // TODO: move to speech recognition service
    languages: [
        'en-GB',
        'en-US',
        'de-DE',
        'es-ES',
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
        return this.get('remoteSpeechLanguage').split('-')[1].toUpperCase();
    }.property('remoteSpeechLanguage'),

    localSpeechLanguage: 'en-GB',

    localTranslationLanguage: function () {
        return this.get('localSpeechLanguage').split('-')[0];
    }.property('localSpeechLanguage'),

    localFlagName: function () {
        return this.get('localSpeechLanguage').split('-')[1].toUpperCase();
    }.property('localSpeechLanguage'),

    localSpeechLanguageChanged: function () {
        var language = this.get('localSpeechLanguage');

        this.sendLanguage(language);
        this.set('recognition.language', language);
    }.observes('localSpeechLanguage'),

    roomIdChanged: function () {
        console.log('Room ID: ', this.get('roomId'));

        if (this.get('roomId')) {
            this.setup();
        }
    }.observes('roomId'),

    init: function () {
        this._super();

        var controller = this;

        // Initialize WebRTC
        var webrtc = new SimpleWebRTC({
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

                var finalTranscript;

                recognition.on('start', function () {
                    finalTranscript = '';
                });

                recognition.on('result', function (event) {
                    var interimTranscript = '';
                    var message = controller.get('message');

                    if (!message) {
                        message = Message.create();
                        controller.set('message', message);
                        controller.pushObject(message);
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

                            finalTranscript = '';
                            controller.set('message', null);
                        });
                    }
                });
            }
        });

        webrtc.on('channelClose', function (channel) {
            if (channel.label === 'simplewebrtc') {
                controller.set('isDataChannelOpened', false);
                console.info('Data channel closed.', arguments);
            }
        });

        webrtc.on('channelError', function (channel) {
            if (channel.label === 'simplewebrtc') {
                controller.set('isDataChannelOpened', false);
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
                        controller.pushObject(message);

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

    translate: function (options) {
        return jQuery.getJSON('https://www.googleapis.com/language/translate/v2?callback=?', {
            key: config.GOOGLE_TRANSLATE_API_KEY,
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
