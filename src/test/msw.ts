import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

// Plunk API handlers
export const plunkHandlers = {
	success: http.post('https://api.useplunk.com/v1/send', () => {
		return HttpResponse.json({
			success: true,
			emails: [
				{
					contact: {
						id: '80d74d13-16eb-48c5-bc2b-aae6fd5865cc',
						email: 'recipient@example.com'
					},
					email: 'ebd44b76-9e1d-4826-96a1-9a240c42a939'
				}
			],
			timestamp: new Date().toISOString()
		})
	}),

	unauthorized: http.post('https://api.useplunk.com/v1/send', () => {
		return HttpResponse.json(
			{ message: 'Incorrect Bearer token specified' },
			{ status: 401 }
		)
	}),

	domainNotVerified: http.post('https://api.useplunk.com/v1/send', () => {
		return HttpResponse.json(
			{ message: 'Verify your domain before you start sending' },
			{ status: 401 }
		)
	}),

	rateLimited: http.post('https://api.useplunk.com/v1/send', () => {
		return HttpResponse.json(
			{ message: 'Rate limit exceeded' },
			{ status: 429 }
		)
	}),

	serverError: http.post('https://api.useplunk.com/v1/send', () => {
		return HttpResponse.json(
			{ message: 'Internal server error' },
			{ status: 500 }
		)
	}),

	validationError: http.post('https://api.useplunk.com/v1/send', () => {
		return HttpResponse.json(
			{ message: 'Invalid email address format' },
			{ status: 400 }
		)
	}),

	malformedJson: http.post('https://api.useplunk.com/v1/send', () => {
		return new HttpResponse('not json', {
			status: 400,
			headers: { 'Content-Type': 'text/plain' }
		})
	}),

	networkError: http.post('https://api.useplunk.com/v1/send', () => {
		return HttpResponse.error()
	})
}

// Resend API handlers
export const resendHandlers = {
	success: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json({
			id: 'ae2014de-c168-4c61-8267-70d2662a1ce1'
		})
	}),

	invalidApiKey: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{ code: 'invalid_api_key', message: 'API key is invalid.' },
			{ status: 403 }
		)
	}),

	missingApiKey: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'missing_api_key',
				message: 'Missing API key in the authorization header.'
			},
			{ status: 401 }
		)
	}),

	restrictedApiKey: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'restricted_api_key',
				message: 'This API key is restricted to only send emails.'
			},
			{ status: 401 }
		)
	}),

	validationError: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'validation_error',
				message: 'The email address is invalid.'
			},
			{ status: 400 }
		)
	}),

	invalidIdempotencyKey: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'invalid_idempotency_key',
				message: 'The key must be between 1-256 chars.'
			},
			{ status: 400 }
		)
	}),

	notFound: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'not_found',
				message: 'The requested endpoint does not exist.'
			},
			{ status: 404 }
		)
	}),

	methodNotAllowed: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'method_not_allowed',
				message: 'Method is not allowed for the requested path.'
			},
			{ status: 405 }
		)
	}),

	invalidIdempotentRequest: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'invalid_idempotent_request',
				message: 'Same idempotency key used with a different request payload.'
			},
			{ status: 409 }
		)
	}),

	concurrentIdempotentRequests: http.post(
		'https://api.resend.com/emails',
		() => {
			return HttpResponse.json(
				{
					code: 'concurrent_idempotent_requests',
					message:
						'Same idempotency key used while original request is still in progress.'
				},
				{ status: 409 }
			)
		}
	),

	invalidFromAddress: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'invalid_from_address',
				message: 'The from address is invalid.'
			},
			{ status: 422 }
		)
	}),

	invalidAccess: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'invalid_access',
				message: 'You do not have permission to access this resource.'
			},
			{ status: 403 }
		)
	}),

	invalidParameter: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'invalid_parameter',
				message: 'Invalid parameter value.'
			},
			{ status: 400 }
		)
	}),

	invalidRegion: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'invalid_region',
				message: 'The region is invalid.'
			},
			{ status: 400 }
		)
	}),

	missingRequiredField: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'missing_required_field',
				message: 'A required field is missing.'
			},
			{ status: 400 }
		)
	}),

	securityError: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'security_error',
				message: 'A security violation was detected.'
			},
			{ status: 403 }
		)
	}),

	applicationError: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'application_error',
				message: 'An application error occurred.'
			},
			{ status: 500 }
		)
	}),

	rateLimited: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'rate_limit_exceeded',
				message: 'Too many requests. Please slow down.'
			},
			{ status: 429 }
		)
	}),

	dailyQuotaExceeded: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'daily_quota_exceeded',
				message: 'You have reached your daily email sending quota.'
			},
			{ status: 429 }
		)
	}),

	serverError: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'internal_server_error',
				message: 'An unexpected error occurred.'
			},
			{ status: 500 }
		)
	}),

	invalidAttachment: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.json(
			{
				code: 'invalid_attachment',
				message: 'Attachment must have either a `content` or `path`.'
			},
			{ status: 422 }
		)
	}),

	malformedJson: http.post('https://api.resend.com/emails', () => {
		return new HttpResponse('not json', {
			status: 400,
			headers: { 'Content-Type': 'text/plain' }
		})
	}),

	networkError: http.post('https://api.resend.com/emails', () => {
		return HttpResponse.error()
	})
}

// Create a server instance that can be configured per test
export const server = setupServer()

// AWS SES handlers
export const sesHandlers = {
	success: http.post('https://email.us-east-1.amazonaws.com/', () => {
		return new HttpResponse(
			`<SendRawEmailResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
				<SendRawEmailResult>
					<MessageId>0102018e1234567-abcdef01-2345-6789-abcd-ef0123456789-000000</MessageId>
				</SendRawEmailResult>
				<ResponseMetadata>
					<RequestId>a1b2c3d4-e5f6-1234-5678-1234567890ab</RequestId>
				</ResponseMetadata>
			</SendRawEmailResponse>`,
			{
				status: 200,
				headers: { 'Content-Type': 'text/xml' }
			}
		)
	}),

	accountSendingPaused: http.post(
		'https://email.us-east-1.amazonaws.com/',
		() => {
			return new HttpResponse(
				`<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
					<Error>
						<Type>Sender</Type>
						<Code>AccountSendingPausedException</Code>
						<Message>Email sending is disabled for your entire Amazon SES account.</Message>
					</Error>
					<RequestId>a1b2c3d4-e5f6-1234-5678-1234567890ab</RequestId>
				</ErrorResponse>`,
				{
					status: 400,
					headers: { 'Content-Type': 'text/xml' }
				}
			)
		}
	),

	configurationSetDoesNotExist: http.post(
		'https://email.us-east-1.amazonaws.com/',
		() => {
			return new HttpResponse(
				`<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
					<Error>
						<Type>Sender</Type>
						<Code>ConfigurationSetDoesNotExist</Code>
						<Message>Configuration set does not exist.</Message>
					</Error>
					<RequestId>a1b2c3d4-e5f6-1234-5678-1234567890ab</RequestId>
				</ErrorResponse>`,
				{
					status: 400,
					headers: { 'Content-Type': 'text/xml' }
				}
			)
		}
	),

	mailFromDomainNotVerified: http.post(
		'https://email.us-east-1.amazonaws.com/',
		() => {
			return new HttpResponse(
				`<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
					<Error>
						<Type>Sender</Type>
						<Code>MailFromDomainNotVerifiedException</Code>
						<Message>The message could not be sent because Amazon SES could not read the MX record required to use the specified MAIL FROM domain.</Message>
					</Error>
					<RequestId>a1b2c3d4-e5f6-1234-5678-1234567890ab</RequestId>
				</ErrorResponse>`,
				{
					status: 400,
					headers: { 'Content-Type': 'text/xml' }
				}
			)
		}
	),

	messageRejected: http.post('https://email.us-east-1.amazonaws.com/', () => {
		return new HttpResponse(
			`<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
					<Error>
						<Type>Sender</Type>
						<Code>MessageRejected</Code>
						<Message>Email address is not verified.</Message>
					</Error>
					<RequestId>a1b2c3d4-e5f6-1234-5678-1234567890ab</RequestId>
				</ErrorResponse>`,
			{
				status: 400,
				headers: { 'Content-Type': 'text/xml' }
			}
		)
	}),

	signatureDoesNotMatch: http.post(
		'https://email.us-east-1.amazonaws.com/',
		() => {
			return new HttpResponse(
				`<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
					<Error>
						<Type>Sender</Type>
						<Code>SignatureDoesNotMatch</Code>
						<Message>The request signature we calculated does not match the signature you provided.</Message>
					</Error>
					<RequestId>a1b2c3d4-e5f6-1234-5678-1234567890ab</RequestId>
				</ErrorResponse>`,
				{
					status: 403,
					headers: { 'Content-Type': 'text/xml' }
				}
			)
		}
	),

	accessDenied: http.post('https://email.us-east-1.amazonaws.com/', () => {
		return new HttpResponse(
			`<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
				<Error>
					<Type>Sender</Type>
					<Code>AccessDenied</Code>
					<Message>You do not have permission to perform this action.</Message>
				</Error>
				<RequestId>a1b2c3d4-e5f6-1234-5678-1234567890ab</RequestId>
			</ErrorResponse>`,
			{
				status: 403,
				headers: { 'Content-Type': 'text/xml' }
			}
		)
	}),

	invalidClientTokenId: http.post(
		'https://email.us-east-1.amazonaws.com/',
		() => {
			return new HttpResponse(
				`<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
					<Error>
						<Type>Sender</Type>
						<Code>InvalidClientTokenId</Code>
						<Message>The security token included in the request is invalid.</Message>
					</Error>
					<RequestId>a1b2c3d4-e5f6-1234-5678-1234567890ab</RequestId>
				</ErrorResponse>`,
				{
					status: 403,
					headers: { 'Content-Type': 'text/xml' }
				}
			)
		}
	),

	throttling: http.post('https://email.us-east-1.amazonaws.com/', () => {
		return new HttpResponse(
			`<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
				<Error>
					<Type>Sender</Type>
					<Code>Throttling</Code>
					<Message>Rate exceeded. Please slow down your request rate.</Message>
				</Error>
				<RequestId>a1b2c3d4-e5f6-1234-5678-1234567890ab</RequestId>
			</ErrorResponse>`,
			{
				status: 429,
				headers: { 'Content-Type': 'text/xml' }
			}
		)
	}),

	serviceUnavailable: http.post(
		'https://email.us-east-1.amazonaws.com/',
		() => {
			return new HttpResponse(
				`<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
					<Error>
						<Type>Sender</Type>
						<Code>ServiceUnavailable</Code>
						<Message>The service is temporarily unavailable.</Message>
					</Error>
					<RequestId>a1b2c3d4-e5f6-1234-5678-1234567890ab</RequestId>
				</ErrorResponse>`,
				{
					status: 503,
					headers: { 'Content-Type': 'text/xml' }
				}
			)
		}
	),

	internalFailure: http.post('https://email.us-east-1.amazonaws.com/', () => {
		return new HttpResponse(
			`<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
					<Error>
						<Type>Sender</Type>
						<Code>InternalFailure</Code>
						<Message>An internal error occurred.</Message>
					</Error>
					<RequestId>a1b2c3d4-e5f6-1234-5678-1234567890ab</RequestId>
				</ErrorResponse>`,
			{
				status: 500,
				headers: { 'Content-Type': 'text/xml' }
			}
		)
	}),

	networkError: http.post('https://email.us-east-1.amazonaws.com/', () => {
		return HttpResponse.error()
	})
}

// Helper to use specific handlers
export function usePlunkHandler(handlerName: keyof typeof plunkHandlers): void {
	server.use(plunkHandlers[handlerName])
}

export function useResendHandler(
	handlerName: keyof typeof resendHandlers
): void {
	server.use(resendHandlers[handlerName])
}

export function useSesHandler(handlerName: keyof typeof sesHandlers): void {
	server.use(sesHandlers[handlerName])
}
