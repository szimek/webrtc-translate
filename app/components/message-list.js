import Ember from "ember";

export default Ember.Component.extend({
    classNames: ['chat'],
    messages: [],

    scrollChatToBottom: Ember.observer('messages.@each', function () {
        const element = this.$();

        // Wait till the view is updated
        if (element) {
            Ember.run.schedule('afterRender', function () {
                element.scrollTop(element.prop('scrollHeight'));
            });
        }
    })
});
