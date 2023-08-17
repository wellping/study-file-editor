import * as WellPingTypes from "@wellping/study-schemas/lib/types";
import { StudyFileSchema as WellPingStudyFileSchema } from "@wellping/study-schemas/lib/schemas/StudyFile";
import * as WellPingQuestionSchema from "@wellping/study-schemas/lib/schemas/Question";

import {
  cloneObject,
  ONEOF_OPTION_NAME_KEY,
  ONEOF_OPTION_VALUE_KEY,
  ONEOF_OPTION_VALUE_KEY_PREFIX,
} from "./common";

type EditorStream = any;
type EditorStreams = EditorStream[];

type EditorQuestion = any;
type EditorQuestionsList = EditorQuestion[];
type EditorReusableQuestionBlocks = {
  [questionBlockKey: string]: EditorQuestionsList;
};

function deleteEmptyObject(object: { [key: string]: any }, key: string): void {
  if (Object.keys(object[key]).length === 0) {
    delete object[key];
  }
}

function getDuplicatedQuestionIDsError(duplicatedQuestionIDs: string[]) {
  return new Error(
    `Duplicated question IDs: "${duplicatedQuestionIDs.join('", "')}"!`,
  );
}

function mergeQuestionsList(
  questionsList: WellPingTypes.QuestionsList,
  subQuestionsList: WellPingTypes.QuestionsList,
) {
  const questionsListIDs = Object.keys(questionsList);
  const subQuestionsListIDs = Object.keys(subQuestionsList);

  const duplicatedIDs = questionsListIDs.filter((value) =>
    subQuestionsListIDs.includes(value),
  );
  if (duplicatedIDs.length > 0) {
    throw getDuplicatedQuestionIDsError(duplicatedIDs);
  }

  Object.assign(questionsList, subQuestionsList);
}

function flattenSubquestionsAndReturnQuestionFirstID(
  subquestions: EditorQuestion[] = [],
  questionsList: WellPingTypes.QuestionsList,
  editorReusableQuestionBlocks: EditorReusableQuestionBlocks,
): string | undefined {
  if (subquestions.length === 0) {
    return undefined;
  } else {
    const [subQuestionsList, firstSubQuestionId] =
      getWellPingQuestionsListFromEditorQuestionsList(
        subquestions,
        editorReusableQuestionBlocks,
      );
    mergeQuestionsList(questionsList, subQuestionsList);

    return firstSubQuestionId;
  }
}

function processMultipleTextQuestion(
  editorMultipleTextQuestion: EditorQuestion,
  questionsList: WellPingTypes.QuestionsList,
  editorReusableQuestionBlocks: EditorReusableQuestionBlocks,
): WellPingTypes.MultipleTextQuestion {
  const firstSubQuestionId = flattenSubquestionsAndReturnQuestionFirstID(
    editorMultipleTextQuestion.repeatedQuestions,
    questionsList,
    editorReusableQuestionBlocks,
  );
  delete editorMultipleTextQuestion.repeatedQuestions;
  editorMultipleTextQuestion.repeatedItemStartId = firstSubQuestionId;

  extractAndMergeOneOfOptions(editorMultipleTextQuestion, "dropdownChoices");

  if (editorMultipleTextQuestion.dropdownChoices !== undefined) {
    editorMultipleTextQuestion.dropdownChoices.choices =
      processOptionalChoicesList(
        editorMultipleTextQuestion.dropdownChoices.choices,
      );
  }

  const multipleTextQuestion: WellPingTypes.MultipleTextQuestion =
    WellPingQuestionSchema.getMultipleTextQuestionSchema({
      strict: false,
    }).parse(editorMultipleTextQuestion);

  return multipleTextQuestion;
}

function processYesNoQuestion(
  editorYesNoQuestion: EditorQuestion,
  questionsList: WellPingTypes.QuestionsList,
  editorReusableQuestionBlocks: EditorReusableQuestionBlocks,
): WellPingTypes.YesNoQuestion {
  const firstSubQuestionId_yes = flattenSubquestionsAndReturnQuestionFirstID(
    editorYesNoQuestion.branches?.yes,
    questionsList,
    editorReusableQuestionBlocks,
  );
  const firstSubQuestionId_no = flattenSubquestionsAndReturnQuestionFirstID(
    editorYesNoQuestion.branches?.no,
    questionsList,
    editorReusableQuestionBlocks,
  );

  delete editorYesNoQuestion.branches;

  editorYesNoQuestion.branchStartId = {};
  editorYesNoQuestion.branchStartId.yes = firstSubQuestionId_yes;
  editorYesNoQuestion.branchStartId.no = firstSubQuestionId_no;
  const yesNoQuestion: WellPingTypes.YesNoQuestion =
    WellPingQuestionSchema.getYesNoQuestionSchema({
      strict: false,
    }).parse(editorYesNoQuestion);
  return yesNoQuestion;
}

type LineSeparatedString = { lineSeparatedString: string };
function processChoicesList(input: string[] | LineSeparatedString): string[];
function processChoicesList(
  input: string[] | string | LineSeparatedString,
): string[] | string;
function processChoicesList(
  input: string[] | string | LineSeparatedString,
): string[] | string {
  if (Array.isArray(input)) {
    return input; // Directly return the array.
  } else if (typeof input === "object") {
    return input.lineSeparatedString
      .split("\n")
      .filter((value) => value.length > 0);
  } else {
    return input; // Directly return the name of the reusable list.
  }
}
function processOptionalChoicesList(
  input: null | string[] | string | LineSeparatedString,
): string[] | string | undefined {
  if (input === null) {
    // Schema requires it to be `undefined` instead of `null`.
    return undefined;
  } else {
    return processChoicesList(input);
  }
}

function processChoiceQuestion(
  editorChoiceQuestion: EditorQuestion,
  questionsList: WellPingTypes.QuestionsList,
  editorReusableQuestionBlocks: EditorReusableQuestionBlocks,
): WellPingTypes.ChoicesQuestion {
  const choiceValues: string[] | string = processChoicesList(
    editorChoiceQuestion.choices,
  );
  editorChoiceQuestion.choices = choiceValues;

  if (!("specialCasesBranches" in editorChoiceQuestion)) {
    return editorChoiceQuestion;
  }

  editorChoiceQuestion.specialCasesStartId = [];

  for (const specialCasesBranch of editorChoiceQuestion.specialCasesBranches) {
    const choiceValue = specialCasesBranch.choice;
    if (Array.isArray(choiceValues)) {
      if (!choiceValues.includes(choiceValue)) {
        throw new Error(
          `The question "${editorChoiceQuestion.id}"'s "specialCasesBranch" contains a choice value "${choiceValue}" which is not in its choice list.`,
        );
      }
    }

    const subquestions = specialCasesBranch.questions;

    const firstSubQuestionId = flattenSubquestionsAndReturnQuestionFirstID(
      subquestions,
      questionsList,
      editorReusableQuestionBlocks,
    );
    editorChoiceQuestion.specialCasesStartId.push([
      choiceValue,
      firstSubQuestionId,
    ]);
  }

  delete editorChoiceQuestion.specialCasesBranches;

  return WellPingQuestionSchema.getChoicesQuestionSchema({
    strict: false,
  }).parse(editorChoiceQuestion) as WellPingTypes.ChoicesQuestion;
}

/**
 * Returns a question list as well as the ID of the first question.
 */
function getWellPingQuestionsListFromEditorQuestionsList(
  editorQuestionsList: EditorQuestionsList,
  editorReusableQuestionBlocks: EditorReusableQuestionBlocks,
): [WellPingTypes.QuestionsList, WellPingTypes.QuestionId] {
  const questionsList: WellPingTypes.QuestionsList = {};

  // Flatten editorReusableQuestionBlocks
  const previousQuestionBlocksIDs: string[] = [];
  for (let i = 0; i < editorQuestionsList.length; i++) {
    const editorQuestion = editorQuestionsList[i];
    if ("questionBlockId" in editorQuestion) {
      const questionBlockId = editorQuestion.questionBlockId;

      if (previousQuestionBlocksIDs.includes(questionBlockId)) {
        throw new Error(
          `Loop detected in question blocks: ` +
            `"${previousQuestionBlocksIDs.join(
              `" → "`,
            )}" → "${questionBlockId}"`,
        );
      }
      previousQuestionBlocksIDs.push(questionBlockId);

      // Replace this `questionBlockId` object with the actual questions.
      editorQuestionsList.splice(
        i,
        1,
        ...cloneObject(editorReusableQuestionBlocks[questionBlockId]),
      );
      i--; // We need to look at the replaced questions too (maybe it is also a question block).
      continue;
    }
  }

  const firstQuestionId = editorQuestionsList[0].id;

  for (let i = 0; i < editorQuestionsList.length; i++) {
    const editorQuestion = editorQuestionsList[i];
    const questionId: WellPingTypes.QuestionId = editorQuestion.id;

    if (questionId in questionsList) {
      throw getDuplicatedQuestionIDsError([questionId]);
    }

    const nextQuestionId: WellPingTypes.QuestionId | null =
      i < editorQuestionsList.length - 1 ? editorQuestionsList[i + 1].id : null;

    let question: WellPingTypes.Question;

    editorQuestion.next = nextQuestionId;

    switch (editorQuestion.type as WellPingTypes.QuestionTypeType) {
      case "MultipleText":
        question = processMultipleTextQuestion(
          editorQuestion,
          questionsList,
          editorReusableQuestionBlocks,
        );
        break;

      case "YesNo":
        question = processYesNoQuestion(
          editorQuestion,
          questionsList,
          editorReusableQuestionBlocks,
        );
        break;

      case "ChoicesWithSingleAnswer":
      case "ChoicesWithMultipleAnswers":
        question = processChoiceQuestion(
          editorQuestion,
          questionsList,
          editorReusableQuestionBlocks,
        );
        break;

      default:
        question = editorQuestion;
        break;
    }

    questionsList[questionId] = question;
  }

  return [questionsList, firstQuestionId];
}

function getWellPingStreamsFromEditorStreams(
  editorStreams: EditorStreams,
  editorReusableQuestionBlocks: EditorReusableQuestionBlocks,
): [WellPingTypes.Streams, WellPingTypes.StreamsStartingQuestionIds] {
  const streamsStartingQuestionIds: WellPingTypes.StreamsStartingQuestionIds =
    {};

  const streams: WellPingTypes.Streams = getObjectFromIDValueArray<
    EditorQuestionsList,
    WellPingTypes.QuestionsList
  >(editorStreams, (id, value) => {
    const [questionsList, firstQuestionId] =
      getWellPingQuestionsListFromEditorQuestionsList(
        value,
        editorReusableQuestionBlocks,
      );

    streamsStartingQuestionIds[id] = firstQuestionId;

    return questionsList;
  });

  return [streams, streamsStartingQuestionIds];
}

function getWellPingStreamGroupMappingsFromEditorStreams(
  editorStreams: EditorStreams
): WellPingTypes.StreamGroupMapping {

  const mapping: WellPingTypes.StreamGroupMapping = [];
  for (let i=0; i<editorStreams.length; i++) {
    mapping.push({
      assignedGroup: editorStreams[i].assignedGroup,
      stream: editorStreams[i].id
    })
  }

  return mapping;
}

function getObjectFromIDValueArray<T, R>(
  array: { id: string; value: T }[] = [],
  transform: (id: string, value: T) => R,
): {
  [key: string]: R;
} {
  const object: { [key: string]: R } = {};
  for (const item of array) {
    object[item.id] = transform(item.id, item.value);
  }
  return object;
}

function replaceIDValueArrayWithObject<T, R>(
  arrayParent: { [key: string]: any },
  arrayKey: string,
  transform: (id: string, value: T) => R,
): void {
  if (!(arrayKey in arrayParent)) {
    return;
  }

  arrayParent[arrayKey] = getObjectFromIDValueArray(
    arrayParent[arrayKey],
    transform,
  );
}

function extractAndMergeOneOfOptions(
  parentObject: {
    // Actually just `key` (not every key).
    [key: string]: {
      [ONEOF_OPTION_NAME_KEY]?: string;
      [optionName: string]: any;
    };
  },
  key: string,
): void {
  if (
    !(ONEOF_OPTION_NAME_KEY in parentObject[key]) ||
    parentObject[key][ONEOF_OPTION_NAME_KEY] === undefined
  ) {
    return;
  }

  const optionName = parentObject[key][ONEOF_OPTION_NAME_KEY] as string;
  const optionValue = parentObject[key][ONEOF_OPTION_VALUE_KEY(optionName)];
  let clonedOptionValue: any;
  if (optionValue === undefined) {
    // This happens when there is no extra option value with this option name.
    clonedOptionValue = undefined;
  } else {
    // Get the value (clone it so we can still use it after deleting them).
    clonedOptionValue = cloneObject(optionValue);
  }

  // Delete all `_option` related keys.
  delete parentObject[key][ONEOF_OPTION_NAME_KEY];
  for (const childKey of Object.keys(parentObject[key])) {
    if (childKey.startsWith(ONEOF_OPTION_VALUE_KEY_PREFIX)) {
      delete parentObject[key][childKey];
    }
  }

  if (Object.keys(parentObject[key]).length > 0) {
    // If there are other keys remaining in the object, we merge it.
    Object.assign(parentObject[key], clonedOptionValue);
  } else {
    // Otherwise we set the key's value as the value
    // (this is useful in the case where we don't have anything else in the object
    // and the value is array or integer).
    parentObject[key] = clonedOptionValue;
  }
}

export function getWellPingStudyFileFromEditorObject(
  editorObject_ori: any,
): WellPingTypes.StudyFile {
  // Make a copy of the input so that we will not change `formData`.
  const editorObject = cloneObject(editorObject_ori);

  // Delete empty objects.
  deleteEmptyObject(editorObject.studyInfo.server, "beiwe");
  deleteEmptyObject(editorObject.studyInfo.server, "firebase");

  replaceIDValueArrayWithObject<
    any,
    WellPingTypes.PlaceholderReplacementValueTreatmentOptions
  >(
    editorObject.studyInfo,
    "specialVariablePlaceholderTreatments",
    (_, value) => {
      const decap = value.decapitalizeFirstCharacter ?? {};
      extractAndMergeOneOfOptions(decap, "options");
      return value;
    },
  );

  extractAndMergeOneOfOptions(editorObject.studyInfo, "streamsOrder");

  const studyInfo: WellPingTypes.StudyInfo = editorObject.studyInfo;

  const reusableQuestionBlocksMap: EditorReusableQuestionBlocks =
    getObjectFromIDValueArray<any, EditorQuestionsList>(
      editorObject.reusableQuestionBlocks,
      (_, value) => value,
    );

  const [streams, streamsStartingQuestionIds] =
    getWellPingStreamsFromEditorStreams(
      editorObject.streams,
      reusableQuestionBlocksMap,
    );
  studyInfo.streamsStartingQuestionIds = streamsStartingQuestionIds;

  replaceIDValueArrayWithObject<string[] | LineSeparatedString, string[]>(
    editorObject.extraData,
    "reusableChoices",
    (_, value) => {
      return processChoicesList(value);
    },
  );

  const extraData: WellPingTypes.ExtraData = editorObject.extraData;

  const streamGroupMapping : WellPingTypes.StreamGroupMapping = getWellPingStreamGroupMappingsFromEditorStreams(editorObject.streams);

  const studyFile: WellPingTypes.StudyFile = {
    studyInfo,
    streams,
    extraData,
    streamGroupMapping
  };

  console.log(studyFile);
  // An error will be thrown if parsing fails.
  WellPingStudyFileSchema.parse(studyFile);

  return studyFile;
}
