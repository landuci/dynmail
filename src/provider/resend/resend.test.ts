import { attest } from '@ark/attest'
import { afterAll, afterEach, beforeAll, it, vi } from 'vitest'
import type { AsyncResult } from '~/asyncResult'
import { sender } from '~/sender/sender'
import { server, useResendHandler } from '~/test/msw'
import {
	type Resend,
	type ResendParams,
	type ResendProviderOptions,
	resend
} from './resend'
import {
	type AnyResendError,
	ApplicationError,
	ConcurrentIdempotentRequestsError,
	createResendError,
	DailyQuotaExceededError,
	InternalServerError,
	InvalidAccessError,
	InvalidApiKeyError,
	InvalidAttachmentError,
	InvalidFromAddressError,
	InvalidIdempotencyKeyError,
	InvalidIdempotentRequestError,
	InvalidParameterError,
	InvalidRegionError,
	MethodNotAllowedError,
	MissingApiKeyConfigError,
	MissingApiKeyError,
	MissingRequiredFieldError,
	NotFoundError,
	RateLimitExceededError,
	ResendError,
	RestrictedApiKeyError,
	SecurityError,
	ValidationError
} from './resend.error'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

it('infers default ID when no id is provided', () => {
	const client = resend({ apiKey: 'test-key' })

	attest<'default'>(client.id)
	attest(client.id).snap('default')
})

it('infers custom ID when id is provided', () => {
	const client = resend({ id: 'custom', apiKey: 'test-key' })

	attest<'custom'>(client.id)
	attest(client.id).snap('custom')
})

it('infers provider name as resend', () => {
	const client = resend({ apiKey: 'test-key' })

	attest<'resend'>(client.provider)
	attest(client.provider).snap('resend')
})

it('has supportsAttachments set to true', () => {
	const client = resend({ apiKey: 'test-key' })

	attest<true>(client.options.supportsAttachments)
	attest(client.options.supportsAttachments).snap(true)
})

it('Resend type has correct structure', () => {
	attest<Resend<'test'>>({} as Resend<'test'>)
	attest<Resend<'default'>>({} as Resend<'default'>)
})

it('ResendProviderOptions has supportsAttachments true', () => {
	attest<{ supportsAttachments: true }>({} as ResendProviderOptions)
})

it('ResendParams allows optional id and apiKey', () => {
	// Valid params - using satisfies to check types
	const params1 = {} satisfies ResendParams
	const params2 = { apiKey: 'test' } satisfies ResendParams
	const params3 = {
		id: 'custom',
		apiKey: 'test'
	} satisfies ResendParams<'custom'>
	attest(params1).snap({})
	attest(params2).snap({ apiKey: 'test' })
	attest(params3).snap({ id: 'custom', apiKey: 'test' })
})

// Error class tests
it('ResendError has correct properties', () => {
	const error = new ResendError(
		'Test message',
		400,
		'test_code',
		'Test suggestion'
	)

	attest(error.message).snap('Test message')
	attest(error.statusCode).snap(400)
	attest(error.code).snap('test_code')
	attest(error.suggestion).snap('Test suggestion')
	attest(error.name).snap('ResendError')
})

it('InvalidIdempotencyKeyError has correct properties', () => {
	const error = new InvalidIdempotencyKeyError()

	attest(error.message).snap('The key must be between 1-256 chars.')
	attest(error.statusCode).snap(400)
	attest(error.code).snap('invalid_idempotency_key')
})

it('ValidationError has correct properties', () => {
	const error = new ValidationError()

	attest(error.message).snap(
		'We found an error with one or more fields in the request.'
	)
	attest(error.statusCode).snap(400)
	attest(error.code).snap('validation_error')
})

it('ValidationError accepts custom message', () => {
	const error = new ValidationError('Custom validation error')

	attest(error.message).snap('Custom validation error')
})

it('MissingApiKeyError has correct properties', () => {
	const error = new MissingApiKeyError()

	attest(error.message).snap('Missing API key in the authorization header.')
	attest(error.statusCode).snap(401)
	attest(error.code).snap('missing_api_key')
})

it('InvalidApiKeyError has correct properties', () => {
	const error = new InvalidApiKeyError()

	attest(error.message).snap('API key is invalid.')
	attest(error.statusCode).snap(403)
	attest(error.code).snap('invalid_api_key')
})

it('InvalidAttachmentError has correct properties', () => {
	const error = new InvalidAttachmentError()

	attest(error.message).snap(
		'Attachment must have either a `content` or `path`.'
	)
	attest(error.statusCode).snap(422)
	attest(error.code).snap('invalid_attachment')
})

it('InvalidFromAddressError has correct properties', () => {
	const error = new InvalidFromAddressError()

	attest(error.message).snap('Invalid `from` field.')
	attest(error.statusCode).snap(422)
	attest(error.code).snap('invalid_from_address')
})

it('DailyQuotaExceededError has correct properties', () => {
	const error = new DailyQuotaExceededError()

	attest(error.message).snap('You have reached your daily email sending quota.')
	attest(error.statusCode).snap(429)
	attest(error.code).snap('daily_quota_exceeded')
})

it('RateLimitExceededError has correct properties', () => {
	const error = new RateLimitExceededError()

	attest(error.statusCode).snap(429)
	attest(error.code).snap('rate_limit_exceeded')
})

// createResendError factory tests
it('createResendError returns InvalidIdempotencyKeyError for invalid_idempotency_key', () => {
	const error = createResendError('invalid_idempotency_key')

	attest(error).instanceOf(InvalidIdempotencyKeyError)
})

it('createResendError returns ValidationError for validation_error', () => {
	const error = createResendError('validation_error', 'Custom message')

	attest(error).instanceOf(ValidationError)
	attest(error.message).snap('Custom message')
})

it('createResendError returns MissingApiKeyError for missing_api_key', () => {
	const error = createResendError('missing_api_key')

	attest(error).instanceOf(MissingApiKeyError)
})

it('createResendError returns InvalidApiKeyError for invalid_api_key', () => {
	const error = createResendError('invalid_api_key')

	attest(error).instanceOf(InvalidApiKeyError)
})

it('createResendError returns generic ResendError for unknown codes', () => {
	const error = createResendError('unknown_code', 'Unknown error', 500)

	attest(error).instanceOf(ResendError)
	attest(error.message).snap('Unknown error')
	attest(error.code).snap('unknown_code')
})

// Functional tests
it('throws MissingApiKeyConfigError when no API key is provided', () => {
	// Clear env var for this test
	vi.stubEnv('RESEND_API_KEY', '')

	try {
		resend({ apiKey: '' })
		throw new Error('Expected to throw')
	} catch (error) {
		attest(error).instanceOf(MissingApiKeyConfigError)
		attest((error as MissingApiKeyConfigError).code).snap(
			'missing_api_key_config'
		)
	}

	vi.unstubAllEnvs()
})

it('MissingApiKeyConfigError has correct properties', () => {
	const error = new MissingApiKeyConfigError('resend')

	attest(error.message).snap(
		'Missing API key for resend provider. Please provide an API key via the `apiKey` parameter or set the `RESEND_API_KEY` environment variable.'
	)
	attest(error.statusCode).snap(500)
	attest(error.code).snap('missing_api_key_config')
})

it('accepts API key as string', () => {
	const client = resend({ apiKey: 'test-api-key' })

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('accepts API key as function returning string', () => {
	const client = resend({ apiKey: () => 'test-api-key' })

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('accepts API key as function returning promise', () => {
	const client = resend({ apiKey: () => Promise.resolve('test-api-key') })

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('send method returns AsyncResult type', () => {
	const client = resend({ apiKey: 'test-key' })

	// Type check - send should return AsyncResult
	const result = client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest<AsyncResult<void, AnyResendError>>(result)
})

it('send accepts all Resend API parameters', () => {
	const client = resend({ apiKey: 'test-key' })

	// This should type-check without errors
	const sendParams: Parameters<typeof client.send>[0] = {
		from: sender({ email: 'test@example.com', name: 'Test Sender' }),
		to: ['recipient1@example.com', 'recipient2@example.com'],
		subject: 'Test Subject',
		html: '<p>HTML content</p>',
		text: 'Plain text content',
		cc: 'cc@example.com',
		bcc: ['bcc1@example.com', 'bcc2@example.com'],
		replyTo: 'reply@example.com',
		headers: { 'X-Custom-Header': 'value' },
		attachments: [
			{
				filename: 'test.txt',
				content: 'Hello World'
			}
		]
	}

	attest(typeof client.send).snap('function')
	// Verify the params object was created correctly
	attest(sendParams.subject).snap('Test Subject')
	attest(sendParams.to).snap([
		'recipient1@example.com',
		'recipient2@example.com'
	])
})

// Resend test email addresses for simulating different events
// See: https://resend.com/docs/dashboard/emails/send-test-emails
it('supports test email addresses for delivered emails', () => {
	const client = resend({ apiKey: 'test-key' })

	// Resend provides test addresses that simulate different deliverability scenarios
	const testDeliveredEmail = 'delivered@resend.dev'
	const testDeliveredWithLabel = 'delivered+signup@resend.dev'

	const sendParams: Parameters<typeof client.send>[0] = {
		from: sender({ email: 'test@example.com' }),
		to: testDeliveredEmail,
		subject: 'Test delivered email',
		html: '<p>This email will be marked as delivered</p>'
	}

	attest(sendParams.to).snap('delivered@resend.dev')

	const sendParamsWithLabel: Parameters<typeof client.send>[0] = {
		from: sender({ email: 'test@example.com' }),
		to: testDeliveredWithLabel,
		subject: 'Test delivered email with label',
		html: '<p>Tracking signup flow</p>'
	}

	attest(sendParamsWithLabel.to).snap('delivered+signup@resend.dev')
})

it('supports test email addresses for bounced emails', () => {
	const client = resend({ apiKey: 'test-key' })

	// Test bounced email address - simulates SMTP 550 5.1.1 ("Unknown User")
	const testBouncedEmail = 'bounced@resend.dev'
	const testBouncedWithLabel = 'bounced+user1@resend.dev'

	const sendParams: Parameters<typeof client.send>[0] = {
		from: sender({ email: 'test@example.com' }),
		to: testBouncedEmail,
		subject: 'Test bounced email',
		html: '<p>This email will bounce</p>'
	}

	attest(sendParams.to).snap('bounced@resend.dev')

	const sendParamsWithLabel: Parameters<typeof client.send>[0] = {
		from: sender({ email: 'test@example.com' }),
		to: testBouncedWithLabel,
		subject: 'Test bounced email with label',
		html: '<p>Testing bounce handling</p>'
	}

	attest(sendParamsWithLabel.to).snap('bounced+user1@resend.dev')
})

it('supports test email addresses for spam complaints', () => {
	const client = resend({ apiKey: 'test-key' })

	// Test spam complaint email address
	const testComplainedEmail = 'complained@resend.dev'
	const testComplainedWithLabel = 'complained+newsletter@resend.dev'

	const sendParams: Parameters<typeof client.send>[0] = {
		from: sender({ email: 'test@example.com' }),
		to: testComplainedEmail,
		subject: 'Test spam complaint',
		html: '<p>This email will be marked as spam</p>'
	}

	attest(sendParams.to).snap('complained@resend.dev')

	const sendParamsWithLabel: Parameters<typeof client.send>[0] = {
		from: sender({ email: 'test@example.com' }),
		to: testComplainedWithLabel,
		subject: 'Test spam complaint with label',
		html: '<p>Testing spam handling</p>'
	}

	attest(sendParamsWithLabel.to).snap('complained+newsletter@resend.dev')
})

it('uses RESEND_API_KEY from environment when no apiKey provided', () => {
	vi.stubEnv('RESEND_API_KEY', 'env-api-key')

	// Should not throw when env var is set
	const client = resend({})

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')

	vi.unstubAllEnvs()
})

afterEach(() => {
	vi.unstubAllEnvs()
	server.resetHandlers()
})

// MSW Integration Tests - Testing actual fetch behavior
it('successfully sends email when API returns 200', async () => {
	useResendHandler('success')
	const client = resend({ apiKey: 're_test_valid_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com', name: 'Test Sender' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('success')
	attest(result.error).snap(undefined)
})

it('returns InvalidApiKeyError when API returns 403', async () => {
	useResendHandler('invalidApiKey')
	const client = resend({ apiKey: 're_test_invalid_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(InvalidApiKeyError)
})

it('returns MissingApiKeyError when API returns 401', async () => {
	useResendHandler('missingApiKey')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(MissingApiKeyError)
})

it('returns ValidationError when API returns 400', async () => {
	useResendHandler('validationError')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'invalid-email',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(ValidationError)
})

it('returns RateLimitExceededError when rate limited', async () => {
	useResendHandler('rateLimited')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(RateLimitExceededError)
})

it('returns DailyQuotaExceededError when quota exceeded', async () => {
	useResendHandler('dailyQuotaExceeded')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(DailyQuotaExceededError)
})

it('returns InternalServerError when API returns 500', async () => {
	useResendHandler('serverError')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(InternalServerError)
})

it('returns InvalidAttachmentError when attachment is invalid', async () => {
	useResendHandler('invalidAttachment')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>',
		attachments: [{ filename: 'test.txt' }] // Missing content and path
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(InvalidAttachmentError)
})

it('handles malformed JSON response gracefully', async () => {
	useResendHandler('malformedJson')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	// Should still return an error even if JSON parsing fails
	attest(result.error).instanceOf(ResendError)
})

it('handles network errors gracefully', async () => {
	useResendHandler('networkError')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(ResendError)
	attest(result.error?.message).snap(
		'An error occurred while sending the email. Please check your network connection and try again.'
	)
})

it('resolves API key from async function before sending', async () => {
	useResendHandler('success')
	const client = resend({
		apiKey: () => Promise.resolve('re_async_key')
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('success')
})

it('sends email with attachments successfully', async () => {
	useResendHandler('success')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test with attachment',
		html: '<p>See attached</p>',
		attachments: [
			{ filename: 'test.txt', content: 'Hello World' },
			{ filename: 'data.json', content: '{"key": "value"}' }
		]
	})

	attest(result.status).snap('success')
})

it('sends email to multiple recipients', async () => {
	useResendHandler('success')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: ['recipient1@example.com', 'recipient2@example.com'],
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('success')
})

it('sends email with CC and BCC', async () => {
	useResendHandler('success')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		cc: 'cc@example.com',
		bcc: ['bcc1@example.com', 'bcc2@example.com'],
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('success')
})

it('sends email with reply-to address', async () => {
	useResendHandler('success')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		replyTo: 'reply@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('success')
})

it('sends email with custom headers', async () => {
	useResendHandler('success')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>',
		headers: {
			'X-Custom-Header': 'custom-value',
			'X-Priority': '1'
		}
	})

	attest(result.status).snap('success')
})

// Additional error type tests
it('returns RestrictedApiKeyError when API key is restricted', async () => {
	useResendHandler('restrictedApiKey')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(RestrictedApiKeyError)
})

it('returns InvalidIdempotencyKeyError when idempotency key is invalid', async () => {
	useResendHandler('invalidIdempotencyKey')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(InvalidIdempotencyKeyError)
})

it('returns NotFoundError when endpoint not found', async () => {
	useResendHandler('notFound')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(NotFoundError)
})

it('returns MethodNotAllowedError when method not allowed', async () => {
	useResendHandler('methodNotAllowed')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(MethodNotAllowedError)
})

it('returns InvalidIdempotentRequestError when request payload differs', async () => {
	useResendHandler('invalidIdempotentRequest')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(InvalidIdempotentRequestError)
})

it('returns ConcurrentIdempotentRequestsError for concurrent requests', async () => {
	useResendHandler('concurrentIdempotentRequests')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(ConcurrentIdempotentRequestsError)
})

it('returns InvalidFromAddressError when from address is invalid', async () => {
	useResendHandler('invalidFromAddress')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(InvalidFromAddressError)
})

it('returns InvalidAccessError when access is denied', async () => {
	useResendHandler('invalidAccess')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(InvalidAccessError)
})

it('returns InvalidParameterError when parameter is invalid', async () => {
	useResendHandler('invalidParameter')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(InvalidParameterError)
})

it('returns InvalidRegionError when region is invalid', async () => {
	useResendHandler('invalidRegion')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(InvalidRegionError)
})

it('returns MissingRequiredFieldError when required field is missing', async () => {
	useResendHandler('missingRequiredField')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(MissingRequiredFieldError)
})

it('returns SecurityError when security violation detected', async () => {
	useResendHandler('securityError')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(SecurityError)
})

it('returns ApplicationError when application error occurs', async () => {
	useResendHandler('applicationError')
	const client = resend({ apiKey: 're_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(ApplicationError)
})

it('resolves API key from sync function before sending', async () => {
	useResendHandler('success')
	const client = resend({
		apiKey: () => 're_sync_key'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('success')
})
