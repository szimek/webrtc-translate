import Ember from 'ember';

export default Ember.View.extend({
    initializeWebRTC: function () {
        var webrtc = this.get('controller.webrtc');
        webrtc.config.localVideoEl = "local-video";
        webrtc.config.remoteVideosEl = "remote-video";

        webrtc.startLocalVideo();
    }.observes('controller.webrtc'),

    scrollChatToBottom: function () {
        var chatElement = this.$('.chat');

        if (chatElement) {
            chatElement.scrollTop(chatElement.prop('scrollHeight'));
        }
    }.observes('controller.model.@each')
});
