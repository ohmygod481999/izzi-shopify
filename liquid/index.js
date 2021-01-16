// const { preprocessLiquid } = require("./preprocess-liquid");
const registCustomTag = require("./custom-tag");
const registCustomFilter = require("./custom-filter");
const {preprocessLiquid} = require('./preprocess-liquid')
const _ = require('lodash')


exports.preprocessLiquid = preprocessLiquid;
exports.registCustomTag = registCustomTag;
exports.registCustomFilter = registCustomFilter;
