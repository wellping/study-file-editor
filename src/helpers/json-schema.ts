import { JSONSchema7 } from "json-schema";

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
