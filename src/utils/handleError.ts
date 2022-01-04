import { toast } from "react-toastify";

function makeErrorMessage(e: unknown, errorPrefix = ""): string {
  let errMess = `${errorPrefix} `;
  if (typeof e === "string") errMess += e;
  else if (e instanceof Error) errMess += e.message;
  else errMess += "unknown error";
  return errMess;
}

export default function handleError(e: unknown, errorPrefix = ""): void {
  toast.error(makeErrorMessage(e, errorPrefix));
}
