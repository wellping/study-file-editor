import React from "react";
import Form, { UiSchema } from "@rjsf/core";
import { saveAs } from "file-saver";
import { JSONSchema7 } from "json-schema";
import "./App.css";

const ID_REGEX = "^\\w+$";
const DATETIME_REGEX =
  "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$";

const VALIDATE_BUTTON_ID = "button-validate";
const VALIDATE_AND_EXPORT_BUTTON_ID = "button-export";

function getArrayAndEmptyStringIfEmpty(list: string[]): string[] {
  if (list.length === 0) {
    // The enum cannot be 0 length
    return [""];
  } else {
    return list;
  }
}

function App() {
  const [formData, setFormData] = React.useState(null);

  const [liveValidate, setLiveValidate] = React.useState(true);

  const [choicesListsIds, setChoicesListsIds] = React.useState(
    getArrayAndEmptyStringIfEmpty([]),
  );
  const [questionBlockIds, setQuestionBlockIds] = React.useState(
    getArrayAndEmptyStringIfEmpty([]),
  );

  const schema: JSONSchema7 = {
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

      choiceQuestion_choices_list: {
        title: "Choices List",
        type: "array",
        items: {
          type: "string",
        },
        minItems: 1,
      },
      choiceQuestion_choices: {
        oneOf: [
          {
            $ref: "#/definitions/choiceQuestion_choices_list",
          },
          {
            title: "Reusable Choices List Name",
            type: "string",
            enum: choicesListsIds,
          },
        ],
      },
      choiceQuestion_specialCasesStartId: {
        type: "array",
        items: {
          type: "object",
          properties: {
            choice: {
              type: "string",
            },
            questions: {
              title: "Questions to show",
              $ref: "#/definitions/listOfNonEmptyQuestions",
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

      yesNoQuestion: {
        properties: {
          type: {
            enum: ["YesNo"],
          },
          branchStartId: {
            type: "object",
            title: "Branches",
            properties: {
              yes: {
                title: 'If the user answered "Yes"',
                $ref: "#/definitions/listOfQuestions",
              },
              no: {
                title: 'If the user answered "No"',
                $ref: "#/definitions/listOfQuestions",
              },
            },
          },
          addFollowupStream: {
            type: "object",
            properties: {
              yes: {
                type: "string",
              },
            },
          },
        },
        required: [],
      },

      howLongAgoQuestion: {
        properties: {
          type: {
            enum: ["HowLongAgo"],
          },
          // No other fields.
        },
      },

      multipleTextQuestion: {
        properties: {
          type: {
            enum: ["MultipleText"],
          },
          indexName: {
            type: "string",
            title: "Index's placeholder in enclosing question ID",
            pattern: ID_REGEX,
          },
          variableName: {
            type: "string",
            title: "Answer text's placeholder in enclosing question ID",
            pattern: ID_REGEX,
          },
          placeholder: {
            type: "string",
          },
          keyboardType: {
            // TODO: enum
            type: "string",
          },
          choices: {
            $ref: "#/definitions/choiceQuestion_choices",
          },
          forceChoice: {
            type: "boolean",
          },
          alwaysShowChoices: {
            type: "boolean",
          },
          max: {
            type: "integer",
          },
          maxMinus: {
            type: "string",
          },
          repeatedQuestions: {
            $ref: "#/definitions/listOfQuestions",
          },
        },
        required: ["indexName", "variableName", "max"],
      },

      question: {
        type: "object",
        required: ["id", "question", "type"],
        properties: {
          id: {
            type: "string",
            title: "Question ID",
            pattern: ID_REGEX,
          },
          question: {
            type: "string",
            title: "Question title",
            format: "textarea",
          },
          description: {
            type: "string",
            title: "Question description",
            format: "textarea",
          },
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
              {
                $ref: "#/definitions/yesNoQuestion",
              },
              {
                $ref: "#/definitions/multipleTextQuestion",
              },
              {
                $ref: "#/definitions/howLongAgoQuestion",
              },
            ],
          },
        },
      },

      question_or_questionBlock: {
        oneOf: [
          {
            title: "Question",
            $ref: "#/definitions/question",
          },
          {
            title: "Question Block ID",
            // For some reason we have to make it into an object instead of just a string
            type: "object",
            properties: {
              questionBlockId: {
                title: "Question Block ID",
                type: "string",
                enum: questionBlockIds,
              },
            },
            required: ["questionBlockId"],
          },
        ],

        // This is so that initially the value in JSON would also be `{}` (instead of `null` sometimes).
        default: {},
      },

      listOfQuestions: {
        type: "array",
        title: "Questions",
        uniqueItems: true,
        items: {
          $ref: "#/definitions/question_or_questionBlock",
        },
      },

      listOfNonEmptyQuestions: {
        type: "array",
        title: "Questions",
        uniqueItems: true,
        minItems: 1,
        items: {
          $ref: "#/definitions/question_or_questionBlock",
        },
      },
    },
    properties: {
      studyInfo: {
        title: "Study Info",
        type: "object",
        required: ["id", "startDate", "endDate"],
        properties: {
          id: {
            type: "string",
            title: "Study ID",
            pattern: ID_REGEX,
          },

          // Note that for `startDate` and `endDate`,
          // - we cannot use `format: datetime` because the time stored in JSON is different from the time shown (due to timezone)
          // - we cannot use `format: alt-datetime` because after loading a JSON file, the value is not populated in the field.
          startDate: {
            type: "string",
            title: "Study Start Date",
            description:
              'The first ping will be sent after this time. Please enter the date in the format like "2020-03-10T08:00:00.000Z".',
            pattern: DATETIME_REGEX,
          },
          endDate: {
            type: "string",
            title: "Study End Date",
            description:
              'No ping will be sent after this time. Please enter the date in the format like "2020-03-10T08:00:00.000Z".',
            pattern: DATETIME_REGEX,
          },
        },
      },
      streams: {
        title: "Streams",
        type: "array",
        items: {
          title: "Stream",
          type: "object",
          properties: {
            id: {
              type: "string",
              title: "Stream ID",
              pattern: ID_REGEX,
            },
            questions: {
              title: "Stream Questions",
              $ref: "#/definitions/listOfNonEmptyQuestions",
            },
          },
          required: ["id", "questions"],
        },
        minItems: 1,
      },
      extraData: {
        title: "Extra Data",
        type: "object",
        properties: {
          reusableChoices: {
            title: "Reusable Choices Lists",
            type: "object",
            additionalProperties: {
              $ref: "#/definitions/choiceQuestion_choices_list",
            },
          },
        },
      },
      reusableQuestionBlocks: {
        title: "Reusable Question Blocks",
        type: "object",
        additionalProperties: {
          title: "Questions",
          $ref: "#/definitions/listOfQuestions",
        },
      },
    },

    required: ["studyInfo", "streams"],
  };

  const uiSchema: UiSchema = {};

  return (
    <>
      <nav className="navbar navbar-default navbar-fixed-top">
        <div className="container">
          <div className="navbar-header">
            <button
              type="button"
              className="navbar-toggle collapsed"
              data-toggle="collapse"
              data-target="#navbar"
              aria-expanded="false"
              aria-controls="navbar"
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
          </div>
          <div id="navbar" className="navbar-collapse collapse">
            <ul className="nav navbar-nav">
              <li>
                <a href="#page-title">→ Top</a>
              </li>
              <li>
                <a href="#root_studyInfo">→ Study Info</a>
              </li>
              <li>
                <a href="#root_streams">→ Streams</a>
              </li>
              <li>
                <a href="#root_extraData">→ Extra Data</a>
              </li>
              <li>
                <a href="#root_reusableQuestionBlocks">
                  → Reusable Questions Blocks
                </a>
              </li>
              <li>
                <a href="#study-file-json">→ JSON</a>
              </li>
            </ul>
            {/*<ul className="nav navbar-nav navbar-right">
            </ul>*/}
          </div>
        </div>
      </nav>
      <div className="container">
        <div className="App">
          <h1 id="page-title">Well Ping Study File Editor</h1>
          <p>Please use this editor in Chrome on a desktop computer.</p>

          <Form
            schema={schema}
            uiSchema={uiSchema}
            formData={formData}
            onChange={(e) => {
              setChoicesListsIds(
                getArrayAndEmptyStringIfEmpty(
                  Object.keys((e.formData as any).extraData.reusableChoices),
                ),
              );
              setQuestionBlockIds(
                getArrayAndEmptyStringIfEmpty(
                  Object.keys((e.formData as any).reusableQuestionBlocks),
                ),
              );

              setFormData(e.formData);
            }}
            onSubmit={({ formData }, e) => {
              // Ugly hack :(
              // https://stackoverflow.com/a/33264162/2603230
              const typeOfSubmit = document.activeElement?.id;
              switch (typeOfSubmit) {
                case VALIDATE_BUTTON_ID:
                  // Do nothing. We don't need to submit.
                  break;

                case VALIDATE_AND_EXPORT_BUTTON_ID:
                  // TODO: export
                  alert("export!");
                  break;

                default:
                  // Do nothing. This might happen by e.g., pressing "Enter".
                  break;
              }
            }}
            noHtml5Validate
            liveValidate={liveValidate}
          >
            {/* Notice that we cannot programmitcally trigger validate now: https://github.com/rjsf-team/react-jsonschema-form/issues/246 */}
            <div id="right-toolbar">
              <div className="right-button">
                <button
                  type="submit"
                  id={VALIDATE_BUTTON_ID}
                  className="btn btn-primary"
                >
                  Validate
                </button>
              </div>
              <div className="right-button">
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => {
                    setLiveValidate(!liveValidate);
                  }}
                >
                  Live Validate {liveValidate ? "✅" : "❌"}
                </button>
                <p style={{ fontSize: 10 }}>
                  (Turn off Live Validate
                  <br />
                  if the page is slow)
                </p>
              </div>
              <div style={{ marginTop: 30 }}></div>
              <div className="right-button">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Loading a new file will discard the data on the current page. Are you sure to continue?",
                      )
                    ) {
                      return;
                    }

                    // https://stackoverflow.com/a/40971885/2603230
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "application/json";

                    input.onchange = (e) => {
                      const file = (e as any).target.files[0];

                      // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/result
                      const reader = new FileReader();

                      reader.onload = () => {
                        const content = reader.result as string;
                        //console.log(content);
                        //console.log(JSON.parse(content));
                        setFormData(JSON.parse(content));
                      };

                      reader.readAsText(file);
                    };
                    input.click();
                  }}
                >
                  Load File
                </button>
              </div>
              <div className="right-button">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    // https://stackoverflow.com/a/45594892/2603230

                    const fileName = `study-${
                      (formData as any)?.studyInfo?.id ?? "unknownId"
                    }-${new Date().getTime()}.json`;

                    const fileToSave = new Blob([JSON.stringify(formData)], {
                      type: "application/json",
                    });

                    saveAs(fileToSave, fileName);
                  }}
                >
                  Save File
                </button>
              </div>
              <div className="right-button">
                <button
                  type="submit"
                  id={VALIDATE_AND_EXPORT_BUTTON_ID}
                  className="btn"
                >
                  Validate and
                  <br />
                  Export for
                  <br />
                  Well Ping
                </button>
              </div>
            </div>
          </Form>

          <div style={{ marginTop: 30 }}>
            <h2>Form JSON</h2>
            <pre id="study-file-json">{JSON.stringify(formData, null, 2)}</pre>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
