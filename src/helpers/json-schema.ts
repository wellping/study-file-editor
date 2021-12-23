import { JSONSchema7 } from "json-schema";
import { ONEOF_OPTION_NAME_KEY, ONEOF_OPTION_VALUE_KEY } from "./common";

export function getIDValueArraySchema({
  objectSchema = {},
  itemSchema = {},
  idSchema = {},
  valueSchema,
}: {
  objectSchema?: JSONSchema7;
  itemSchema?: JSONSchema7;
  idSchema?: JSONSchema7;
  valueSchema: JSONSchema7;
}): JSONSchema7 {
  return {
    type: "array",
    items: {
      type: "object",
      required: ["id", "value"],
      properties: {
        id: {
          type: "string",
          ...idSchema,
        },
        value: valueSchema,
      },
      ...itemSchema,
    },
    ...objectSchema,
  };
}

export function getOneOfDependencySchema({
  objectSchema,
  propertiesBeforeOptionSchema,
  optionTypeSchema,
  options,
  defaultOption,
}: {
  objectSchema?: JSONSchema7;
  propertiesBeforeOptionSchema?: JSONSchema7["properties"];
  optionTypeSchema?: JSONSchema7;
  options: {
    [optionName: string]: JSONSchema7 | null;
  };
  defaultOption: string;
}): JSONSchema7 {
  return {
    type: "object",
    properties: {
      ...propertiesBeforeOptionSchema,
      [ONEOF_OPTION_NAME_KEY]: {
        title: "Options",
        type: "string",
        enum: Object.keys(options),
        default: defaultOption,
        ...optionTypeSchema,
      },
    },
    dependencies: {
      [ONEOF_OPTION_NAME_KEY]: {
        oneOf: Object.entries(options).map(([optionName, value]) => {
          const optionValueKey = ONEOF_OPTION_VALUE_KEY(optionName);
          return {
            properties: {
              [ONEOF_OPTION_NAME_KEY]: {
                enum: [optionName],
              },
              ...(value !== null ? { [optionValueKey]: value } : {}),
            },
            required: value === null ? [] : [optionValueKey],
          } as JSONSchema7;
        }),
      },
    },
    ...objectSchema,
    required: [...(objectSchema?.required ?? []), ONEOF_OPTION_NAME_KEY],
  };
}
