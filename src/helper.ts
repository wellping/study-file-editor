import * as WellPingTypes from "@wellping/study-schemas/lib/types";
import { StudyFileSchema as WellPingStudyFileSchema } from "@wellping/study-schemas/lib/schemas/StudyFile";

type EditorStream = any;
type EditorStreams = EditorStream[];

type EditorQuestion = any;
type EditorQuestionsList = EditorQuestion[];
type EditorReusableQuestionBlocks = {
  [questionBlockKey: string]: EditorQuestionsList;
};

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
    const firstSubQuestionId = subquestions[0].id;

    const subQuestionsList = getWellPingQuestionsListFromEditorQuestionsList(
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

  const multipleTextQuestion: WellPingTypes.MultipleTextQuestion =
    editorMultipleTextQuestion;
  multipleTextQuestion.repeatedItemStartId = firstSubQuestionId;
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

  const yesNoQuestion: WellPingTypes.YesNoQuestion = editorYesNoQuestion;
  yesNoQuestion.branchStartId = {};
  yesNoQuestion.branchStartId.yes = firstSubQuestionId_yes;
  yesNoQuestion.branchStartId.no = firstSubQuestionId_no;
  return yesNoQuestion;
}

function processChoicesList(
  input: string[] | string | { lineSeparatedString: string },
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

  return editorChoiceQuestion as WellPingTypes.ChoicesQuestion;
}

function getWellPingQuestionsListFromEditorQuestionsList(
  editorQuestionsList: EditorQuestionsList,
  editorReusableQuestionBlocks: EditorReusableQuestionBlocks,
): WellPingTypes.QuestionsList {
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
        ...editorReusableQuestionBlocks[questionBlockId],
      );
      i--; // We need to look at the replaced questions too (maybe it is also a question block).
      continue;
    }
  }

  for (let i = 0; i < editorQuestionsList.length; i++) {
    const editorQuestion = editorQuestionsList[i];
    const questionId: WellPingTypes.QuestionId = editorQuestion.id;

    if (questionId in questionsList) {
      throw getDuplicatedQuestionIDsError([questionId]);
    }

    const nextQuestionId: WellPingTypes.QuestionId | null =
      i < editorQuestionsList.length - 1 ? editorQuestionsList[i + 1].id : null;

    let question: WellPingTypes.Question;

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

    question.next = nextQuestionId;

    questionsList[questionId] = question;
  }

  return questionsList;
}

function getWellPingStreamsFromEditorStreams(
  editorStreams: EditorStreams,
  editorReusableQuestionBlocks: EditorReusableQuestionBlocks,
): WellPingTypes.Streams {
  const streams: WellPingTypes.Streams = {};
  for (const editorStream of editorStreams) {
    streams[editorStream.id] = getWellPingQuestionsListFromEditorQuestionsList(
      editorStream.questions,
      editorReusableQuestionBlocks,
    );
  }
  return streams;
}

export function getWellPingStudyFileFromEditorObject(
  editorObject_ori: any,
): WellPingTypes.StudyFile {
  // Make a copy of the input so that we will not change `formData`.
  const editorObject = JSON.parse(JSON.stringify(editorObject_ori));

  const studyInfo: WellPingTypes.StudyInfo = editorObject.studyInfo;

  const reusableQuestionBlocksMap: EditorReusableQuestionBlocks = {};
  for (const reusableQuestionBlock of editorObject.reusableQuestionBlocks) {
    reusableQuestionBlocksMap[reusableQuestionBlock.id] =
      reusableQuestionBlock.questions;
  }

  const streams: WellPingTypes.Streams = getWellPingStreamsFromEditorStreams(
    editorObject.streams,
    reusableQuestionBlocksMap,
  );

  const reusableChoices: { [key: string]: string[] } = {};
  for (const reusableChoice of editorObject.extraData?.reusableChoices ?? []) {
    const choices = processChoicesList(reusableChoice.items) as string[];
    reusableChoices[reusableChoice.id] = choices;
  }
  editorObject.extraData.reusableChoices = reusableChoices;
  const extraData: WellPingTypes.ExtraData = editorObject.extraData;

  const studyFile: WellPingTypes.StudyFile = {
    studyInfo,
    streams,
    extraData,
  };

  // An error will be thrown if parsing fails.
  WellPingStudyFileSchema.parse(studyFile);

  return studyFile;
}
