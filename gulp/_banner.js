import {version} from '../package.json';

const now = new Date();
const year = now.getFullYear();

export default `// Marionette Redux
// ----------------------------------
// v${version}
//
// Copyright (c)${year} Andrew Henderson.
// Distributed under MIT license\n\n`;