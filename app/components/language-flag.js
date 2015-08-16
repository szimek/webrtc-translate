import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['flag'],
    classNameBindings: ['flagName'],

    flagName: Ember.computed('language', function () {
        const language = this.get('language');

        if (language) {
            return language.split('-')[1].toUpperCase();
        }
    })
});
