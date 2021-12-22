import React from "react";
import Form, { UiSchema } from "@rjsf/core";
import { saveAs } from "file-saver";
import { JSONSchema7 } from "json-schema";
import "./App.css";
import { getWellPingStudyFileFromEditorObject } from "./helper";
import {
  ID_REGEX,
  QUESTION_ID_REGEX,
  DATETIME_REGEX,
  HOURMINUTESECOND_REGEX,
  NON_EMPTY_REGEX,
} from "./regexes";

const VALIDATE_BUTTON_ID = "button-validate";
const VALIDATE_AND_EXPORT_BUTTON_ID = "button-export";

const WELLPING_EDITOR_SAVE_INFO_KEY = "_wellpingEditor";
type WellpingEditorSaveInfo = {
  editorVersion: string;
};
const WELLPING_EDITOR_VERSION_VALUE = "0.1";
const WELLPING_EDITOR_SAVE_INFO: WellpingEditorSaveInfo = {
  editorVersion: WELLPING_EDITOR_VERSION_VALUE,
};
const WELLPING_EDITOR_SAVE_INFO_ENCLOSED = {
  [WELLPING_EDITOR_SAVE_INFO_KEY]: WELLPING_EDITOR_SAVE_INFO,
};
function parseLoadedEditorFileString(loadedEditorFile: string): any {
  const parsedLoadedEditorFile = JSON.parse(loadedEditorFile);

  if (!(WELLPING_EDITOR_SAVE_INFO_KEY in parsedLoadedEditorFile)) {
    throw new Error("The loaded file is not a Well Ping Editor File!");
  }

  const loadedFileSaveInfo: WellpingEditorSaveInfo =
    parsedLoadedEditorFile[WELLPING_EDITOR_SAVE_INFO_KEY];
  if (loadedFileSaveInfo.editorVersion !== WELLPING_EDITOR_VERSION_VALUE) {
    throw new Error(
      "The loaded file is saved in an earlier version of Well Ping Study File Editor!",
    );
  }

  delete parsedLoadedEditorFile[WELLPING_EDITOR_SAVE_INFO_KEY];

  return parsedLoadedEditorFile;
}

function getIDsFieldAsArrayAndEmptyStringIfEmpty(
  list: { id: string | null; [key: string]: any }[] = [],
): string[] {
  const keys = list
    .map((item) => item.id ?? "") // All IDs
    .filter((value) => value); // Non-null values only
  if (keys.length === 0) {
    // The enum cannot be 0 length
    return [""];
  } else {
    return keys;
  }
}

function saveJSONFile(fileName: string, object: any) {
  // https://stackoverflow.com/a/45594892/2603230

  const fileNameWithExtension = `${fileName}.json`;

  const fileToSave = new Blob([JSON.stringify(object)], {
    type: "application/json",
  });

  saveAs(fileToSave, fileNameWithExtension);
}

function App() {
  const [pingsFrequencyCount, setPingsFrequencyCount] =
    React.useState<number>(0);
  const [streamIds, setStreamIds] = React.useState<string[]>(
    getIDsFieldAsArrayAndEmptyStringIfEmpty(),
  );
  const [choicesListsIds, setChoicesListsIds] = React.useState<string[]>(
    getIDsFieldAsArrayAndEmptyStringIfEmpty(),
  );
  const [questionBlockIds, setQuestionBlockIds] = React.useState<string[]>(
    getIDsFieldAsArrayAndEmptyStringIfEmpty(),
  );

  // Note: this form data JSON is different from the Well Ping study file JSON (to facilicate easier user input).
  // Conversion with `getWellPingStudyFileJSONFromEditorJSON` is needed to get the Well Ping study file JSON.
  const [formData, setFormData] = React.useState<any>(null);

  // Notice that we have use this instead of `useEffects` because we want
  // `setChoicesListsIds` and `setQuestionBlockIds` to be done before
  // `setFormData`.
  function updateFormData(newFormData: any) {
    setPingsFrequencyCount(newFormData?.studyInfo?.pingsFrequency?.length ?? 0);
    setStreamIds(getIDsFieldAsArrayAndEmptyStringIfEmpty(newFormData?.streams));
    setChoicesListsIds(
      getIDsFieldAsArrayAndEmptyStringIfEmpty(
        newFormData?.extraData?.reusableChoices,
      ),
    );
    setQuestionBlockIds(
      getIDsFieldAsArrayAndEmptyStringIfEmpty(
        newFormData?.reusableQuestionBlocks,
      ),
    );

    setFormData(newFormData);
  }

  const [liveValidate, setLiveValidate] = React.useState<boolean>(true);

  const schema: JSONSchema7 = {
    title: "Study File",
    type: "object",
    definitions: {
      streamSelection: {
        type: "string",
        enum: streamIds,
      },

      streamsOrderOnADay: {
        type: "array",
        items: {
          $ref: "#/definitions/streamSelection",
        },
        minItems: pingsFrequencyCount,
        maxItems: pingsFrequencyCount,
      },

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

      choiceQuestion_choices_list_array: {
        title: "List",
        type: "array",
        items: {
          type: "string",
        },
        uniqueItems: true,
        minItems: 1,
      },
      choiceQuestion_choices_list_lineSeparatedString: {
        // We set this as an object to distinguish it with "Reusable Choices List Name" below which is also a string.
        title: "Line-Separated Text",
        type: "object",
        properties: {
          lineSeparatedString: {
            title: "Line-Separated Text",
            type: "string",
            format: "textarea",
            pattern: NON_EMPTY_REGEX,
          },
        },
        required: ["lineSeparatedString"],
      },
      choiceQuestion_choices_list: {
        title: "Choices List",
        oneOf: [
          {
            $ref: "#/definitions/choiceQuestion_choices_list_array",
          },
          {
            $ref: "#/definitions/choiceQuestion_choices_list_lineSeparatedString",
          },
        ],
      },
      choiceQuestion_choices: {
        oneOf: [
          {
            $ref: "#/definitions/choiceQuestion_choices_list_array",
          },
          {
            $ref: "#/definitions/choiceQuestion_choices_list_lineSeparatedString",
          },
          {
            title: "Reusable Choices List Name",
            type: "string",
            enum: choicesListsIds,
          },
        ],
      },
      choiceQuestion_specialCasesBranches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            choice: {
              title: "Choice value",
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
          specialCasesBranches: {
            $ref: "#/definitions/choiceQuestion_specialCasesBranches",
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
          specialCasesBranches: {
            $ref: "#/definitions/choiceQuestion_specialCasesBranches",
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
          branches: {
            type: "object",
            title: "Branches",
            properties: {
              yes: {
                title: 'Questions to show if the user answered "Yes"',
                $ref: "#/definitions/listOfQuestions",
              },
              no: {
                title: 'Questions to show if the user answered "No"',
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
            oneOf: [
              {
                title: "Don't show dropdown",
                type: "null",
              },
              {
                title: "Show dropdown choice",
                $ref: "#/definitions/choiceQuestion_choices",
              },
            ],
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
            pattern: QUESTION_ID_REGEX,
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
        required: [
          "id",
          "studyFileURL",
          "consentFormUrl",
          "startDate",
          "endDate",
          "pingsFrequency",
          "streamsOrder",
          "streamInCaseOfError",
        ],
        properties: {
          id: {
            type: "string",
            title: "Study ID",
            pattern: ID_REGEX,
          },

          version: {
            type: "string",
            title: "Study File Version",
            description: "This string will be displayed at the top of the app.",
          },

          studyFileURL: {
            type: "string",
            format: "uri",
            title: "Study File URL",
            description:
              "The URL that host this study file (which could be a JSON or a YAML file). " +
              "The app fetches this URL in the background at every start and loads the downloaded new file at the next start.",
          },

          dashboardURL: {
            type: "string",
            format: "uri",
            title: "Dashboard URL",
          },

          server: {
            title: "",
            type: "object",
            properties: {
              firebase: {
                title: "",
                type: "object",
                properties: {
                  config: {
                    title: "Firebase Config JSON",
                    description:
                      "The Firebase config JSON for the study. Leave empty if you do not intend to use Firebase.",
                    type: "string",
                    format: "textarea",
                  },
                },
              },
              beiwe: {
                title: "",
                type: "object",
                properties: {
                  serverUrl: {
                    title: "Beiwe Server URL",
                    format: "uri",
                    description:
                      "The server URL of Beiwe backend for the study. Leave empty if you do not intend to use Beiwe.",
                    type: "string",
                  },
                },
              },
            },
          },

          consentFormUrl: {
            type: "string",
            format: "uri",
            title: "Consent Form URL",
            description:
              "The consent form will be shown to the user on their first log in.",
          },

          contactEmail: {
            type: "string",
            title: "Contact Email",
            description:
              'If provided, a button labeled "Contact Staff" will be displayed at the top of the app. Pressing the button will start an email to this address.',
          },

          weekStartsOn: {
            type: "integer",
            title: "Week Starts On...",
            description:
              'The first day of the week. Used to determine "the number of pings this week".',
            anyOf: [
              { type: "integer", title: "Sunday", enum: [0] },
              { type: "integer", title: "Monday", enum: [1] },
              { type: "integer", title: "Tuesday", enum: [2] },
              { type: "integer", title: "Wednesday", enum: [3] },
              { type: "integer", title: "Thursday", enum: [4] },
              { type: "integer", title: "Friday", enum: [5] },
              { type: "integer", title: "Saturday", enum: [6] },
            ],
            default: 1,
          },

          // Note that for `startDate` and `endDate`,
          // - we cannot use `format: datetime` because the time stored in JSON is different from the time shown (due to timezone)
          // - we cannot use `format: alt-datetime` because after loading a JSON file, the value is not populated in the field.
          startDate: {
            type: "string",
            title: "Study Start Date",
            description:
              'The first ping will be sent after this time (local to the user\'s phone). Please enter the date in the format like "2020-03-10T08:00:00.000Z".',
            pattern: DATETIME_REGEX,
          },
          endDate: {
            type: "string",
            title: "Study End Date",
            description:
              'No ping will be sent after this time (local to the user\'s phone). Please enter the date in the format like "2020-03-10T08:00:00.000Z".',
            pattern: DATETIME_REGEX,
          },

          pingsFrequency: {
            type: "array",
            title: "Pings Frequency",
            items: {
              type: "object",
              title: "Ping",
              properties: {
                earliestPingNotificationTime: {
                  type: "string",
                  title:
                    "The earliest time that the ping will be sent (inclusive).",
                  pattern: HOURMINUTESECOND_REGEX,
                },
                latestPingNotificationTime: {
                  type: "string",
                  title:
                    "The latest time that the ping will be sent (inclusive).",
                  pattern: HOURMINUTESECOND_REGEX,
                },
                expireAfterTime: {
                  type: "string",
                  title: "Expire After...",
                  pattern: HOURMINUTESECOND_REGEX,
                },
              },
              required: ["earliestPingNotificationTime", "expireAfterTime"],
            },
            minItems: 1,
          },

          streamsOrder: {
            oneOf: [
              {
                title: "Different order of streams every day of the week",
                type: "object",
                properties: {
                  sunday: {
                    title: "Sunday",
                    $ref: "#/definitions/streamsOrderOnADay",
                  },
                  monday: {
                    title: "Monday",
                    $ref: "#/definitions/streamsOrderOnADay",
                  },
                  tuesday: {
                    title: "Tuesday",
                    $ref: "#/definitions/streamsOrderOnADay",
                  },
                  wednesday: {
                    title: "Wednesday",
                    $ref: "#/definitions/streamsOrderOnADay",
                  },
                  thursday: {
                    title: "Thursday",
                    $ref: "#/definitions/streamsOrderOnADay",
                  },
                  friday: {
                    title: "Friday",
                    $ref: "#/definitions/streamsOrderOnADay",
                  },
                  saturday: {
                    title: "Saturday",
                    $ref: "#/definitions/streamsOrderOnADay",
                  },
                },
                required: [
                  "sunday",
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                ],
              },
              // It is important that this comes after that because the reverse
              // order seems to not update the oneOf selection during loading.
              {
                title: "Same order of streams every day of the week",
                $ref: "#/definitions/streamsOrderOnADay",
              },
            ],
          },

          streamInCaseOfError: {
            title: "Stream to show when there is an error",
            $ref: "#/definitions/streamSelection",
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
            type: "array",
            items: {
              title: "Choices List",
              type: "object",
              properties: {
                id: {
                  title: "Choices List ID",
                  type: "string",
                },
                items: {
                  $ref: "#/definitions/choiceQuestion_choices_list",
                },
              },
              required: ["id", "items"],
            },
          },
        },
      },
      reusableQuestionBlocks: {
        title: "Reusable Question Blocks",
        type: "array",
        items: {
          title: "Question Block",
          type: "object",
          properties: {
            id: {
              title: "Question Block ID",
              type: "string",
            },
            questions: {
              $ref: "#/definitions/listOfNonEmptyQuestions",
            },
          },
          required: ["id", "questions"],
        },
      },
    },

    required: ["studyInfo", "streams"],
  };

  const uiSchema: UiSchema = {
    studyInfo: {
      dashboardURL: {
        "ui:description": (
          <>
            <p>
              The URL of the dashboard that will be shown to the user on the
              home page.
            </p>
            <p>Placeholders you could use in this URL:</p>
            <ul>
              <li>
                <code>__USERNAME__</code>: TODO
              </li>
            </ul>
          </>
        ),
      },
    },
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
            uiSchema={uiSchema}
            formData={formData}
            onChange={(e) => {
              updateFormData(e.formData);
            }}
            onSubmit={({ formData }, e) => {
              // Ugly hack :(
              // https://stackoverflow.com/a/33264162/2603230
              const typeOfSubmit = document.activeElement?.id;
              switch (typeOfSubmit) {
                case VALIDATE_BUTTON_ID:
                case VALIDATE_AND_EXPORT_BUTTON_ID:
                  try {
                    const wellPingStudyFile =
                      getWellPingStudyFileFromEditorObject(formData);

                    console.log(wellPingStudyFile);

                    if (typeOfSubmit === VALIDATE_AND_EXPORT_BUTTON_ID) {
                      const fileName = `wellping-export-${
                        wellPingStudyFile.studyInfo.id
                      }-${new Date().getTime()}`;
                      saveJSONFile(fileName, wellPingStudyFile);
                    }
                  } catch (error) {
                    console.error(error);
                    alert(error);
                  }
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
                        try {
                          const loadedFormData =
                            parseLoadedEditorFileString(content);
                          updateFormData(loadedFormData);
                        } catch (error) {
                          alert(error);
                        }
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
                    const fileName = `wellping-editor-${
                      (formData as any)?.studyInfo?.id ?? "unknownId"
                    }-${new Date().getTime()}`;
                    saveJSONFile(fileName, {
                      ...WELLPING_EDITOR_SAVE_INFO_ENCLOSED,
                      ...(formData as any),
                    });
                  }}
                >
                  Save File
                </button>
              </div>
              <div style={{ marginTop: 30 }}></div>
              <div className="right-button">
                <button
                  type="submit"
                  id={VALIDATE_AND_EXPORT_BUTTON_ID}
                  className="btn btn-default"
                  onClick={() => {
                    // Jump to the top to see potential errors.
                    window.scroll(0, 0);
                  }}
                >
                  Validate and
                  <br />
                  Export for
                  <br />
                  Well Ping
                </button>
                <p style={{ fontSize: 10 }}>
                  (Remember to also
                  <br />
                  click "Save File"
                  <br />
                  so that you could
                  <br />
                  edit it later!)
                </p>
              </div>
            </div>
          </Form>

          <div style={{ marginTop: 30 }}>
            <h2>Form JSON</h2>
            <pre id="study-file-json">{JSON.stringify(formData, null, 2)}</pre>

            <pre>
              pingsFrequencyCount:{" "}
              {JSON.stringify(pingsFrequencyCount, null, 2)}
            </pre>
            <pre>streamIds: {JSON.stringify(streamIds, null, 2)}</pre>
            <pre>
              choicesListsIds: {JSON.stringify(choicesListsIds, null, 2)}
            </pre>
            <pre>
              questionBlockIds: {JSON.stringify(questionBlockIds, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
