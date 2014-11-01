import Ember from 'ember';
import VolumeAnalyser from '../models/volume-analyser';

// var injection = Ember.computed.injection;
var alias = Ember.computed.alias;

// TODO: move volume calculations to a service
export default Ember.Component.extend({
    isVisible: alias('isSpeechRecognitionActive'),

    init: function () {
        this._super();

        this.setProperties({
            time: 0,
            wavelength: 6,
            speed: 2,
            volumeAnalyser: VolumeAnalyser.create()
        });
    },

    onStreamChange: function () {
        var stream = this.get('stream');
        this.get('volumeAnalyser').set('stream', stream);
    }.observes('stream'),

    draw: function () {
        var canvas = this.$('canvas').get(0);
        var ctx = canvas.getContext('2d');
        var speed = this.get('speed');
        var wavelength = this.get('wavelength');
        var time = this.get('time');
        var offset = canvas.height / 2;
        var volume = this.get('volumeAnalyser.volume');
        var amplitude = Math.max(volume / 5, 1.1);

        function f(x) {
            var xprime = x + speed * time;
            return Math.sin(xprime / wavelength) * amplitude + offset;
        }

        // Clear
        ctx.fillStyle = "rgb(15, 15 ,15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.moveTo(0, f(0));
        for (var x = 1; x < canvas.width; x++) {
          ctx.lineTo(x, f(x));
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgb(68, 133, 247)";
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
