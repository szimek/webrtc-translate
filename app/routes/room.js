import Ember from 'ember';

export default Ember.Route.extend({
    model: function (params) {
        return params.room_id;
    },

    setupController: function (controller, model) {
        controller.set('roomId', model);
        controller.set('model', []);
    }
});
