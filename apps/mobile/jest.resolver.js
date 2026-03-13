'use strict';

// Keep Jest resolver loading stable when tests are launched from the monorepo root
// via Turbo, where direct resolution of React Native's resolver path can be brittle.
module.exports = require('react-native/jest/resolver');
