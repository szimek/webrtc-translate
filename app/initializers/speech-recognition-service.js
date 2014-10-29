export function initialize(container, application) {
    application.inject('route', 'speechRecognitionService', 'service:speech-recognition');
}

export default {
    name: 'speech-recognition-service',
    initialize: initialize
};
