import Ember from 'ember';

var inject = Ember.computed.injection;
var alias = Ember.computed.alias;

export default Ember.Component.extend({
    classNames: ['speech-recognition-button'],

    recognition: inject('service:speech-recognition'),
    isSpeechRecognitionActive: alias('recognition.isActive'),

    flagName: function () {
        return this.get('language').split('-')[1].toUpperCase();
    }.property('language'),

    // TODO: make flag a separate component and toggle its
    // 'isVisible' property instead.
    onIsSpeechRecognitionActiveChange: function () {
        var isActive = this.get('isSpeechRecognitionActive');
        var startButton = this.$('.flag');

        return isActive ? startButton.hide() : startButton.show();
    }.observes('isSpeechRecognitionActive'),

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
});
