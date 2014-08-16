import Ember from 'ember';

export default Ember.Object.extend({
    originalContent: null,
    translatedContent: null,
    isFinal: false,
    isRemote: false,

    formattedOriginalContent: function () {
        var content = this.get('originalContent'),
            isFinal = this.get('isFinal');

        return isFinal ? this.capitalize(content) : content;
    }.property('originalContent', 'ifFinal'),

    capitalize: function (string) {
        var first_char = /\S/;
        return string.replace(first_char, function (match) {
            return match.toUpperCase();
        });
    },

    linebreak: function (string) {
        var two_line = /\n\n/g;
        var one_line = /\n/g;

        return string.replace(two_line, '<p></p>').replace(one_line, '<br>');
    }
});
