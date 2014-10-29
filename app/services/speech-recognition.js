import Ember from 'ember';

export default Ember.Object.extend(Ember.Evented, {
    isActive: false,
    language: "en-GB",

    init: function () {
        this._super();

        var self = this;
        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        var recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = this.get("language");

        recognition.onstart = function () {
            self.set("isActive", true);
            self.trigger("start");
            console.info('recognition:start');
        };

        recognition.onresult = function (event) {
          self.trigger("result", event);
          console.info('recognition:result', event);
        };

        recognition.onend = function (event) {
            self.set("isActive", false);
            self.trigger("end", event);
            console.info('recognition:end', event);
        };

        recognition.onerror = function () {
            self.set("isActive", false);
            self.trigger("error", event);
            console.info('recognition:error', event);
        };

        this.set("recognition", recognition);
    },

    start: function () {
        this.get("recognition").start();
    },

    stop: function () {
        this.get("recognition").stop();
    },

    languageHasChanged: function () {
        var language = this.get("language");
        var recognition = this.get("recognition");

        recognition.lang = language;

        if (this.get('isActive')) {
            recognition.stop();
            recognition.start();
        }
    }.observes("language")
});
