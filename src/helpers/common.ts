export function cloneObject<T>(object: T): T {
  return JSON.parse(JSON.stringify(object));
}

export const ONEOF_OPTION_NAME_KEY = "_optionName";
export const ONEOF_OPTION_VALUE_KEY_PREFIX = `_optionValue_`;
export const ONEOF_OPTION_VALUE_KEY = (optionName: string) =>
  `${ONEOF_OPTION_VALUE_KEY_PREFIX}${optionName}`;

export const KEYBOARD_TYPES = [
  "default",
  "number-pad",
  "decimal-pad",
  "numeric",
  "email-address",
  "phone-pad",
];
