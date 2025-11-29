import type { AsyncResult } from '~/asyncResult'
import type { Attachment } from '~/attachment'
import type { Provider, ProviderOptions } from '~/provider/provider'
import { ProviderNotFoundError } from '~/provider/provider.error'
import type { Sender } from '~/sender/sender'
import { SenderNotFoundError } from '~/sender/sender.error'

/**
 * Creates a Dynmail client with the specified configuration.
 *
 * @example
 * import { dynmail, resend, sender } from 'dynmail'
 *
 * export const mail = dynmail({
 *   providers: [resend()],
 *   senders: [sender({ email: 'example@myapp.com', name: 'My App' })]
 * })
 */
export function dynmail<
	const Providers extends readonly Provider<string, string, ProviderOptions>[],
	const Senders extends readonly Sender<string>[],
	SafeMode extends boolean = false
>(
	params: DynmailParams<Providers, Senders, SafeMode>
): Dynmail<Providers, Senders, SafeMode> {
	const { providers, senders, safe = false } = params

	const providerList = providers as unknown as Provider<
		string,
		string,
		ProviderOptions
	>[]
	const senderList = senders as unknown as Sender<string>[]

	const send = async (
		sendParams: DynmailSendMailParams<Providers, Senders>
	) => {
		const providerId = sendParams.provider ?? 'default'

		const provider =
			providerList.find((p) => p.id === providerId) || providerList[0]

		if (!provider) {
			const error = new ProviderNotFoundError(providerId)
			if (safe) {
				return {
					status: 'failure' as const,
					error
				}
			}
			throw error
		}

		const senderId = sendParams.from ?? 'default'

		const sender = senderList.find((s) => s.id === senderId) || senderList[0]

		if (!sender) {
			const error = new SenderNotFoundError(senderId)

			if (safe) {
				return {
					status: 'failure' as const,
					error
				}
			}

			throw error
		}

		return provider.send({
			from: sender,
			to: sendParams.to,
			html: sendParams.body,
			subject: sendParams.subject,
			bcc: sendParams.bcc,
			cc: sendParams.cc,
			headers: sendParams.headers,
			replyTo: sendParams.replyTo,
			text: sendParams.text
		})
	}

	if (safe) {
		return { send } as Dynmail<Providers, Senders, SafeMode>
	} else {
		return {
			send: async (sendParams: DynmailSendMailParams<Providers, Senders>) => {
				const result = await send(sendParams)
				if (result.status === 'failure') {
					throw result.error
				}
				return result
			}
		} as Dynmail<Providers, Senders, SafeMode>
	}
}

type Dynmail<
	Providers extends readonly Provider<string, string, ProviderOptions>[],
	Senders extends readonly Sender<string>[],
	SafeMode extends boolean = false
> = SafeMode extends true
	? {
			send(
				params: DynmailSendMailParams<Providers, Senders>
			): AsyncResult<void, Error>
		}
	: {
			send(
				params: DynmailSendMailParams<Providers, Senders>
			): Promise<{ status: 'success' }>
		}

type DynmailSendMailParams<
	Providers extends readonly Provider<string, string, ProviderOptions>[],
	Senders extends readonly Sender<string>[]
> = {
	provider?: Providers[number]['id']
	from?: Senders[number]['id']
	to: string | string[]
	cc?: string | string[]
	bcc?: string | string[]
	subject: string
	body: string
	text?: string
	replyTo?: string | string[]
	attachments?: CheckProvidersForAttachmentSupport<Providers>
	headers?: Record<string, string>
}

export type DynmailParams<
	Providers extends readonly Provider<string, string, ProviderOptions>[],
	Senders extends readonly Sender<string>[],
	SafeMode extends boolean = false
> = {
	providers: ValidateProviders<Providers>
	senders: ValidateSenders<Senders>
	safe?: SafeMode
}

type ValidateProviders<T> = T extends readonly []
	? '❌ You must provide at least one provider.'
	: T extends readonly [Provider<string, string, ProviderOptions>]
		? T
		: T extends readonly Provider<string, string, ProviderOptions>[]
			? FindDuplicateIDsOnProviders<T> extends never
				? T
				: `❌ Duplicate provider ID found: ${FindDuplicateIDsOnProviders<T>}`
			: T

type FindDuplicateIDsOnProviders<
	T extends readonly Provider<string, string, ProviderOptions>[]
> = T extends readonly [
	Provider<infer First, string, ProviderOptions>,
	...infer Rest
]
	? Rest extends readonly Provider<string, string, ProviderOptions>[]
		? First extends ExtractAllIDsOnProviders<Rest>
			? First
			: FindDuplicateIDsOnProviders<Rest>
		: never
	: never

type ExtractAllIDsOnProviders<
	T extends readonly Provider<string, string, ProviderOptions>[]
> = T extends readonly [
	Provider<infer K, string, ProviderOptions>,
	...infer Rest
]
	? Rest extends readonly Provider<string, string, ProviderOptions>[]
		? K | ExtractAllIDsOnProviders<Rest>
		: K
	: never

type ValidateSenders<T> = T extends readonly []
	? '❌ You must provide at least one sender.'
	: T extends readonly [Sender<string>]
		? T
		: T extends readonly Sender<string>[]
			? FindDuplicateIDsOnSenders<T> extends never
				? T
				: `❌ Duplicate sender ID found: ${FindDuplicateIDsOnSenders<T>}`
			: T

type FindDuplicateIDsOnSenders<T extends readonly Sender<string>[]> =
	T extends readonly [Sender<infer First>, ...infer Rest]
		? Rest extends readonly Sender<string>[]
			? First extends ExtractAllIDsOnSenders<Rest>
				? First
				: FindDuplicateIDsOnSenders<Rest>
			: never
		: never

type ExtractAllIDsOnSenders<T extends readonly Sender<string>[]> =
	T extends readonly [Sender<infer K>, ...infer Rest]
		? Rest extends readonly Sender<string>[]
			? K | ExtractAllIDsOnSenders<Rest>
			: K
		: never

type CheckProvidersForAttachmentSupport<
	Providers extends readonly Provider<string, string, ProviderOptions>[]
> = Providers extends readonly [
	Provider<string, string, infer Options>,
	...infer Rest
]
	? Options extends { supportsAttachments: true }
		? Attachment[]
		: Rest extends readonly Provider<string, string, ProviderOptions>[]
			? CheckProvidersForAttachmentSupport<Rest>
			: '❌ None of your providers support attachments.'
	: '❌ None of your providers support attachments.'
