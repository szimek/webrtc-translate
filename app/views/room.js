import Ember from 'ember';

export default Ember.View.extend({
    initializeWebRTC: function () {
        var webrtc = this.get('controller.webrtc');
        webrtc.config.localVideoEl = "local-video";
        webrtc.config.remoteVideosEl = "remote-video";

        webrtc.startLocalVideo();
    }.observes('controller.webrtc'),

    scrollToBottom: function () {
        if (this.$()) {
            this.$().scrollTop(this.$().prop('scrollHeight'));
        }
    }.observes('controller.content.length')
});
