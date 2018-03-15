import Ember from 'ember';

var inject = Ember.inject;
var alias = Ember.computed.alias;

export default Ember.Component.extend({
    classNames: ['speech-recognition-button'],

    recognition: inject.service('speech-recognition'),
    isSpeechRecognitionActive: alias('recognition.isActive'),

    flagName: function () {
        // Select the last segment from locale code, e.g. CN from cmn-Hans-CN, or PL from pl-PL
        return this.get('language').split('-').slice(-1)[0].toUpperCase();
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
