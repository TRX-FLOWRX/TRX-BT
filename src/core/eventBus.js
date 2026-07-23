import EventEmitter from 'events';

const eventBus = new EventEmitter({ captureRejections: true });

export default eventBus;
