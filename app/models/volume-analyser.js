import Ember from 'ember';

export default Ember.Object.extend({
    stream: null,

    onStreamChange: function () {
        var stream = this.get('stream');

        if (stream) {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            var context = new AudioContext();
            var analyser = context.createAnalyser();
            analyser.fftSize = 128;

            // TODO check what these exactly do
            analyser.minDecibels = -90;
            analyser.maxDecibels = -10;
            analyser.smoothingTimeConstant = 0.85;

            var source = context.createMediaStreamSource(stream);
            source.connect(analyser);

            this.set('analyser', analyser);
            this.set('bufferLength', analyser.fftSize);
        } else {
        }
    }.observes('stream'),

    volume: function () {
        var stream = this.get('stream');

        if (stream) {
            var analyser = this.get('analyser');
            var bufferLength = this.get('bufferLength');
            var dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);

            // Return volume in range 0..64
            var volume = Math.max.apply(null, dataArray) - 128;
            volume = Math.max(volume, 0);
            volume = Math.min(volume, 64);
            return volume;
        } else {
            return null;
        }
    }.property().volatile().readOnly()
});
