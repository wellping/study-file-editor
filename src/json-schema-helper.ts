import { JSONSchema7 } from "json-schema";

export function getIDValueArraySchema(
  objectSchema: JSONSchema7,
  idSchema: JSONSchema7,
  valueSchema: JSONSchema7,
): JSONSchema7 {
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
    },
    ...objectSchema,
  };
}
