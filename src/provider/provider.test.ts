import { attest } from '@ark/attest'
import { it } from 'vitest'
import { sender } from '../sender/sender'
import { Provider, type SendMailParams } from './provider'

it('creates a provider with default id and provider name', () => {
	const provider = new Provider({
		options: { supportsAttachments: false },
		send: async () => ({ status: 'success' })
	})

	attest(provider.id).snap('default')
	attest(provider.provider).snap('none')
})

it('creates a provider with custom id', () => {
	const provider = new Provider({
		id: 'resend',
		options: { supportsAttachments: true },
		send: async () => ({ status: 'success' })
	})

	attest(provider.id).snap('resend')
	attest(provider.id).type.toString.snap('"resend"')
})

it('creates a provider with custom provider name', () => {
	const provider = new Provider({
		id: 'main',
		provider: 'resend',
		options: { supportsAttachments: true },
		send: async () => ({ status: 'success' })
	})

	attest(provider.provider).snap('resend')
	attest(provider.provider).type.toString.snap('"resend"')
})

it('stores options correctly', () => {
	const provider = new Provider({
		options: { supportsAttachments: true },
		send: async () => ({ status: 'success' })
	})

	attest(provider.options).snap({ supportsAttachments: true })
})

it('calls send function with correct params', async () => {
	let capturedParams: SendMailParams | undefined

	const provider = new Provider({
		options: { supportsAttachments: false },
		send: async (params) => {
			capturedParams = params
			return { status: 'success' }
		}
	})

	const from = sender({ email: 'test@example.com' })

	await provider.send({
		from,
		to: 'recipient@example.com',
		subject: 'Test Subject',
		html: '<p>Hello</p>'
	})

	attest(capturedParams?.to).snap('recipient@example.com')
	attest(capturedParams?.subject).snap('Test Subject')
	attest(capturedParams?.html).snap('<p>Hello</p>')
})

it('returns success result from send', async () => {
	const provider = new Provider({
		options: { supportsAttachments: false },
		send: async () => ({ status: 'success', data: { messageId: '123' } })
	})

	const result = await provider.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result).snap({ status: 'success', data: { messageId: '123' } })
})

it('returns failure result from send', async () => {
	const provider = new Provider({
		options: { supportsAttachments: false },
		send: async () => ({ status: 'failure', error: 'Send failed' })
	})

	const result = await provider.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(result).snap({ status: 'failure', error: 'Send failed' })
})

it('infers correct types for provider properties', () => {
	const provider = new Provider({
		id: 'typed',
		provider: 'custom',
		options: { supportsAttachments: true },
		send: async () => ({ status: 'success' })
	})

	attest(provider.id).type.toString.snap('"typed"')
	attest(provider.provider).type.toString.snap('"custom"')
	attest(provider.options).type.toString.snap('{ supportsAttachments: true }')
})

it('allows attachments when supportsAttachments is true', () => {
	const provider = new Provider({
		options: { supportsAttachments: true } as const,
		send: async () => ({ status: 'success' })
	})

	attest(provider.options.supportsAttachments).snap(true)
})

it('handles multiple recipients', async () => {
	let capturedParams: SendMailParams | undefined

	const provider = new Provider({
		options: { supportsAttachments: false },
		send: async (params) => {
			capturedParams = params
			return { status: 'success' }
		}
	})

	await provider.send({
		from: sender({ email: 'test@example.com' }),
		to: ['a@example.com', 'b@example.com'],
		cc: ['cc@example.com'],
		bcc: ['bcc@example.com'],
		subject: 'Test',
		html: '<p>Test</p>'
	})

	attest(capturedParams?.to).snap(['a@example.com', 'b@example.com'])
	attest(capturedParams?.cc).snap(['cc@example.com'])
	attest(capturedParams?.bcc).snap(['bcc@example.com'])
})

it('handles custom headers', async () => {
	let capturedParams: SendMailParams | undefined

	const provider = new Provider({
		options: { supportsAttachments: false },
		send: async (params) => {
			capturedParams = params
			return { status: 'success' }
		}
	})

	await provider.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Test</p>',
		headers: { 'X-Custom': 'value' }
	})

	attest(capturedParams?.headers).snap({ 'X-Custom': 'value' })
})

it('handles text and html content', async () => {
	let capturedParams: SendMailParams | undefined

	const provider = new Provider({
		options: { supportsAttachments: false },
		send: async (params) => {
			capturedParams = params
			return { status: 'success' }
		}
	})

	await provider.send({
		from: sender({ email: 'test@example.com' }),
		to: 'recipient@example.com',
		subject: 'Test',
		html: '<p>Hello</p>',
		text: 'Hello'
	})

	attest(capturedParams?.html).snap('<p>Hello</p>')
	attest(capturedParams?.text).snap('Hello')
})
