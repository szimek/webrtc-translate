/* global Shepherd */

import Ember from 'ember';

export default Ember.View.extend({
    initializeWebRTC: function () {
        var view = this;
        var webrtc = this.get('controller.webrtc');
        webrtc.config.localVideoEl = "local-video";
        webrtc.config.remoteVideosEl = "remote-video";

        webrtc.startLocalVideo();

        if (!window.localStorage.getItem('show-tour')) {
            webrtc.on('readyToCall', function () {
                window.localStorage.setItem('show-tour', 'nope');
                view.startTour();
            });
        }
    }.observes('controller.webrtc'),

    scrollChatToBottom: function () {
        var chatElement = this.$('.chat');

        // Wait till the view is updated
        if (chatElement) {
            Ember.run.schedule('afterRender', function () {
                chatElement.scrollTop(chatElement.prop('scrollHeight'));
            });
        }

    }.observes('controller.model.@each'),

    startTour: function () {
        var tour = new Shepherd.Tour({
            defaults: {
                classes: 'shepherd-theme-arrows shepherd-element-aint-no-river-wide-enough'
            }
        });

        tour.addStep('step-1', {
            title: 'Welcome to WebRTC Translate!',
            text: 'This app allows you to have a 1-to-1 video call and will translate what the other person is saying.',
            buttons: [{
                text: 'Next',
                action: tour.next
            }]
        });

        tour.addStep('step-2', {
            text: 'Click to select the language you speak in.',
            attachTo: '.language-local',
            buttons: [{
                text: 'Back',
                action: tour.back
            }, {
                text: 'Next',
                action: tour.next
            }]
        });

        tour.addStep('step-3', {
            text: 'See the language the other person speaks in.',
            attachTo: '.language-remote',
            buttons: [{
                text: 'Back',
                action: tour.back
            }, {
                text: 'Next',
                action: tour.next
            }]
        });

        tour.addStep('step-4', {
            text: "<p>Once the other person connects, click here to start speech recognition. It will stop automatically when you stop speaking.</p><p>When doing it for the first time, you'll need to allow mic access.</p>",
            attachTo: {
                element: '.speech-recognition-button',
                on: 'bottom'
            },
            buttons: [{
                text: 'Back',
                action: tour.back
            }, {
                text: 'Next',
                action: tour.next
            }]
        });

        tour.addStep('step-5', {
            title: "That's it!",
            text: "<p>Send address of this page to another person to get started!</p>",
            buttons: [{
                text: 'Back',
                action: tour.back
            }, {
                text: 'Okay, got it!',
                action: tour.next
            }]
        });

        tour.start();
    }
});
