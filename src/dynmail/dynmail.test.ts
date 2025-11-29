import { attest } from '@ark/attest'
import { it } from 'vitest'
import { ProviderNotFoundError } from '~/provider/provider.error'
import { SenderNotFoundError } from '~/sender/sender.error'
import { Provider } from '../provider/provider'
import { sender } from '../sender/sender'
import { dynmail } from './dynmail'

const createMockProvider = <ID extends string = 'default'>(
	id?: ID,
	shouldFail = false
) =>
	new Provider({
		id,
		options: { supportsAttachments: false },
		send: async () =>
			shouldFail
				? { status: 'failure' as const, error: new Error('Send failed') }
				: { status: 'success' as const }
	})

const createMockSender = <ID extends string = 'default'>(id?: ID) =>
	id
		? sender({ id, email: `${id}@example.com` })
		: sender({ email: 'default@example.com' })

it('creates a dynmail client with providers and senders', () => {
	const mail = dynmail({
		providers: [createMockProvider()],
		senders: [createMockSender()]
	})

	attest(typeof mail.send).snap('function')
})

it('creates a dynmail client in safe mode', () => {
	const mail = dynmail({
		providers: [createMockProvider()],
		senders: [createMockSender()],
		safe: true
	})

	attest(typeof mail.send).snap('function')
})

it('sends an email successfully', async () => {
	const mail = dynmail({
		providers: [createMockProvider()],
		senders: [createMockSender()],
		safe: true
	})

	const result = await mail.send({
		to: 'recipient@example.com',
		subject: 'Test',
		body: '<p>Hello</p>'
	})

	attest(result.status).snap('success')
})

it('sends with specific provider id', async () => {
	let usedProvider: string | undefined

	const resendProvider = new Provider({
		id: 'resend',
		options: { supportsAttachments: false },
		send: async () => {
			usedProvider = 'resend'
			return { status: 'success' as const }
		}
	})

	const sesProvider = new Provider({
		id: 'ses',
		options: { supportsAttachments: false },
		send: async () => {
			usedProvider = 'ses'
			return { status: 'success' as const }
		}
	})

	const mail = dynmail({
		providers: [resendProvider, sesProvider],
		senders: [createMockSender()],
		safe: true
	})

	await mail.send({
		provider: 'ses',
		to: 'recipient@example.com',
		subject: 'Test',
		body: '<p>Hello</p>'
	})

	attest(usedProvider).snap('ses')
})

it('sends with specific sender id', async () => {
	let usedSenderEmail: string | undefined

	const mockProvider = new Provider({
		id: 'mock',
		options: { supportsAttachments: false },
		send: async (params) => {
			usedSenderEmail = params.from.email
			return { status: 'success' as const }
		}
	})

	const mail = dynmail({
		providers: [mockProvider],
		senders: [
			sender({ id: 'support', email: 'support@example.com' }),
			sender({ id: 'sales', email: 'sales@example.com' })
		],
		safe: true
	})

	await mail.send({
		from: 'sales',
		to: 'recipient@example.com',
		subject: 'Test',
		body: '<p>Hello</p>'
	})

	attest(usedSenderEmail).snap('sales@example.com')
})

it('uses first provider when specified provider not found', async () => {
	let usedProvider: string | undefined

	const firstProvider = new Provider({
		id: 'first',
		options: { supportsAttachments: false },
		send: async () => {
			usedProvider = 'first'
			return { status: 'success' as const }
		}
	})

	const mail = dynmail({
		providers: [firstProvider],
		senders: [createMockSender()],
		safe: true
	})

	await mail.send({
		provider: 'nonexistent' as 'first',
		to: 'recipient@example.com',
		subject: 'Test',
		body: '<p>Hello</p>'
	})

	attest(usedProvider).snap('first')
})

it('ProviderNotFoundError has correct message', () => {
	const error = new ProviderNotFoundError('resend')

	attest(error.message).snap("Provider 'resend' not found.")
	attest(error.name).snap('ProviderNotFoundError')
})

it('SenderNotFoundError has correct message', () => {
	const error = new SenderNotFoundError('support')

	attest(error.message).snap("Sender 'support' not found.")
	attest(error.name).snap('SenderNotFoundError')
})

it('infers provider id type correctly', () => {
	const mail = dynmail({
		providers: [createMockProvider('resend'), createMockProvider('ses')],
		senders: [createMockSender()]
	})

	// The provider param should accept 'resend' | 'ses'
	attest<'resend' | 'ses' | undefined>(
		{} as Parameters<typeof mail.send>[0]['provider']
	)
})

it('infers sender id type correctly', () => {
	const mail = dynmail({
		providers: [createMockProvider()],
		senders: [
			sender({ id: 'support', email: 'support@example.com' }),
			sender({ id: 'sales', email: 'sales@example.com' })
		]
	})

	// The from param should accept 'support' | 'sales'
	attest<'support' | 'sales' | undefined>(
		{} as Parameters<typeof mail.send>[0]['from']
	)
})

it('creates dynmail with multiple unique provider IDs', () => {
	const mail = dynmail({
		providers: [createMockProvider('resend'), createMockProvider('ses')],
		senders: [createMockSender()]
	})

	attest<'resend' | 'ses' | undefined>(
		{} as Parameters<typeof mail.send>[0]['provider']
	)
})

it('creates dynmail with multiple unique sender IDs', () => {
	const mail = dynmail({
		providers: [createMockProvider()],
		senders: [
			sender({ id: 'support', email: 'a@example.com' }),
			sender({ id: 'sales', email: 'b@example.com' })
		]
	})

	attest<'support' | 'sales' | undefined>(
		{} as Parameters<typeof mail.send>[0]['from']
	)
})

it('errors on duplicate sender IDs', () => {
	// prettier-ignore
	attest(() =>
		dynmail({
			providers: [createMockProvider()],
			// @ts-expect-error
			senders: [
				sender({ email: 'a@example.com' }),
				sender({ email: 'b@example.com' })
			]
		})
	).type.errors('❌ Duplicate sender ID found: default')
})

it('errors on duplicate provider IDs', () => {
	// prettier-ignore
	attest(() =>
		dynmail({
			// @ts-expect-error
			providers: [createMockProvider('resend'), createMockProvider('resend')],
			senders: [sender({ email: 'a@example.com' })]
		})
	).type.errors('❌ Duplicate provider ID found: resend')
})

it('passes all send params to provider', async () => {
	let capturedParams: unknown

	const mockProvider = new Provider({
		options: { supportsAttachments: false },
		send: async (params) => {
			capturedParams = params
			return { status: 'success' as const }
		}
	})

	const mail = dynmail({
		providers: [mockProvider],
		senders: [sender({ name: 'Test', email: 'test@example.com' })],
		safe: true
	})

	await mail.send({
		to: ['a@example.com', 'b@example.com'],
		subject: 'Test Subject',
		body: '<p>HTML Body</p>',
		text: 'Plain text',
		cc: 'cc@example.com',
		bcc: ['bcc1@example.com', 'bcc2@example.com'],
		replyTo: 'reply@example.com',
		headers: { 'X-Custom': 'value' }
	})

	attest(capturedParams).snap({
		from: { id: 'default', name: 'Test', email: 'test@example.com' },
		to: ['a@example.com', 'b@example.com'],
		subject: 'Test Subject',
		html: '<p>HTML Body</p>',
		text: 'Plain text',
		cc: 'cc@example.com',
		bcc: ['bcc1@example.com', 'bcc2@example.com'],
		replyTo: 'reply@example.com',
		headers: { 'X-Custom': 'value' }
	})
})

it('returns ProviderNotFoundError when no providers exist', async () => {
	const mail = dynmail({
		providers: [] as unknown as [ReturnType<typeof createMockProvider>],
		senders: [createMockSender()],
		safe: true
	})

	const result = await mail.send({
		to: 'recipient@example.com',
		subject: 'Test',
		body: '<p>Hello</p>'
	})

	attest(result.status).snap('failure')
	attest((result as { error: Error }).error).instanceOf(ProviderNotFoundError)
})

it('returns SenderNotFoundError when no senders exist', async () => {
	const mail = dynmail({
		providers: [createMockProvider()],
		senders: [] as unknown as [ReturnType<typeof createMockSender>],
		safe: true
	})

	const result = await mail.send({
		to: 'recipient@example.com',
		subject: 'Test',
		body: '<p>Hello</p>'
	})

	attest(result.status).snap('failure')
	attest((result as { error: Error }).error).instanceOf(SenderNotFoundError)
})

it('throws error in non-safe mode when provider not found', async () => {
	const mail = dynmail({
		providers: [] as unknown as [ReturnType<typeof createMockProvider>],
		senders: [createMockSender()],
		safe: false
	})

	let thrownError: Error | undefined
	try {
		await mail.send({
			to: 'recipient@example.com',
			subject: 'Test',
			body: '<p>Hello</p>'
		})
	} catch (e) {
		thrownError = e as Error
	}

	attest(thrownError).instanceOf(ProviderNotFoundError)
	attest(thrownError?.message).snap("Provider 'default' not found.")
})

it('throws error in non-safe mode when sender not found', async () => {
	const mail = dynmail({
		providers: [createMockProvider()],
		senders: [] as unknown as [ReturnType<typeof createMockSender>],
		safe: false
	})

	let thrownError: Error | undefined
	try {
		await mail.send({
			to: 'recipient@example.com',
			subject: 'Test',
			body: '<p>Hello</p>'
		})
	} catch (e) {
		thrownError = e as Error
	}

	attest(thrownError).instanceOf(SenderNotFoundError)
	attest(thrownError?.message).snap("Sender 'default' not found.")
})

it('returns success result in non-safe mode', async () => {
	const mail = dynmail({
		providers: [createMockProvider()],
		senders: [createMockSender()],
		safe: false
	})

	const result = await mail.send({
		to: 'recipient@example.com',
		subject: 'Test',
		body: '<p>Hello</p>'
	})

	attest(result.status).snap('success')
})
