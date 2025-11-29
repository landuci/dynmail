import type { AsyncResult } from '~/asyncResult'
import type { Attachment } from '~/attachment'
import type { Sender } from '~/sender/sender'

export class Provider<
	ID extends string = 'default',
	Provider extends string = 'none',
	TOptions extends ProviderOptions = ProviderOptions,
	TSuccess = void,
	TError = unknown
> {
	public id: ID
	public provider: Provider
	public options: TOptions
	public send: (
		params: SendMailParams<TOptions>
	) => AsyncResult<TSuccess, TError>

	public constructor(
		params: ProviderConstructorParams<ID, Provider, TOptions, TSuccess, TError>
	) {
		this.id = params.id ?? ('default' as ID)
		this.provider = params.provider ?? ('none' as Provider)
		this.options = params.options
		this.send = params.send
	}
}

export type ProviderOptions = {
	supportsAttachments: boolean
}

type ProviderConstructorParams<
	ID extends string = 'default',
	Provider extends string = 'none',
	TOptions extends ProviderOptions = ProviderOptions,
	TSuccess = void,
	TError = unknown
> = {
	/**
	 * The identifier for the provider. This is useful when you have multiple
	 * providers and need to distinguish between them.
	 */
	id?: ID

	/**
	 * The name of the provider. This is useful for logging and debugging.
	 */
	provider?: Provider

	/**
	 * The options for the provider, including capabilities like attachment support.
	 */
	options: TOptions

	/*
	 * The function that will be used to send the email. It should return a
	 * Promise that resolves to a Result type.
	 */
	send: (params: SendMailParams<TOptions>) => AsyncResult<TSuccess, TError>
}

export type SendMailParams<TOptions extends ProviderOptions = ProviderOptions> =
	{
		from: Sender<string>
		to: string | string[]
		subject: string
		html: string
		text?: string
		bcc?: string | string[]
		cc?: string | string[]
		replyTo?: string | string[]
		headers?: Record<string, string>
	} & (TOptions['supportsAttachments'] extends true
		? { attachments?: Attachment[] }
		: { attachments?: never })
