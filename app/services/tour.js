import Ember from 'ember';

export default Ember.Service.extend({
    init() {
        this._super();

        const tour = new window.Shepherd.Tour({
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
            text: "<p><b>After the other person connects</b>, click here to start speech recognition. It will stop automatically when you stop speaking.</p><p>When doing it for the first time, you'll need to allow mic access.</p>",
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
            text: "<p>Send address of this page to another person to get started.</p>",
            buttons: [{
                text: 'Back',
                action: tour.back
            }, {
                text: 'Okay, got it!',
                action: tour.next
            }]
        });

        this.tour = tour;
    },

    start() {
        this.tour.start();
    }
});
