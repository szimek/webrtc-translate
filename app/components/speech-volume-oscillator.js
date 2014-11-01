import Ember from 'ember';

// var injection = Ember.computed.injection;
var alias = Ember.computed.alias;

// TODO: move volume calculations to a service
export default Ember.Component.extend({
    isVisible: alias('isSpeechRecognitionActive'),

    init: function () {
        this._super();

        this.setProperties({
            time: 0,
            wavelength: 4,
            speed: 2
        });
    },

    onStreamChange: function () {
        var stream   = this.get('stream');
        if (stream) {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            var context = new AudioContext();
            var analyser = context.createAnalyser();
            // TODO check what these exactly do
            // analyser.minDecibels = -90;
            // analyser.maxDecibels = -10;
            // analyser.smoothingTimeConstant = 0.85;
            analyser.fftSize = 128;

            var source = context.createMediaStreamSource(stream);
            source.connect(analyser);

            this.set('analyser', analyser);
            this.set('bufferLength', analyser.fftSize);
        } else {
        }
    }.observes('stream'),

    getVolume: function () {
        var analyser = this.get('analyser');
        var bufferLength = this.get('bufferLength');
        var dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        var volume = Math.max.apply(null, dataArray) - 128;
        return Math.max(volume, 0); // Clip lower bound at 0
    },

    draw: function () {
        var canvas = this.$('canvas').get(0);
        var ctx = canvas.getContext('2d');
        var speed = this.get('speed');
        var wavelength = this.get('wavelength');
        var time = this.get('time');
        var offset = canvas.height / 2;
        var amplitude = Math.max(this.getVolume() / 5, 1.1);

        function f(x) {
            var xprime = x + speed * time;
            return Math.sin(xprime / wavelength) * amplitude + offset;
        }

        // Clear
        ctx.fillStyle = "rgb(255, 255 ,255)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.moveTo(0, f(0));
        for (var x = 1; x < canvas.width; x++) {
          ctx.lineTo(x, f(x));
        }
        ctx.stroke();

        this.set('time', time + 1);

        var drawRAF = window.requestAnimationFrame(this.draw.bind(this));
        this.set('drawRAF', drawRAF);
    },

    onIsSpeechRecognitionActiveChange: function () {
        var isActive = this.get('isSpeechRecognitionActive');
        return isActive ? this.start() : this.stop();
    }.observes('isSpeechRecognitionActive'),

    start: function () {
        var drawRAF = window.requestAnimationFrame(this.draw.bind(this));
        this.set('drawRAF', drawRAF);
    },

    stop: function () {
        var drawRAF = this.get('drawRAF');

        if (drawRAF) {
            window.cancelAnimationFrame(drawRAF);
        }
    }
});
