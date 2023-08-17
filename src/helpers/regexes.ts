import * as WellPingStudySchemasRegexes from "@wellping/study-schemas/lib/regexes";

function getJSONSchemaPatternStringFromRegExp(regex: RegExp): string {
  return regex.source;
}

export const ID_REGEX = getJSONSchemaPatternStringFromRegExp(
  WellPingStudySchemasRegexes.ID_REGEX,
);
export const QUESTION_ID_REGEX = getJSONSchemaPatternStringFromRegExp(
  WellPingStudySchemasRegexes.QUESTION_ID_REGEX,
);
export const DATETIME_REGEX = getJSONSchemaPatternStringFromRegExp(
  WellPingStudySchemasRegexes.DATETIME_REGEX,
);
export const HOURMINUTESECOND_REGEX = getJSONSchemaPatternStringFromRegExp(
  WellPingStudySchemasRegexes.HOURMINUTESECOND_REGEX,
);
export const NON_EMPTY_REGEX = getJSONSchemaPatternStringFromRegExp(
  /(.|\s)*\S(.|\s)*/, // https://stackoverflow.com/a/45933959/2603230
);
export const DATE_REGEX = getJSONSchemaPatternStringFromRegExp(
  WellPingStudySchemasRegexes.DATE_REGEX,
);