export class ConfluenceMdError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = new.target.name;
  }
}

export class AuthenticationError extends ConfluenceMdError {
  constructor(message = "Authentication failed") {
    super(message, "AUTH_ERROR");
  }
}

export class NotFoundError extends ConfluenceMdError {
  constructor(message = "Not found") {
    super(message, "NOT_FOUND");
  }
}

export class ApiError extends ConfluenceMdError {
  status: number;
  url: string;
  responseBody?: string;

  constructor(status: number, url: string, responseBody?: string) {
    super(`Confluence API error (${status})`, "API_ERROR");
    this.status = status;
    this.url = url;
    this.responseBody = responseBody;
  }
}

export class ConflictError extends ConfluenceMdError {
  localVersion?: number;
  remoteVersion?: number;

  constructor(message = "Remote page has changed", localVersion?: number, remoteVersion?: number) {
    super(message, "CONFLICT");
    this.localVersion = localVersion;
    this.remoteVersion = remoteVersion;
  }
}

export class NotConfluenceMdDirectoryError extends ConfluenceMdError {
  constructor(message = "Not a confluence-md directory") {
    super(message, "NOT_CONFLUENCE_MD_DIR");
  }
}
