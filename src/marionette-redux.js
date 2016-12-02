import connect from './connect'
import mixin from './mixin'
import { version } from '../package.json'

const MarionetteRedux = {};

MarionetteRedux.connect = connect;
MarionetteRedux.mixin = mixin;
MarionetteRedux.VERSION = version;

export default MarionetteRedux;
