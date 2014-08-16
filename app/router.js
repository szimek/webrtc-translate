import Ember from 'ember';

var Router = Ember.Router.extend({
  location: WebrtcTranslateENV.locationType
});

Router.map(function () {
    this.route('room', { path: '/rooms/:room_id' });
});

export default Router;
