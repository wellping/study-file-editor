import { JSONSchema7 } from "json-schema";

export const schema: JSONSchema7 = {
  title: "Study File",
  type: "object",
  definitions: {
    sliderQuestion: {
      properties: {
        type: {
          enum: ["Slider"],
        },
        slider: {
          type: "object",
          title: "Slider Text",
          required: ["left", "right"],
          properties: {
            left: {
              type: "string",
              title: "Text on the left side of slider",
            },
            right: {
              type: "string",
              title: "Text on the right side of slider",
            },
          },
        },
        minimumValue: {
          type: "integer",
          title: "Minimum value of the slider",
        },
        maximumValue: {
          type: "integer",
          title: "Maximum value of the slider",
        },
        step: {
          type: "integer",
          title: "Step size of the slider",
        },
        defaultValue: {
          type: "integer",
          title: "Default value of the slider",
        },
        defaultValueFromQuestionId: {
          type: "string",
          title:
            "The question ID that the default value of the slider will be from",
        },
      },
      required: ["slider"],
    },

    choiceQuestion_choices: {
      type: "array",
      items: {
        type: "string",
      },
    },
    choiceQuestion_specialCasesStartId: {
      type: "array",
      items: {
        type: "object",
        properties: {
          choice: {
            type: "string",
          },
          questionId: {
            type: "string",
          },
        },
      },
    },
    choiceQuestion_randomizeChoicesOrder: {
      type: "boolean",
    },
    choiceQuestion_randomizeExceptForChoiceIds: {
      type: "array",
      items: {
        type: "string",
      },
    },
    choicesWithSingleAnswerQuestion: {
      properties: {
        type: {
          enum: ["ChoicesWithSingleAnswer"],
        },
        choices: {
          $ref: "#/definitions/choiceQuestion_choices",
        },
        specialCasesStartId: {
          $ref: "#/definitions/choiceQuestion_specialCasesStartId",
        },
        randomizeChoicesOrder: {
          $ref: "#/definitions/choiceQuestion_randomizeChoicesOrder",
        },
        randomizeExceptForChoiceIds: {
          $ref: "#/definitions/choiceQuestion_randomizeExceptForChoiceIds",
        },
      },
      required: ["choices"],
    },
    choicesWithMultipleAnswersQuestion: {
      properties: {
        type: {
          enum: ["ChoicesWithMultipleAnswers"],
        },
        choices: {
          $ref: "#/definitions/choiceQuestion_choices",
        },
        specialCasesStartId: {
          $ref: "#/definitions/choiceQuestion_specialCasesStartId",
        },
        randomizeChoicesOrder: {
          $ref: "#/definitions/choiceQuestion_randomizeChoicesOrder",
        },
        randomizeExceptForChoiceIds: {
          $ref: "#/definitions/choiceQuestion_randomizeExceptForChoiceIds",
        },
      },
      required: ["choices"],
    },

    question: {
      type: "object",
      required: ["id", "question", "type"],
      properties: {
        id: { type: "string", title: "Question ID" },
        question: { type: "string", title: "Question title" },
        description: { type: "string", title: "Question description" },
        type: {
          type: "string",
          title: "Question type",
          enum: [
            "Slider",
            "ChoicesWithSingleAnswer",
            "ChoicesWithMultipleAnswers",
            "YesNo",
            "MultipleText",
            "HowLongAgo",
            "Branch",
            "BranchWithRelativeComparison",
            "Wrapper",
          ],
        },
      },
      dependencies: {
        type: {
          oneOf: [
            {
              $ref: "#/definitions/sliderQuestion",
            },
            {
              $ref: "#/definitions/choicesWithSingleAnswerQuestion",
            },
            {
              $ref: "#/definitions/choicesWithMultipleAnswersQuestion",
            },
          ],
        },
      },
    },
  },
  properties: {
    studyInfo: {
      title: "Study Info",
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          title: "Study ID",
        },
      },
    },
    streams: {
      title: "Streams",
      type: "object",
      // https://stackoverflow.com/a/27375654/2603230
      additionalProperties: {
        title: "Stream",
        type: "array",
        items: {
          $ref: "#/definitions/question",
        },
      },
    },
    extraData: {},
  },
};
