import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['flag'],
    classNameBindings: ['flagName'],

    flagName: Ember.computed('language', function () {
        const language = this.get('language');

        if (language) {
            // Select the last segment from locale code, e.g. CN from cmn-Hans-CN, or PL from pl-PL
            return language.split('-').slice(-1)[0].toUpperCase();
        }
    })
});
