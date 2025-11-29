import { attest } from '@ark/attest'
import { afterAll, afterEach, beforeAll, it, vi } from 'vitest'
import type { AsyncResult } from '~/asyncResult'
import { sender } from '~/sender/sender'
import { server, usePlunkHandler } from '~/test/msw'
import {
	type Plunk,
	type PlunkParams,
	type PlunkProviderOptions,
	plunk
} from './plunk'
import {
	type AnyPlunkError,
	createPlunkError,
	DomainNotVerifiedError,
	ForbiddenError,
	IncorrectBearerTokenError,
	InternalServerError,
	InvalidApiKeyFormatError,
	InvalidFromDomainError,
	InvalidPublicKeyError,
	InvalidSecretKeyError,
	MalformedAuthorizationHeaderError,
	MissingApiKeyConfigError,
	MissingAuthorizationHeaderError,
	NotFoundError,
	PlunkError,
	ProjectNotFoundError,
	RateLimitExceededError,
	TooManyAttachmentsError,
	UnauthorizedError,
	UnprocessableEntityError,
	ValidationError
} from './plunk.error'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

it('infers default ID when no id is provided', () => {
	const client = plunk({ apiKey: 'test-key' })

	attest<'default'>(client.id)
	attest(client.id).snap('default')
})

it('infers custom ID when id is provided', () => {
	const client = plunk({ id: 'custom', apiKey: 'test-key' })

	attest<'custom'>(client.id)
	attest(client.id).snap('custom')
})

it('infers provider name as plunk', () => {
	const client = plunk({ apiKey: 'test-key' })

	attest<'plunk'>(client.provider)
	attest(client.provider).snap('plunk')
})

it('has supportsAttachments set to true', () => {
	const client = plunk({ apiKey: 'test-key' })

	attest<true>(client.options.supportsAttachments)
	attest(client.options.supportsAttachments).snap(true)
})

it('Plunk type has correct structure', () => {
	attest<Plunk<'test'>>({} as Plunk<'test'>)
	attest<Plunk<'default'>>({} as Plunk<'default'>)
})

it('PlunkProviderOptions has supportsAttachments true', () => {
	attest<{ supportsAttachments: true }>({} as PlunkProviderOptions)
})

it('PlunkParams allows optional id and apiKey', () => {
	const params1 = {} satisfies PlunkParams
	const params2 = { apiKey: 'test' } satisfies PlunkParams
	const params3 = {
		id: 'custom',
		apiKey: 'test'
	} satisfies PlunkParams<'custom'>
	const params4 = {
		apiKey: 'test',
		baseUrl: 'https://custom.plunk.com'
	} satisfies PlunkParams
	attest(params1).snap({})
	attest(params2).snap({ apiKey: 'test' })
	attest(params3).snap({ id: 'custom', apiKey: 'test' })
	attest(params4).snap({ apiKey: 'test', baseUrl: 'https://custom.plunk.com' })
})

// Error class tests
it('PlunkError has correct properties', () => {
	const error = new PlunkError(
		'Test message',
		400,
		'test_code',
		'Test suggestion'
	)

	attest(error.message).snap('Test message')
	attest(error.statusCode).snap(400)
	attest(error.code).snap('test_code')
	attest(error.suggestion).snap('Test suggestion')
	attest(error.name).snap('PlunkError')
})

it('ValidationError has correct properties', () => {
	const error = new ValidationError('Invalid field value')

	attest(error.message).snap('Invalid field value')
	attest(error.statusCode).snap(400)
	attest(error.code).snap('validation_error')
})

it('MissingAuthorizationHeaderError has correct properties', () => {
	const error = new MissingAuthorizationHeaderError()

	attest(error.message).snap('No authorization header passed')
	attest(error.statusCode).snap(401)
	attest(error.code).snap('missing_authorization_header')
})

it('MalformedAuthorizationHeaderError has correct properties', () => {
	const error = new MalformedAuthorizationHeaderError(
		'Invalid authorization format'
	)

	attest(error.message).snap('Invalid authorization format')
	attest(error.statusCode).snap(401)
	attest(error.code).snap('malformed_authorization_header')
})

it('InvalidApiKeyFormatError has correct properties', () => {
	const error = new InvalidApiKeyFormatError('API key could not be parsed')

	attest(error.message).snap('API key could not be parsed')
	attest(error.statusCode).snap(401)
	attest(error.code).snap('invalid_api_key_format')
})

it('InvalidSecretKeyError has correct properties', () => {
	const error = new InvalidSecretKeyError('Invalid secret key format')

	attest(error.message).snap('Invalid secret key format')
	attest(error.statusCode).snap(401)
	attest(error.code).snap('invalid_secret_key')
})

it('InvalidPublicKeyError has correct properties', () => {
	const error = new InvalidPublicKeyError('Invalid public key format')

	attest(error.message).snap('Invalid public key format')
	attest(error.statusCode).snap(401)
	attest(error.code).snap('invalid_public_key')
})

it('IncorrectBearerTokenError has correct properties', () => {
	const error = new IncorrectBearerTokenError()

	attest(error.message).snap('Incorrect Bearer token specified')
	attest(error.statusCode).snap(401)
	attest(error.code).snap('incorrect_bearer_token')
})

it('DomainNotVerifiedError has correct properties', () => {
	const error = new DomainNotVerifiedError()

	attest(error.message).snap('Verify your domain before you start sending')
	attest(error.statusCode).snap(401)
	attest(error.code).snap('domain_not_verified')
})

it('InvalidFromDomainError has correct properties', () => {
	const error = new InvalidFromDomainError()

	attest(error.message).snap(
		'Custom from address must be from a verified domain'
	)
	attest(error.statusCode).snap(401)
	attest(error.code).snap('invalid_from_domain')
})

it('UnauthorizedError has correct properties', () => {
	const error = new UnauthorizedError('Authentication failed')

	attest(error.message).snap('Authentication failed')
	attest(error.statusCode).snap(401)
	attest(error.code).snap('unauthorized')
})

it('ForbiddenError has correct properties', () => {
	const error = new ForbiddenError('Access denied')

	attest(error.message).snap('Access denied')
	attest(error.statusCode).snap(403)
	attest(error.code).snap('forbidden')
})

it('ProjectNotFoundError has correct properties', () => {
	const error = new ProjectNotFoundError()

	attest(error.message).snap('That project was not found')
	attest(error.statusCode).snap(404)
	attest(error.code).snap('project_not_found')
})

it('NotFoundError has correct properties', () => {
	const error = new NotFoundError('Resource not found')

	attest(error.message).snap('Resource not found')
	attest(error.statusCode).snap(404)
	attest(error.code).snap('not_found')
})

it('UnprocessableEntityError has correct properties', () => {
	const error = new UnprocessableEntityError('Invalid request data')

	attest(error.message).snap('Invalid request data')
	attest(error.statusCode).snap(422)
	attest(error.code).snap('unprocessable_entity')
})

it('TooManyAttachmentsError has correct properties', () => {
	const error = new TooManyAttachmentsError()

	attest(error.message).snap(
		'Too many attachments. Maximum of 5 attachments allowed.'
	)
	attest(error.statusCode).snap(422)
	attest(error.code).snap('too_many_attachments')
})

it('RateLimitExceededError has correct properties', () => {
	const error = new RateLimitExceededError()

	attest(error.message).snap('Rate limit exceeded')
	attest(error.statusCode).snap(429)
	attest(error.code).snap('rate_limit_exceeded')
})

it('InternalServerError has correct properties', () => {
	const error = new InternalServerError()

	attest(error.message).snap('An unexpected error occurred')
	attest(error.statusCode).snap(500)
	attest(error.code).snap('internal_server_error')
})

// createPlunkError factory tests
it('createPlunkError returns ValidationError for 400', () => {
	const error = createPlunkError(400, 'Invalid field')

	attest(error).instanceOf(ValidationError)
	attest(error.message).snap('Invalid field')
})

it('createPlunkError returns MissingAuthorizationHeaderError for 401 with matching message', () => {
	const error = createPlunkError(401, 'No authorization header passed')

	attest(error).instanceOf(MissingAuthorizationHeaderError)
})

it('createPlunkError returns MalformedAuthorizationHeaderError for 401 with Bearer message', () => {
	const error = createPlunkError(401, 'Invalid Bearer token format')

	attest(error).instanceOf(MalformedAuthorizationHeaderError)
})

it('createPlunkError returns InvalidApiKeyFormatError for 401 with parse message', () => {
	const error = createPlunkError(401, 'API key could not be parsed')

	attest(error).instanceOf(InvalidApiKeyFormatError)
})

it('createPlunkError returns InvalidSecretKeyError for 401 with secret key message', () => {
	const error = createPlunkError(401, 'Invalid secret key provided')

	attest(error).instanceOf(InvalidSecretKeyError)
})

it('createPlunkError returns InvalidPublicKeyError for 401 with public key message', () => {
	const error = createPlunkError(401, 'Invalid public key provided')

	attest(error).instanceOf(InvalidPublicKeyError)
})

it('createPlunkError returns IncorrectBearerTokenError for 401 with incorrect token message', () => {
	const error = createPlunkError(401, 'Incorrect Bearer token specified')

	attest(error).instanceOf(IncorrectBearerTokenError)
})

it('createPlunkError returns DomainNotVerifiedError for 401 with domain message', () => {
	const error = createPlunkError(401, 'Verify your domain first')

	attest(error).instanceOf(DomainNotVerifiedError)
})

it('createPlunkError returns InvalidFromDomainError for 401 with custom from message', () => {
	const error = createPlunkError(401, 'Custom from address must be verified')

	attest(error).instanceOf(InvalidFromDomainError)
})

it('createPlunkError returns UnauthorizedError for generic 401', () => {
	const error = createPlunkError(401, 'Generic auth error')

	attest(error).instanceOf(UnauthorizedError)
})

it('createPlunkError returns ForbiddenError for 403', () => {
	const error = createPlunkError(403, 'Access denied')

	attest(error).instanceOf(ForbiddenError)
})

it('createPlunkError returns ProjectNotFoundError for 404 with project message', () => {
	const error = createPlunkError(404, 'That project was not found')

	attest(error).instanceOf(ProjectNotFoundError)
})

it('createPlunkError returns NotFoundError for generic 404', () => {
	const error = createPlunkError(404, 'Resource not found')

	attest(error).instanceOf(NotFoundError)
})

it('createPlunkError returns TooManyAttachmentsError for 422 with attachment message', () => {
	const error = createPlunkError(422, 'Too many attachment files')

	attest(error).instanceOf(TooManyAttachmentsError)
})

it('createPlunkError returns UnprocessableEntityError for generic 422', () => {
	const error = createPlunkError(422, 'Invalid data format')

	attest(error).instanceOf(UnprocessableEntityError)
})

it('createPlunkError returns RateLimitExceededError for 429', () => {
	const error = createPlunkError(429, 'Too many requests')

	attest(error).instanceOf(RateLimitExceededError)
})

it('createPlunkError returns InternalServerError for 500', () => {
	const error = createPlunkError(500, 'Server error')

	attest(error).instanceOf(InternalServerError)
})

it('createPlunkError returns generic PlunkError for unknown status', () => {
	const error = createPlunkError(418, "I'm a teapot")

	attest(error).instanceOf(PlunkError)
	attest(error.message).snap("I'm a teapot")
	attest(error.statusCode).snap(418)
})

// Functional tests
it('throws MissingApiKeyConfigError when no API key is provided', () => {
	vi.stubEnv('PLUNK_API_KEY', '')

	try {
		plunk({ apiKey: '' })
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
	const error = new MissingApiKeyConfigError('plunk')

	attest(error.message).snap(
		'Missing API key for plunk provider. Please provide an API key via the `apiKey` parameter or set the `PLUNK_API_KEY` environment variable.'
	)
	attest(error.statusCode).snap(500)
	attest(error.code).snap('missing_api_key_config')
})

it('accepts API key as string', () => {
	const client = plunk({ apiKey: 'test-api-key' })

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('accepts API key as function returning string', () => {
	const client = plunk({ apiKey: () => 'test-api-key' })

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('accepts API key as function returning promise', () => {
	const client = plunk({ apiKey: () => Promise.resolve('test-api-key') })

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('accepts custom baseUrl as string', () => {
	const client = plunk({
		apiKey: 'test-key',
		baseUrl: 'https://custom.plunk.com'
	})

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('accepts custom baseUrl as function', () => {
	const client = plunk({
		apiKey: 'test-key',
		baseUrl: () => 'https://custom.plunk.com'
	})

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('accepts custom baseUrl as async function', () => {
	const client = plunk({
		apiKey: 'test-key',
		baseUrl: () => Promise.resolve('https://custom.plunk.com')
	})

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('send method returns AsyncResult type', () => {
	const client = plunk({ apiKey: 'test-key' })

	const result = client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest<AsyncResult<void, AnyPlunkError>>(result)
})

it('send accepts all Plunk API parameters', () => {
	const client = plunk({ apiKey: 'test-key' })

	const sendParams: Parameters<typeof client.send>[0] = {
		from: sender({ email: 'test@example.com', name: 'Test Sender' }),
		to: ['recipient1@example.com', 'recipient2@example.com'],
		subject: 'Test Subject',
		html: '<p>HTML content</p>',
		text: 'Plain text content',
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
	attest(sendParams.subject).snap('Test Subject')
	attest(sendParams.to).snap([
		'recipient1@example.com',
		'recipient2@example.com'
	])
})

it('send accepts up to 5 attachments', () => {
	const client = plunk({ apiKey: 'test-key' })

	const sendParams: Parameters<typeof client.send>[0] = {
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test with attachments',
		html: '<p>Test</p>',
		attachments: [
			{ filename: 'file1.txt', content: 'Content 1' },
			{ filename: 'file2.txt', content: 'Content 2' },
			{ filename: 'file3.txt', content: 'Content 3' },
			{ filename: 'file4.txt', content: 'Content 4' },
			{ filename: 'file5.txt', content: 'Content 5' }
		]
	}

	attest(sendParams.attachments?.length).snap(5)
})

it('send rejects more than 5 attachments', async () => {
	const client = plunk({ apiKey: 'test-key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test with too many attachments',
		html: '<p>Test</p>',
		attachments: [
			{ filename: 'file1.txt', content: 'Content 1' },
			{ filename: 'file2.txt', content: 'Content 2' },
			{ filename: 'file3.txt', content: 'Content 3' },
			{ filename: 'file4.txt', content: 'Content 4' },
			{ filename: 'file5.txt', content: 'Content 5' },
			{ filename: 'file6.txt', content: 'Content 6' }
		]
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(TooManyAttachmentsError)
})

it('uses PLUNK_API_KEY from environment when no apiKey provided', () => {
	vi.stubEnv('PLUNK_API_KEY', 'env-api-key')

	const client = plunk({})

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
	usePlunkHandler('success')
	const client = plunk({ apiKey: 'sk_test_valid_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com', name: 'Test Sender' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('success')
	attest(result.error).snap(undefined)
})

it('returns IncorrectBearerTokenError when API returns 401 with incorrect token', async () => {
	usePlunkHandler('unauthorized')
	const client = plunk({ apiKey: 'sk_test_invalid_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(IncorrectBearerTokenError)
})

it('returns DomainNotVerifiedError when domain is not verified', async () => {
	usePlunkHandler('domainNotVerified')
	const client = plunk({ apiKey: 'sk_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@unverified.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(DomainNotVerifiedError)
})

it('returns RateLimitExceededError when rate limited', async () => {
	usePlunkHandler('rateLimited')
	const client = plunk({ apiKey: 'sk_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(RateLimitExceededError)
})

it('returns InternalServerError when API returns 500', async () => {
	usePlunkHandler('serverError')
	const client = plunk({ apiKey: 'sk_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(InternalServerError)
})

it('returns ValidationError when API returns 400', async () => {
	usePlunkHandler('validationError')
	const client = plunk({ apiKey: 'sk_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'invalid-email',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(ValidationError)
})

it('handles malformed JSON response gracefully', async () => {
	usePlunkHandler('malformedJson')
	const client = plunk({ apiKey: 'sk_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	// Should still return an error even if JSON parsing fails
	attest(result.error).instanceOf(PlunkError)
})

it('handles network errors gracefully', async () => {
	usePlunkHandler('networkError')
	const client = plunk({ apiKey: 'sk_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('failure')
	attest(result.error).instanceOf(InternalServerError)
	attest(result.error?.message).snap('An unexpected error occurred')
})

it('resolves API key from async function before sending', async () => {
	usePlunkHandler('success')
	const client = plunk({
		apiKey: () => Promise.resolve('sk_async_key')
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('success')
})

it('resolves baseUrl from async function before sending', async () => {
	usePlunkHandler('success')
	const client = plunk({
		apiKey: 'sk_test_key',
		baseUrl: () => Promise.resolve('https://api.useplunk.com')
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
	usePlunkHandler('success')
	const client = plunk({ apiKey: 'sk_test_key' })

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
	usePlunkHandler('success')
	const client = plunk({ apiKey: 'sk_test_key' })

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: ['recipient1@example.com', 'recipient2@example.com'],
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('success')
})

it('resolves API key from sync function before sending', async () => {
	usePlunkHandler('success')
	const client = plunk({
		apiKey: () => 'sk_sync_key'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('success')
})

it('resolves baseUrl from sync function before sending', async () => {
	usePlunkHandler('success')
	const client = plunk({
		apiKey: 'sk_test_key',
		baseUrl: () => 'https://api.useplunk.com'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('success')
})

it('uses baseUrl string when provided', async () => {
	usePlunkHandler('success')
	const client = plunk({
		apiKey: 'sk_test_key',
		baseUrl: 'https://api.useplunk.com'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result.status).snap('success')
})
