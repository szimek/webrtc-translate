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

        // Wait till the view is updated
        if (chatElement) {
            Ember.run.schedule('afterRender', function () {
                chatElement.scrollTop(chatElement.prop('scrollHeight'));
            });
        }

    }.observes('controller.model.@each')
});
