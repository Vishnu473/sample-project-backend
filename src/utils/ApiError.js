//Custom Implementation of APIError class that extends Error class
//Takes StatusCode, errors, message
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.success = false
    this.message = message
    this.data = null

    if (stack) {
      this.stack = stack;
    } else {
      this.stack = Error.captureStackTrace(this, this.constructor);
    }
  }
}

export {ApiError}
