// `@wellping/study-schemas` needs `__WELLPING_SHOULD_USE_STRICT_SCHEMA__` defined.
// https://stackoverflow.com/a/51240514/2603230
// https://stackoverflow.com/a/69238076/2603230
declare global {
  var __WELLPING_SHOULD_USE_STRICT_SCHEMA__: boolean; // eslint-disable-line no-var
}
// We want to always use strict schemas.
global.__WELLPING_SHOULD_USE_STRICT_SCHEMA__ = true;

export {};
