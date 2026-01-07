"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNumber = isNumber;
exports.isDefined = isDefined;
exports.isBoolean = isBoolean;
exports.isString = isString;
exports.isIterable = isIterable;
function isNumber(val) {
    return typeof val === "number";
}
// eslint-disable-next-line @typescript-eslint/ban-types
function isDefined(val) {
    return typeof val !== "undefined";
}
function isBoolean(val) {
    return typeof val === "boolean";
}
function isString(val) {
    return typeof val === "string";
}
/**
 * Check that provided value is Iterable
 * @param val the value to check
 * @returns true if val is iterable, false otherwise
 */
function isIterable(val) {
    return Symbol.iterator in Object(val);
}
//# sourceMappingURL=objects.js.map