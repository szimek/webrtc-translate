import Ember from 'ember';

export default Ember.Service.extend(Ember.Evented, {
    isActive: false,
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
        'sv-SE',
        // 'cmn-Hans-CN',
        'zh-CN'
    ],
    language: 'en-GB',

    init: function () {
        this._super();

        var self = this;
        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        var recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = this.get("language");

        recognition.onstart = function () {
            console.info('recognition:start');
            self.set("isActive", true);
            self.trigger("start");
        };

        recognition.onresult = function (event) {
            console.info('recognition:result', event);
            self.trigger("result", event);

            // Stop recognition once there's final result
            var results = event.results;
            if (results.length) {
                if (results[0].isFinal) {
                    recognition.abort();
                }
            }
        };

        recognition.onend = function (event) {
            console.info('recognition:end', event);
            self.set("isActive", false);
            self.trigger("end", event);
        };

        recognition.onerror = function () {
            console.info('recognition:error', event);
            self.set("isActive", false);
            self.trigger("error", event);
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
