import * as WellPingTypes from "wellping/src/helpers/types";

function getWellPingQuestionsListFromEditorQuestionsList(
  editorQuestionsList: any[],
  editorReusableQuestionBlocks: any,
): WellPingTypes.QuestionsList {
  const questionsList: WellPingTypes.QuestionsList = {};

  for (const [i, editorQuestion] of editorQuestionsList.entries()) {
    const questionId: WellPingTypes.QuestionId = editorQuestion.id;
    const nextQuestionId: WellPingTypes.QuestionId | null =
      i < editorQuestionsList.length - 1 ? editorQuestionsList[i + 1].id : null;

    const question: WellPingTypes.Question = editorQuestion;
    question.next = nextQuestionId;

    questionsList[questionId] = question;
  }

  return questionsList;
}

function getWellPingStreamsFromEditorStreams(
  editorStreams: any[],
  editorReusableQuestionBlocks: any,
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
  console.warn(__DEV__);

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

  console.log(studyFile);

  return studyFile;
}
