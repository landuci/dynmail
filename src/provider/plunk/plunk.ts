import { pkg } from '~/pkg'
import {
	Provider,
	type ProviderOptions,
	type SendMailParams
} from '../provider'
import {
	type AnyPlunkError,
	createPlunkError,
	MissingApiKeyConfigError,
	TooManyAttachmentsError
} from './plunk.error'

export function plunk<const ID extends string>(
	params: PlunkParams<ID> & { id: ID }
): Plunk<ID>
export function plunk(
	params?: PlunkParams<'default'> & { id?: never }
): Plunk<'default'>
export function plunk<ID extends string = 'default'>(
	params: PlunkParams<ID> = {}
): Plunk<ID> {
	const apiKey =
		params?.apiKey ??
		(typeof process !== 'undefined' && process.env.PLUNK_API_KEY)

	if (!apiKey) {
		throw new MissingApiKeyConfigError('plunk')
	}

	function parseSendParams(
		sendParams: SendMailParams<PlunkProviderOptions>
	): PlunkSendMailParams {
		const attachments = sendParams.attachments?.map((attachment) => ({
			filename: attachment.filename,
			content:
				typeof attachment.content === 'string'
					? attachment.content
					: (attachment.content?.toString('base64') ?? ''),
			content_type: attachment.contentType
		}))

		return {
			to: sendParams.to,
			subject: sendParams.subject,
			body: sendParams.html || sendParams.text || '',
			name: sendParams.from?.name,
			from: sendParams.from?.email,
			reply: Array.isArray(sendParams.replyTo)
				? sendParams.replyTo[0]
				: sendParams.replyTo,
			headers: sendParams.headers,
			attachments
		}
	}

	let resolvedUrl: string | undefined
	let resolvedApiKey: string | undefined

	return new Provider<ID, 'plunk', PlunkProviderOptions, void, AnyPlunkError>({
		id: params.id,
		provider: 'plunk',
		options: { supportsAttachments: true },
		send: async (sendParams) => {
			// Validate attachment count (max 5)
			if (sendParams.attachments && sendParams.attachments.length > 5) {
				return {
					status: 'failure',
					error: new TooManyAttachmentsError()
				}
			}

			const emailOptions = parseSendParams(sendParams)

			if (!resolvedUrl) {
				if (typeof params.baseUrl === 'string') {
					resolvedUrl = params.baseUrl
				} else if (typeof params.baseUrl === 'undefined') {
					resolvedUrl = 'https://api.useplunk.com'
				} else {
					const result = params.baseUrl()

					if (result instanceof Promise) {
						resolvedUrl = await result
					} else {
						resolvedUrl = result
					}
				}
			}

			if (!resolvedApiKey) {
				if (typeof apiKey === 'string') {
					resolvedApiKey = apiKey
				} else {
					const result = apiKey()

					if (result instanceof Promise) {
						resolvedApiKey = await result
					} else {
						resolvedApiKey = result
					}
				}
			}

			try {
				const response = await fetch(`${resolvedUrl}/v1/send`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${resolvedApiKey}`,
						'Content-Type': 'application/json',
						'User-Agent': `dynmail/${pkg.version}`
					},
					body: JSON.stringify(emailOptions)
				})

				if (!response.ok) {
					const json = (await response.json().catch(() => undefined)) as
						| { message?: string }
						| undefined

					return {
						status: 'failure',
						error: createPlunkError(
							response.status,
							json?.message ||
								'An unknown error occurred while sending the email.'
						)
					}
				}

				return { status: 'success' }
			} catch {
				return {
					status: 'failure',
					error: createPlunkError(
						500,
						'An error occurred while sending the email. Please check your network connection and try again.'
					)
				}
			}
		}
	})
}

export type Plunk<ID extends string = 'default'> = Provider<
	ID,
	'plunk',
	PlunkProviderOptions,
	void,
	AnyPlunkError
>

export type PlunkProviderOptions = ProviderOptions & {
	supportsAttachments: true
}

export type PlunkParams<ID extends string = 'default'> = {
	/**
	 * The identifier for the Plunk provider. This is useful when you have
	 * multiple providers and need to distinguish between them.
	 */
	id?: ID

	/**
	 * The API key for the Plunk provider. This is required to authenticate
	 * requests to the Plunk API.
	 *
	 * @default process.env.PLUNK_API_KEY
	 */
	apiKey?: string | (() => string) | (() => Promise<string>) | undefined

	/**
	 * The base URL for the Plunk API. This is useful if you are using a custom
	 * or self-hosted instance of Plunk.
	 *
	 * @default 'https://api.useplunk.com'
	 */
	baseUrl?: string | (() => string) | (() => Promise<string>) | undefined
}

type PlunkSendMailParams = {
	to: string | string[]
	subject: string
	body: string
	/**
	 * Override the name of the sender. Defaults to the project name.
	 */
	name?: string
	/**
	 * Override the email of the sender. Defaults to your verified email.
	 */
	from?: string
	/**
	 * Override the reply-to address. Defaults to the from address or your
	 * verified email if the from address is not set.
	 */
	reply?: string
	/**
	 * Additional headers to include in the email.
	 */
	headers?: Record<string, string>
	/**
	 * Up to 5 file attachments.
	 */
	attachments?: PlunkAttachment[]
}

type PlunkAttachment = {
	filename: string
	content: string
	content_type?: string
}
