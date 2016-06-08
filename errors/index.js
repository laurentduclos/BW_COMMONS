/**
 * This error is used when validating data send by a controller
 * All controller that pass data to a repo should listen for this error
 * @param {String} message [description]
 */
export function ValidationError(message = 'Validation failled') {
  this.name = 'ValidationError';
  this.message = message;
  this.stack = (new Error()).stack;
}
ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;


/**
 * This error is used when validating data send by a controller
 * All controller that pass data to a repo should listen for this error
 * @param {String} message [description]
 */
export function RepoMalformedError(message = 'The repository was malformed failled') {
  this.name = 'RepoMalformedError';
  this.message = message;
  this.stack = (new Error()).stack;
}
RepoMalformedError.prototype = Object.create(Error.prototype);
RepoMalformedError.prototype.constructor = RepoMalformedError;