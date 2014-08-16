module.exports = function(app) {
    var express = require('express');
    var translateRouter = express.Router();

    var request = require('request');

    translateRouter.get('/', function (req, res, next) {
        var source = req.query.source;
        var target = req.query.target;
        var q      = req.query.q;
        var key    = process.env.GOOGLE_TRANSLATE_API_KEY;
        var url    = 'https://www.googleapis.com/language/translate/v2?key=' + key;

        url += '&source=' + source;
        url += '&target=' + target;
        url += '&q=' + q;

        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                res.send(data.data.translations[0].translatedText);
            } else {
                next(error);
            }

        });
    });

    app.use('/api/translate', translateRouter);
};
