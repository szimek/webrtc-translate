import Ember from "ember";

export default Ember.Component.extend({
    classNames: ['message'],
    classNameBindings: ['message.isRemote:remote:local']
});
