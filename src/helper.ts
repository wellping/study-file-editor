import * as WellPingTypes from "wellping/src/helpers/types";

type EditorStream = any;
type EditorStreams = EditorStream[];

type EditorQuestion = any;
type EditorQuestionsList = EditorQuestion[];
type EditorReusableQuestionBlocks = {
  [questionBlockKey: string]: EditorQuestionsList;
};

function mergeQuestionsList(
  questionsList: WellPingTypes.QuestionsList,
  subQuestionsList: WellPingTypes.QuestionsList,
) {
  const prevQuestionsListLength = Object.keys(questionsList).length;
  const subQuestionsListLength = Object.keys(subQuestionsList).length;

  Object.assign(questionsList, subQuestionsList);

  const newQuestionsListLength = Object.keys(questionsList).length;

  if (
    newQuestionsListLength ===
    prevQuestionsListLength + subQuestionsListLength
  ) {
    // We have correctly merged two list (i.e., no duplicated IDs)
    return;
  } else {
    throw new Error("Duplicated question IDs!");
  }
}

function processMultipleTextQuestion(
  editorMultipleTextQuestion: EditorQuestion,
  questionsList: WellPingTypes.QuestionsList,
  editorReusableQuestionBlocks: EditorReusableQuestionBlocks,
): WellPingTypes.MultipleTextQuestion {
  if (!("repeatedQuestions" in editorMultipleTextQuestion)) {
    return editorMultipleTextQuestion as WellPingTypes.MultipleTextQuestion;
  } else {
    const subQuestionsList = getWellPingQuestionsListFromEditorQuestionsList(
      editorMultipleTextQuestion.repeatedQuestions,
      editorReusableQuestionBlocks,
    );
    mergeQuestionsList(questionsList, subQuestionsList);

    delete editorMultipleTextQuestion.repeatedQuestions;
    const multipleTextQuestion: WellPingTypes.MultipleTextQuestion =
      editorMultipleTextQuestion;
    multipleTextQuestion.repeatedItemStartId = subQuestionsList[0].id;
    return multipleTextQuestion;
  }
}

function getWellPingQuestionsListFromEditorQuestionsList(
  editorQuestionsList: EditorQuestionsList,
  editorReusableQuestionBlocks: EditorReusableQuestionBlocks,
): WellPingTypes.QuestionsList {
  const questionsList: WellPingTypes.QuestionsList = {};

  // Flatten editorReusableQuestionBlocks
  for (let i = 0; i < editorQuestionsList.length; i++) {
    const editorQuestion = editorQuestionsList[i];
    if ("questionBlockId" in editorQuestion) {
      const questionBlockId = editorQuestion.questionBlockId;
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
    const nextQuestionId: WellPingTypes.QuestionId | null =
      i < editorQuestionsList.length - 1 ? editorQuestionsList[i + 1].id : null;

    let question: WellPingTypes.Question;

    switch (editorQuestion.type) {
      case "MultipleText":
        question = processMultipleTextQuestion(
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
  editorObject: any,
): WellPingTypes.StudyFile {
  const studyInfo: WellPingTypes.StudyInfo = editorObject.studyInfo;

  const streams: WellPingTypes.Streams = getWellPingStreamsFromEditorStreams(
    editorObject.streams,
    editorObject.reusableQuestionBlocks,
  );

  const extraData: WellPingTypes.ExtraData = editorObject.extraData; // TODO

  const studyFile: WellPingTypes.StudyFile = {
    studyInfo,
    streams,
    extraData,
  };
  return studyFile;
}
