import Ember from 'ember';

export default Ember.Route.extend({
    beforeModel: function () {
        var supports = {
            webRTC: !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection),
            webSpeech: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
            webAudio: !!window.AudioContext
        };

        if (!(supports.webRTC && supports.webSpeech && supports.webAudio)) {
            return Ember.RSVP.reject();
        }
    },

    model: function (params) {
        return {
          roomId: params.room_id,
          messages: []
        };
    },

    setupController: function (controller, model) {
        controller.setProperties(model);
    }
});
