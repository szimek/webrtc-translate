import Ember from 'ember';
import Message from '../models/message';
import config from '../config/environment';

const inject = Ember.inject;
const alias = Ember.computed.alias;

export default Ember.Controller.extend({
    isRemoteVideo: false,
    isDataChannelOpened: false,
    speechMessage: Message.create(),
    chatMessage: Message.create(),

    tour: inject.service('tour'),

    recognition: inject.service('speech-recognition'),
    isSpeechRecognitionActive: alias('recognition.isActive'),

    localSpeechLanguage: 'en-GB',
    localTranslationLanguage: Ember.computed('localSpeechLanguage', function () {
        return this.get('localSpeechLanguage').split('-')[0];
    }),
    localSpeechLanguageChanged: Ember.observer('localSpeechLanguage', function () {
        const language = this.get('localSpeechLanguage');

        this.sendLanguage(language);
        this.set('recognition.language', language);
    }),

    remoteSpeechLanguage: 'de-DE',
    remoteTranslationLanguage: Ember.computed('remoteSpeechLanguage', function () {
        return this.get('remoteSpeechLanguage').split('-')[0];
    }),

    roomId: null,
    roomIdChanged: Ember.observer('roomId', function () {
        console.log('Room ID: ', this.get('roomId'));

        if (this.get('roomId')) {
            this.setup();
        }
    }),

    // TODO: Cleanup init and setup methods
    init: function () {
        this._super();

        const controller = this;

        // Initialize WebRTC
        const webrtc = new window.SimpleWebRTC({
            enableDataChannels: true,
            url: 'https://webrtc-translate-signalmaster.herokuapp.com:443',
            debug: false
        });

        webrtc.webrtc.on('localStream', (stream) => {
            console.log('localStream: ', stream);
            controller.set('localMediaStream', stream);
        });

        webrtc.webrtc.on('localStreamStopped', () => {
            console.log('localStreamStopped');
            controller.set('localMediaStream', null);
        });

        webrtc.config.localVideoEl = "local-video";
        webrtc.config.remoteVideosEl = "remote-video";

        webrtc.startLocalVideo();

        if (!window.localStorage.getItem('show-tour')) {
            webrtc.on('readyToCall', () => {
                window.localStorage.setItem('show-tour', 'nope');
                controller.get('tour').start();
            });
        }

        this.set('webrtc', webrtc);
    },

    setup: function () {
        const controller = this;
        const webrtc = this.get('webrtc');
        const recognition = this.get('recognition');

        recognition.on('result', (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            let messages = controller.get('messages');
            let message = controller.get('speechMessage');

            // TODO figure out a better way to add this message just once
            if (!messages.contains(message)) {
                messages.pushObject(message);
            }

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const result = event.results[i];

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
            }

            if (message.get('isFinal')) {
                controller.handleUntranslatedMessage(message)
                .finally(() => {
                    finalTranscript = '';
                    controller.set('speechMessage', Message.create());
                });
            }

            console.log(event.results);
        });

        webrtc.on('readyToCall', () => {
            webrtc.joinRoom(controller.get('roomId'));
        });

        webrtc.on('joinedRoom', () => {
        });

        webrtc.on('error', (error) => {
            switch (error) {
                case 'full':
                    console.warn('You can\'t join this room, because it\'s full.');
                    break;
                default:
                    console.warn(error);
            }
        });

        webrtc.on('videoAdded', () => {
            controller.set('isRemoteVideo', true);
        });

        webrtc.on('videoRemoved', () => {
            controller.set('isRemoteVideo', false);
        });

        webrtc.on('channelOpen', (channel) => {
            // Data channel with label 'simplewebrtc' is opened by SimpleWebRTC by default
            if (channel.label === 'simplewebrtc') {
                controller.set('isDataChannelOpened', true);
                console.info('Data channel opened.', arguments);

                // Send local speech language to the other peer
                controller.sendLanguage(controller.get('localSpeechLanguage'));
            }
        });

        webrtc.on('channelClose', (channel) => {
            if (channel.label === 'simplewebrtc') {
                controller.set('isDataChannelOpened', false);
                console.info('Data channel closed.', arguments);
            }
        });

        webrtc.on('channelError', (channel) => {
            if (channel.label === 'simplewebrtc') {
                controller.set('isDataChannelOpened', false);
                console.info('Data channel error.', arguments);
            }
        });

        webrtc.on('channelMessage', (peer, channelName, data) => {
            if (channelName === 'simplewebrtc') {
                const payload = data.payload;

                switch (data.type) {
                    case 'message':
                        payload.isRemote = true;
                        payload.ifFinal = true;

                        const message = Message.create(payload);
                        controller.get('messages').pushObject(message);

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

    handleUntranslatedMessage: function (message) {
        let promise = null;

        if (this.get('isDataChannelOpened')) {
            promise = this.translate({
                source: this.get('localTranslationLanguage'),
                target: this.get('remoteTranslationLanguage'),
                q: message.get('formattedOriginalContent')
            })
            .then((data) => {
                if (data.error) {
                    console.error(data.error.message);
                } else {
                    const translation = data.data.translations[0].translatedText;
                    message.set('translatedContent', translation);
                    this.sendMessage(message);
                }

                return message;
            });
        } else {
            promise = Ember.RSVP.resolve(message);
        }

        return promise;
    },

    translate: function (options) {
        // Wrap jQuery promise in RSVP promise
        return new Ember.RSVP.Promise((resolve, reject) => {
            Ember.$.getJSON('https://www.googleapis.com/language/translate/v2?callback=?', {
                key: config.GOOGLE_TRANSLATE_API_KEY,
                source: options.source,
                target: options.target,
                q:      options.q
            })
            .then(resolve, reject);
        });
    },

    say: function (options) {
        const msg = new window.SpeechSynthesisUtterance();
        msg.lang = options.lang;
        msg.text = options.text;

        window.speechSynthesis.speak(msg);
    },

    sendMessage: function (message) {
        const webrtc = this.get('webrtc');

        webrtc.sendDirectlyToAll('simplewebrtc', 'message', {
            originalContent: message.get('formattedOriginalContent'),
            translatedContent: message.get('translatedContent')
        });
    },

    sendLanguage: function (language) {
        const webrtc = this.get('webrtc');

        webrtc.sendDirectlyToAll('simplewebrtc', 'language', {
            language: language
        });
    },

    actions: {
        handleChatMessage() {
            const message = this.get('chatMessage');

            if (message.originalContent) {
                message.set('isFinal', true);
                this.get('messages').pushObject(message);

                this.handleUntranslatedMessage(message)
                    .then(() => {
                        this.set('chatMessage', Message.create());
                    });
            }
        }
    }
});
