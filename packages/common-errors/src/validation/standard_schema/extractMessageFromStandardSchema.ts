import type { StandardSchemaV1 } from "@standard-schema/spec";

function extractPathFromIssue(
  issue: ReadonlyArray<PropertyKey | StandardSchemaV1.PathSegment>,
): string {
  let pathString = "";

  for (const segment of issue) {
    if (typeof segment === "object") {
      if (segment.key != null) {
        if (typeof segment.key === "number") {
          pathString += `[${String(segment.key)}]`;
        } else if (typeof segment.key === "symbol") {
          pathString += `[SYMBOL:${String(segment.key)}]`;
        } else {
          pathString += `.${String(segment.key)}`;
        }
      }
    } else {
      pathString += `.${String(segment)}`;
    }
  }

  return pathString.slice(1); // Remove the leading dot
}

export const extractMessageFromStandardSchema = (
  failureResult: StandardSchemaV1.FailureResult,
): string => {
  let message = "Data validation failed:\n";
  let issueCount = 0;

  for (const issue of failureResult.issues) {
    issueCount++;
    if (issue.path == null || issue.path.length === 0) {
      message += ` (issue ${issueCount}) ${issue.message}\n`;
    } else {
      message += ` (issue ${issueCount}) [${extractPathFromIssue(issue.path)}]: ${issue.message}\n`;
    }
  }

  return message;
};
