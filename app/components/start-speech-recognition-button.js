import Ember from 'ember';

var injection = Ember.computed.injection;
var alias = Ember.computed.alias;

export default Ember.Component.extend({
    classNames: ['speech-recognition-button'],

    recognition: injection('service:speech-recognition'),
    isSpeechRecognitionActive: alias('recognition.isActive'),

    flagName: function () {
        return this.get('language').split('-')[1].toUpperCase();
    }.property('language'),

    actions: {
        // TODO: Wait for local video to be on
        toggleRecognition: function () {
            var recognition = this.get("recognition");

            if (this.get("isSpeechRecognitionActive")) {
                recognition.stop();
            } else {
                recognition.start();
            }
        }
    }

    // TODO:
    // - figure out how to pass events to rooms controller
    // - hook it up to webaudio to calculate gain and display sine wave
});
