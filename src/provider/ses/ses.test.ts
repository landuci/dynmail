import { attest } from '@ark/attest'
import { afterAll, beforeAll, it, vi } from 'vitest'
import type { AsyncResult } from '~/asyncResult'
import { sender } from '~/sender/sender'
import { server, useSesHandler } from '~/test/msw'
import { type Ses, type SesParams, type SesProviderOptions, ses } from './ses'
import {
	AccessDeniedError,
	AccountSendingPausedError,
	type AnySesError,
	ConfigurationSetDoesNotExistError,
	ConfigurationSetSendingPausedError,
	createSesError,
	IncompleteSignatureError,
	InternalFailureError,
	InvalidClientTokenIdError,
	InvalidParameterValueError,
	MailFromDomainNotVerifiedError,
	MessageRejectedError,
	MissingCredentialsConfigError,
	MissingRequiredParameterError,
	NetworkError,
	ServiceUnavailableError,
	SesError,
	SignatureDoesNotMatchError,
	ThrottlingError
} from './ses.error'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

it('infers default ID when no id is provided', () => {
	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	attest<'default'>(client.id)
	attest(client.id).snap('default')
})

it('infers custom ID when id is provided', () => {
	const client = ses({
		id: 'custom',
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	attest<'custom'>(client.id)
	attest(client.id).snap('custom')
})

it('infers provider name as ses', () => {
	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	attest<'ses'>(client.provider)
	attest(client.provider).snap('ses')
})

it('has supportsAttachments set to true', () => {
	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	attest<true>(client.options.supportsAttachments)
	attest(client.options.supportsAttachments).snap(true)
})

it('Ses type has correct structure', () => {
	attest<Ses<'test'>>({} as Ses<'test'>)
	attest<Ses<'default'>>({} as Ses<'default'>)
})

it('SesProviderOptions has supportsAttachments true', () => {
	attest<{ supportsAttachments: true }>({} as SesProviderOptions)
})

it('SesParams allows optional id and credentials', () => {
	const params1 = {
		accessKeyId: 'test',
		secretAccessKey: 'test',
		region: 'us-east-1'
	} satisfies SesParams
	const params2 = {
		id: 'custom',
		accessKeyId: 'test',
		secretAccessKey: 'test',
		region: 'us-east-1'
	} satisfies SesParams<'custom'>
	attest(params1.accessKeyId).snap('test')
	attest(params2.id).snap('custom')
})

// Error class tests
it('SesError has correct properties', () => {
	const error = new SesError(
		'Test message',
		400,
		'test_code',
		'Test suggestion'
	)

	attest(error.message).snap('Test message')
	attest(error.statusCode).snap(400)
	attest(error.code).snap('test_code')
	attest(error.suggestion).snap('Test suggestion')
	attest(error.name).snap('SesError')
})

it('MissingCredentialsConfigError has correct properties', () => {
	const error = new MissingCredentialsConfigError()

	attest(error.message).snap(
		'Missing AWS credentials. Please provide accessKeyId, secretAccessKey, and region via the configuration options or set the AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION environment variables.'
	)
	attest(error.statusCode).snap(500)
	attest(error.code).snap('missing_credentials_config')
})

it('AccountSendingPausedError has correct properties', () => {
	const error = new AccountSendingPausedError()

	attest(error.message).snap(
		'Email sending is disabled for your entire Amazon SES account.'
	)
	attest(error.statusCode).snap(400)
	attest(error.code).snap('AccountSendingPausedException')
})

it('ConfigurationSetDoesNotExistError has correct properties', () => {
	const error = new ConfigurationSetDoesNotExistError()

	attest(error.message).snap('The configuration set does not exist.')
	attest(error.statusCode).snap(400)
	attest(error.code).snap('ConfigurationSetDoesNotExist')
})

it('ConfigurationSetSendingPausedError has correct properties', () => {
	const error = new ConfigurationSetSendingPausedError()

	attest(error.message).snap(
		'Email sending is disabled for the configuration set.'
	)
	attest(error.statusCode).snap(400)
	attest(error.code).snap('ConfigurationSetSendingPausedException')
})

it('MailFromDomainNotVerifiedError has correct properties', () => {
	const error = new MailFromDomainNotVerifiedError()

	attest(error.message).snap(
		'The message could not be sent because Amazon SES could not read the MX record required to use the specified MAIL FROM domain.'
	)
	attest(error.statusCode).snap(400)
	attest(error.code).snap('MailFromDomainNotVerifiedException')
})

it('MessageRejectedError has correct properties', () => {
	const error = new MessageRejectedError()

	attest(error.message).snap(
		'The action failed, and the message could not be sent.'
	)
	attest(error.statusCode).snap(400)
	attest(error.code).snap('MessageRejected')
})

it('MessageRejectedError accepts custom message', () => {
	const error = new MessageRejectedError('Email address is not verified.')

	attest(error.message).snap('Email address is not verified.')
})

it('InvalidParameterValueError has correct properties', () => {
	const error = new InvalidParameterValueError()

	attest(error.message).snap(
		'An invalid or out-of-range value was supplied for the input parameter.'
	)
	attest(error.statusCode).snap(400)
	attest(error.code).snap('InvalidParameterValue')
})

it('MissingRequiredParameterError has correct properties', () => {
	const error = new MissingRequiredParameterError()

	attest(error.message).snap(
		'A required parameter for the specified action is not supplied.'
	)
	attest(error.statusCode).snap(400)
	attest(error.code).snap('MissingRequiredParameter')
})

it('SignatureDoesNotMatchError has correct properties', () => {
	const error = new SignatureDoesNotMatchError()

	attest(error.message).snap(
		'The request signature we calculated does not match the signature you provided.'
	)
	attest(error.statusCode).snap(403)
	attest(error.code).snap('SignatureDoesNotMatch')
})

it('AccessDeniedError has correct properties', () => {
	const error = new AccessDeniedError()

	attest(error.message).snap(
		'You do not have permission to perform this action.'
	)
	attest(error.statusCode).snap(403)
	attest(error.code).snap('AccessDenied')
})

it('InvalidClientTokenIdError has correct properties', () => {
	const error = new InvalidClientTokenIdError()

	attest(error.message).snap(
		'The security token included in the request is invalid.'
	)
	attest(error.statusCode).snap(403)
	attest(error.code).snap('InvalidClientTokenId')
})

it('IncompleteSignatureError has correct properties', () => {
	const error = new IncompleteSignatureError()

	attest(error.message).snap(
		'The request signature does not conform to AWS standards.'
	)
	attest(error.statusCode).snap(403)
	attest(error.code).snap('IncompleteSignature')
})

it('ThrottlingError has correct properties', () => {
	const error = new ThrottlingError()

	attest(error.message).snap(
		'Rate exceeded. Please slow down your request rate.'
	)
	attest(error.statusCode).snap(429)
	attest(error.code).snap('Throttling')
})

it('ServiceUnavailableError has correct properties', () => {
	const error = new ServiceUnavailableError()

	attest(error.message).snap('The service is temporarily unavailable.')
	attest(error.statusCode).snap(503)
	attest(error.code).snap('ServiceUnavailable')
})

it('InternalFailureError has correct properties', () => {
	const error = new InternalFailureError()

	attest(error.message).snap('An internal error occurred.')
	attest(error.statusCode).snap(500)
	attest(error.code).snap('InternalFailure')
})

it('NetworkError has correct properties', () => {
	const error = new NetworkError()

	attest(error.message).snap(
		'An error occurred while sending the email. Please check your network connection and try again.'
	)
	attest(error.statusCode).snap(500)
	attest(error.code).snap('network_error')
})

// createSesError factory tests
it('createSesError returns AccountSendingPausedError for AccountSendingPausedException', () => {
	const error = createSesError('AccountSendingPausedException')

	attest(error).instanceOf(AccountSendingPausedError)
})

it('createSesError returns ConfigurationSetDoesNotExistError for ConfigurationSetDoesNotExist', () => {
	const error = createSesError('ConfigurationSetDoesNotExist', 'Custom message')

	attest(error).instanceOf(ConfigurationSetDoesNotExistError)
	attest(error.message).snap('Custom message')
})

it('createSesError returns MessageRejectedError for MessageRejected', () => {
	const error = createSesError('MessageRejected', 'Email not verified')

	attest(error).instanceOf(MessageRejectedError)
	attest(error.message).snap('Email not verified')
})

it('createSesError returns SignatureDoesNotMatchError for SignatureDoesNotMatch', () => {
	const error = createSesError('SignatureDoesNotMatch')

	attest(error).instanceOf(SignatureDoesNotMatchError)
})

it('createSesError returns AccessDeniedError for AccessDenied', () => {
	const error = createSesError('AccessDenied')

	attest(error).instanceOf(AccessDeniedError)
})

it('createSesError returns AccessDeniedError for AccessDeniedException', () => {
	const error = createSesError('AccessDeniedException')

	attest(error).instanceOf(AccessDeniedError)
})

it('createSesError returns ThrottlingError for Throttling', () => {
	const error = createSesError('Throttling')

	attest(error).instanceOf(ThrottlingError)
})

it('createSesError returns generic SesError for unknown codes', () => {
	const error = createSesError('unknown_code', 'Unknown error', 500)

	attest(error).instanceOf(SesError)
	attest(error.message).snap('Unknown error')
	attest(error.code).snap('unknown_code')
})

// Functional tests
it('throws MissingCredentialsConfigError when no credentials are provided', () => {
	vi.stubEnv('AWS_ACCESS_KEY_ID', '')
	vi.stubEnv('AWS_SECRET_ACCESS_KEY', '')
	vi.stubEnv('AWS_REGION', '')

	try {
		ses({})
		throw new Error('Expected to throw')
	} catch (error) {
		attest(error).instanceOf(MissingCredentialsConfigError)
		attest((error as MissingCredentialsConfigError).code).snap(
			'missing_credentials_config'
		)
	}

	vi.unstubAllEnvs()
})

it('throws MissingCredentialsConfigError when accessKeyId is missing', () => {
	try {
		ses({ secretAccessKey: 'test', region: 'us-east-1' })
		throw new Error('Expected to throw')
	} catch (error) {
		attest(error).instanceOf(MissingCredentialsConfigError)
	}
})

it('throws MissingCredentialsConfigError when secretAccessKey is missing', () => {
	try {
		ses({ accessKeyId: 'test', region: 'us-east-1' })
		throw new Error('Expected to throw')
	} catch (error) {
		attest(error).instanceOf(MissingCredentialsConfigError)
	}
})

it('throws MissingCredentialsConfigError when region is missing', () => {
	try {
		ses({ accessKeyId: 'test', secretAccessKey: 'test' })
		throw new Error('Expected to throw')
	} catch (error) {
		attest(error).instanceOf(MissingCredentialsConfigError)
	}
})

it('accepts credentials as strings', () => {
	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('accepts credentials as functions returning strings', () => {
	const client = ses({
		accessKeyId: () => 'test-key-id',
		secretAccessKey: () => 'test-secret',
		region: () => 'us-east-1'
	})

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('accepts credentials as functions returning promises', () => {
	const client = ses({
		accessKeyId: () => Promise.resolve('test-key-id'),
		secretAccessKey: () => Promise.resolve('test-secret'),
		region: () => Promise.resolve('us-east-1')
	})

	attest(client.id).snap('default')
	attest(typeof client.send).snap('function')
})

it('send method returns AsyncResult type', () => {
	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest<AsyncResult<void, AnySesError>>(result)
})

it('send accepts all SES API parameters', () => {
	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

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
	attest(sendParams.subject).snap('Test Subject')
	attest(sendParams.to).snap([
		'recipient1@example.com',
		'recipient2@example.com'
	])
})

it('accepts configuration set name', () => {
	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1',
		configurationSetName: 'my-config-set'
	})

	attest(typeof client.send).snap('function')
})

// Integration tests with MSW
it('successfully sends an email', async () => {
	useSesHandler('success')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com', name: 'Test' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('success')
})

it('sends email with text content only', async () => {
	useSesHandler('success')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '',
		text: 'Plain text content'
	})

	attest(result.status).snap('success')
})

it('sends email with both text and html content', async () => {
	useSesHandler('success')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>HTML content</p>',
		text: 'Plain text content'
	})

	attest(result.status).snap('success')
})

it('sends email with attachments', async () => {
	useSesHandler('success')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>See attachment</p>',
		attachments: [
			{
				filename: 'test.txt',
				content: 'Hello World',
				contentType: 'text/plain'
			}
		]
	})

	attest(result.status).snap('success')
})

it('sends email with buffer attachment', async () => {
	useSesHandler('success')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>See attachment</p>',
		attachments: [
			{
				filename: 'test.bin',
				content: Buffer.from([0x00, 0x01, 0x02, 0x03])
			}
		]
	})

	attest(result.status).snap('success')
})

it('sends email with multiple recipients', async () => {
	useSesHandler('success')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: ['recipient1@example.com', 'recipient2@example.com'],
		cc: ['cc1@example.com', 'cc2@example.com'],
		bcc: ['bcc@example.com'],
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('success')
})

it('sends email with reply-to header', async () => {
	useSesHandler('success')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		replyTo: 'reply@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('success')
})

it('sends email with custom headers', async () => {
	useSesHandler('success')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>',
		headers: {
			'X-Custom-Header': 'custom-value',
			'X-Priority': '1'
		}
	})

	attest(result.status).snap('success')
})

it('handles account sending paused error', async () => {
	useSesHandler('accountSendingPaused')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('failure')
	if (result.status === 'failure') {
		attest(result.error).instanceOf(AccountSendingPausedError)
	}
})

it('handles configuration set does not exist error', async () => {
	useSesHandler('configurationSetDoesNotExist')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1',
		configurationSetName: 'nonexistent-config'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('failure')
	if (result.status === 'failure') {
		attest(result.error).instanceOf(ConfigurationSetDoesNotExistError)
	}
})

it('handles mail from domain not verified error', async () => {
	useSesHandler('mailFromDomainNotVerified')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@unverified.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('failure')
	if (result.status === 'failure') {
		attest(result.error).instanceOf(MailFromDomainNotVerifiedError)
	}
})

it('handles message rejected error', async () => {
	useSesHandler('messageRejected')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('failure')
	if (result.status === 'failure') {
		attest(result.error).instanceOf(MessageRejectedError)
	}
})

it('handles signature does not match error', async () => {
	useSesHandler('signatureDoesNotMatch')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('failure')
	if (result.status === 'failure') {
		attest(result.error).instanceOf(SignatureDoesNotMatchError)
	}
})

it('handles access denied error', async () => {
	useSesHandler('accessDenied')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('failure')
	if (result.status === 'failure') {
		attest(result.error).instanceOf(AccessDeniedError)
	}
})

it('handles invalid client token id error', async () => {
	useSesHandler('invalidClientTokenId')

	const client = ses({
		accessKeyId: 'invalid-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('failure')
	if (result.status === 'failure') {
		attest(result.error).instanceOf(InvalidClientTokenIdError)
	}
})

it('handles throttling error', async () => {
	useSesHandler('throttling')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('failure')
	if (result.status === 'failure') {
		attest(result.error).instanceOf(ThrottlingError)
	}
})

it('handles service unavailable error', async () => {
	useSesHandler('serviceUnavailable')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('failure')
	if (result.status === 'failure') {
		attest(result.error).instanceOf(ServiceUnavailableError)
	}
})

it('handles internal failure error', async () => {
	useSesHandler('internalFailure')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('failure')
	if (result.status === 'failure') {
		attest(result.error).instanceOf(InternalFailureError)
	}
})

it('handles network error', async () => {
	useSesHandler('networkError')

	const client = ses({
		accessKeyId: 'test-key-id',
		secretAccessKey: 'test-secret',
		region: 'us-east-1'
	})

	const result = await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	attest(result.status).snap('failure')
	if (result.status === 'failure') {
		attest(result.error).instanceOf(NetworkError)
	}
})

it('resolves credentials lazily on first send', async () => {
	useSesHandler('success')

	let accessKeyIdCalled = false
	let secretAccessKeyCalled = false
	let regionCalled = false

	const client = ses({
		accessKeyId: () => {
			accessKeyIdCalled = true
			return 'test-key-id'
		},
		secretAccessKey: () => {
			secretAccessKeyCalled = true
			return 'test-secret'
		},
		region: () => {
			regionCalled = true
			return 'us-east-1'
		}
	})

	// Credentials should not be resolved yet
	attest(accessKeyIdCalled).snap(false)
	attest(secretAccessKeyCalled).snap(false)
	attest(regionCalled).snap(false)

	await client.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test Email',
		html: '<p>Hello World</p>'
	})

	// Credentials should now be resolved
	attest(accessKeyIdCalled).snap(true)
	attest(secretAccessKeyCalled).snap(true)
	attest(regionCalled).snap(true)
})
