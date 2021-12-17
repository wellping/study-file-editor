import React from "react";
import Form from "@rjsf/core";
import { JSONSchema7 } from "json-schema";
import "./App.css";

const idRegex = "^\\w+$";

const VALIDATE_BUTTON_ID = "button-validate";
const VALIDATE_AND_EXPORT_BUTTON_ID = "button-export";

function App() {
  const [formData, setFormData] = React.useState(null);

  const [liveValidate, setLiveValidate] = React.useState(true);

  const [questionBlockIds, setQuestionBlockIds] = React.useState([""]);

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
            pattern: idRegex,
          },
          variableName: {
            type: "string",
            title: "Answer text's placeholder in enclosing question ID",
            pattern: idRegex,
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
        type: "array",
        items: {
          title: "Stream",
          type: "object",
          properties: {
            id: {
              type: "string",
              title: "Stream ID",
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
            formData={formData}
            onChange={(e) => {
              let newQuestionBlockIds = Object.keys(
                (e.formData as any).reusableQuestionBlocks,
              );
              if (newQuestionBlockIds.length === 0) {
                newQuestionBlockIds = [""]; // The enum cannot be 0 length
              }
              setQuestionBlockIds(newQuestionBlockIds);

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
                <button type="button" className="btn btn-danger">
                  Load File
                </button>
              </div>
              <div className="right-button">
                <button type="submit" className="btn btn-success">
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
