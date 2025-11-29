export function createSesError(
	code: string,
	message?: string,
	statusCode?: number
): SesError {
	switch (code) {
		case 'missing_credentials_config':
			return new MissingCredentialsConfigError()
		case 'AccountSendingPausedException':
			return new AccountSendingPausedError()
		case 'ConfigurationSetDoesNotExist':
			return new ConfigurationSetDoesNotExistError(message)
		case 'ConfigurationSetSendingPausedException':
			return new ConfigurationSetSendingPausedError(message)
		case 'MailFromDomainNotVerifiedException':
			return new MailFromDomainNotVerifiedError()
		case 'MessageRejected':
			return new MessageRejectedError(message)
		case 'InvalidParameterValue':
			return new InvalidParameterValueError(message)
		case 'MissingRequiredParameter':
			return new MissingRequiredParameterError(message)
		case 'SignatureDoesNotMatch':
			return new SignatureDoesNotMatchError()
		case 'AccessDenied':
		case 'AccessDeniedException':
			return new AccessDeniedError(message)
		case 'InvalidClientTokenId':
			return new InvalidClientTokenIdError()
		case 'IncompleteSignature':
			return new IncompleteSignatureError()
		case 'Throttling':
			return new ThrottlingError()
		case 'ServiceUnavailable':
			return new ServiceUnavailableError()
		case 'InternalFailure':
			return new InternalFailureError()
		case 'network_error':
			return new NetworkError(message)
		default:
			return new SesError(
				message || 'Unknown error occurred',
				statusCode || 500,
				code,
				'Please check the AWS SES documentation for more information.'
			)
	}
}

export class SesError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
		public readonly code: string,
		public readonly suggestion: string
	) {
		super(message)
		this.name = 'SesError'
	}
}

export class MissingCredentialsConfigError extends SesError {
	constructor() {
		super(
			'Missing AWS credentials. Please provide accessKeyId, secretAccessKey, and region via the configuration options or set the AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION environment variables.',
			500,
			'missing_credentials_config',
			'Provide AWS credentials via the configuration options or set the appropriate environment variables.'
		)
		this.name = 'MissingCredentialsConfigError'
	}
}

export class AccountSendingPausedError extends SesError {
	constructor() {
		super(
			'Email sending is disabled for your entire Amazon SES account.',
			400,
			'AccountSendingPausedException',
			'Enable email sending for your Amazon SES account using UpdateAccountSendingEnabled.'
		)
		this.name = 'AccountSendingPausedError'
	}
}

export class ConfigurationSetDoesNotExistError extends SesError {
	constructor(message?: string) {
		super(
			message || 'The configuration set does not exist.',
			400,
			'ConfigurationSetDoesNotExist',
			'Verify that the configuration set name is correct or create a new configuration set.'
		)
		this.name = 'ConfigurationSetDoesNotExistError'
	}
}

export class ConfigurationSetSendingPausedError extends SesError {
	constructor(message?: string) {
		super(
			message || 'Email sending is disabled for the configuration set.',
			400,
			'ConfigurationSetSendingPausedException',
			'Enable email sending for the configuration set using UpdateConfigurationSetSendingEnabled.'
		)
		this.name = 'ConfigurationSetSendingPausedError'
	}
}

export class MailFromDomainNotVerifiedError extends SesError {
	constructor() {
		super(
			'The message could not be sent because Amazon SES could not read the MX record required to use the specified MAIL FROM domain.',
			400,
			'MailFromDomainNotVerifiedException',
			'Verify your MAIL FROM domain settings in the Amazon SES console.'
		)
		this.name = 'MailFromDomainNotVerifiedError'
	}
}

export class MessageRejectedError extends SesError {
	constructor(message?: string) {
		super(
			message || 'The action failed, and the message could not be sent.',
			400,
			'MessageRejected',
			'Check the error details for more information about what caused the error.'
		)
		this.name = 'MessageRejectedError'
	}
}

export class InvalidParameterValueError extends SesError {
	constructor(message?: string) {
		super(
			message ||
				'An invalid or out-of-range value was supplied for the input parameter.',
			400,
			'InvalidParameterValue',
			'Check the parameter value and ensure it is within the valid range.'
		)
		this.name = 'InvalidParameterValueError'
	}
}

export class MissingRequiredParameterError extends SesError {
	constructor(message?: string) {
		super(
			message ||
				'A required parameter for the specified action is not supplied.',
			400,
			'MissingRequiredParameter',
			'Provide all required parameters for the action.'
		)
		this.name = 'MissingRequiredParameterError'
	}
}

export class SignatureDoesNotMatchError extends SesError {
	constructor() {
		super(
			'The request signature we calculated does not match the signature you provided.',
			403,
			'SignatureDoesNotMatch',
			'Check your AWS Secret Access Key and signing method.'
		)
		this.name = 'SignatureDoesNotMatchError'
	}
}

export class AccessDeniedError extends SesError {
	constructor(message?: string) {
		super(
			message || 'You do not have permission to perform this action.',
			403,
			'AccessDenied',
			'Check your IAM policy and ensure you have the necessary permissions.'
		)
		this.name = 'AccessDeniedError'
	}
}

export class InvalidClientTokenIdError extends SesError {
	constructor() {
		super(
			'The security token included in the request is invalid.',
			403,
			'InvalidClientTokenId',
			'Check your AWS Access Key ID and ensure it is correct.'
		)
		this.name = 'InvalidClientTokenIdError'
	}
}

export class IncompleteSignatureError extends SesError {
	constructor() {
		super(
			'The request signature does not conform to AWS standards.',
			403,
			'IncompleteSignature',
			'Check your signature calculation and ensure all required headers are included.'
		)
		this.name = 'IncompleteSignatureError'
	}
}

export class ThrottlingError extends SesError {
	constructor() {
		super(
			'Rate exceeded. Please slow down your request rate.',
			429,
			'Throttling',
			'Reduce your request rate or implement exponential backoff.'
		)
		this.name = 'ThrottlingError'
	}
}

export class ServiceUnavailableError extends SesError {
	constructor() {
		super(
			'The service is temporarily unavailable.',
			503,
			'ServiceUnavailable',
			'Retry the request after a short delay.'
		)
		this.name = 'ServiceUnavailableError'
	}
}

export class InternalFailureError extends SesError {
	constructor() {
		super(
			'An internal error occurred.',
			500,
			'InternalFailure',
			'Retry the request. If the problem persists, contact AWS Support.'
		)
		this.name = 'InternalFailureError'
	}
}

export class NetworkError extends SesError {
	constructor(message?: string) {
		super(
			message ||
				'An error occurred while sending the email. Please check your network connection and try again.',
			500,
			'network_error',
			'Check your network connection and try again.'
		)
		this.name = 'NetworkError'
	}
}

export type AnySesError =
	| SesError
	| MissingCredentialsConfigError
	| AccountSendingPausedError
	| ConfigurationSetDoesNotExistError
	| ConfigurationSetSendingPausedError
	| MailFromDomainNotVerifiedError
	| MessageRejectedError
	| InvalidParameterValueError
	| MissingRequiredParameterError
	| SignatureDoesNotMatchError
	| AccessDeniedError
	| InvalidClientTokenIdError
	| IncompleteSignatureError
	| ThrottlingError
	| ServiceUnavailableError
	| InternalFailureError
	| NetworkError
