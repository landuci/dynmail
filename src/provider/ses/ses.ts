import { createHash, createHmac } from 'node:crypto'
import { pkg } from '~/pkg'
import {
	Provider,
	type ProviderOptions,
	type SendMailParams
} from '../provider'
import {
	type AnySesError,
	createSesError,
	MissingCredentialsConfigError
} from './ses.error'

export function ses<const ID extends string>(
	params: SesParams<ID> & { id: ID }
): Ses<ID>
export function ses(
	params?: SesParams<'default'> & { id?: never }
): Ses<'default'>
export function ses<ID extends string = 'default'>(
	params: SesParams<ID> = {}
): Ses<ID> {
	const accessKeyId =
		params?.accessKeyId ??
		(typeof process !== 'undefined' && process.env.AWS_ACCESS_KEY_ID)

	const secretAccessKey =
		params?.secretAccessKey ??
		(typeof process !== 'undefined' && process.env.AWS_SECRET_ACCESS_KEY)

	const region =
		params?.region ?? (typeof process !== 'undefined' && process.env.AWS_REGION)

	if (!accessKeyId || !secretAccessKey || !region) {
		throw new MissingCredentialsConfigError()
	}

	let resolvedAccessKeyId: string | undefined
	let resolvedSecretAccessKey: string | undefined
	let resolvedRegion: string | undefined

	return new Provider<ID, 'ses', SesProviderOptions, void, AnySesError>({
		id: params.id,
		provider: 'ses',
		options: { supportsAttachments: true },
		send: async (sendParams) => {
			// Resolve credentials if they are functions
			if (!resolvedAccessKeyId) {
				resolvedAccessKeyId = await resolveValue(accessKeyId)
			}
			if (!resolvedSecretAccessKey) {
				resolvedSecretAccessKey = await resolveValue(secretAccessKey)
			}
			if (!resolvedRegion) {
				resolvedRegion = await resolveValue(region)
			}

			const rawMessage = buildRawEmail(sendParams)
			const host = `email.${resolvedRegion}.amazonaws.com`
			const endpoint = `https://${host}/`

			// Build request body (form-urlencoded)
			const body = buildRequestBody(rawMessage, params.configurationSetName)

			// Create AWS Signature Version 4
			const now = new Date()
			const amzDate = formatAmzDate(now)
			const dateStamp = formatDateStamp(now)

			const headers: Record<string, string> = {
				'Content-Type': 'application/x-www-form-urlencoded',
				Host: host,
				'X-Amz-Date': amzDate,
				'User-Agent': `dynmail/${pkg.version}`
			}

			// Calculate payload hash
			const payloadHash = hash(body)

			// Create canonical request
			const canonicalRequest = createCanonicalRequest(
				'POST',
				'/',
				'',
				headers,
				payloadHash
			)

			// Create string to sign
			const credentialScope = `${dateStamp}/${resolvedRegion}/ses/aws4_request`
			const stringToSign = createStringToSign(
				amzDate,
				credentialScope,
				canonicalRequest
			)

			// Calculate signature
			const signingKey = getSigningKey(
				resolvedSecretAccessKey,
				dateStamp,
				resolvedRegion,
				'ses'
			)
			const signature = hmac(signingKey, stringToSign, 'hex')

			// Create authorization header
			const signedHeaders = Object.keys(headers)
				.map((k) => k.toLowerCase())
				.sort()
				.join(';')

			const authorization =
				`AWS4-HMAC-SHA256 Credential=${resolvedAccessKeyId}/${credentialScope}, ` +
				`SignedHeaders=${signedHeaders}, Signature=${signature}`

			headers['Authorization'] = authorization

			try {
				const response = await fetch(endpoint, {
					method: 'POST',
					headers,
					body
				})

				if (!response.ok) {
					const text = await response.text().catch(() => '')
					const errorInfo = parseAwsError(text)

					return {
						status: 'failure',
						error: createSesError(
							errorInfo.code || 'unknown_error',
							errorInfo.message,
							response.status
						)
					}
				}

				return { status: 'success' }
			} catch {
				return {
					status: 'failure',
					error: createSesError(
						'network_error',
						'An error occurred while sending the email. Please check your network connection and try again.',
						500
					)
				}
			}
		}
	})
}

async function resolveValue(
	value: string | (() => string) | (() => Promise<string>)
): Promise<string> {
	if (typeof value === 'string') {
		return value
	}
	const result = value()
	if (result instanceof Promise) {
		return await result
	}
	return result
}

function buildRawEmail(params: SendMailParams<SesProviderOptions>): string {
	const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`
	const mixedBoundary = `----=_Mixed_${Date.now()}_${Math.random().toString(36).substring(2)}`

	const lines: string[] = []

	// Headers
	lines.push(`From: ${params.from.toString()}`)
	lines.push(
		`To: ${Array.isArray(params.to) ? params.to.join(', ') : params.to}`
	)

	if (params.cc) {
		lines.push(
			`Cc: ${Array.isArray(params.cc) ? params.cc.join(', ') : params.cc}`
		)
	}

	if (params.bcc) {
		lines.push(
			`Bcc: ${Array.isArray(params.bcc) ? params.bcc.join(', ') : params.bcc}`
		)
	}

	lines.push(
		`Subject: =?UTF-8?B?${Buffer.from(params.subject).toString('base64')}?=`
	)

	if (params.replyTo) {
		const replyTo = Array.isArray(params.replyTo)
			? params.replyTo.join(', ')
			: params.replyTo
		lines.push(`Reply-To: ${replyTo}`)
	}

	// Custom headers
	if (params.headers) {
		for (const [key, value] of Object.entries(params.headers)) {
			lines.push(`${key}: ${value}`)
		}
	}

	lines.push('MIME-Version: 1.0')

	const hasAttachments = params.attachments && params.attachments.length > 0

	if (hasAttachments) {
		// Multipart/mixed for attachments
		lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`)
		lines.push('')
		lines.push(`--${mixedBoundary}`)
	}

	// Content part (text and/or html)
	if (params.text && params.html) {
		// Multipart/alternative for both text and html
		lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)
		lines.push('')

		// Plain text part
		lines.push(`--${boundary}`)
		lines.push('Content-Type: text/plain; charset=UTF-8')
		lines.push('Content-Transfer-Encoding: base64')
		lines.push('')
		lines.push(Buffer.from(params.text).toString('base64'))
		lines.push('')

		// HTML part
		lines.push(`--${boundary}`)
		lines.push('Content-Type: text/html; charset=UTF-8')
		lines.push('Content-Transfer-Encoding: base64')
		lines.push('')
		lines.push(Buffer.from(params.html).toString('base64'))
		lines.push('')

		lines.push(`--${boundary}--`)
	} else if (params.html) {
		lines.push('Content-Type: text/html; charset=UTF-8')
		lines.push('Content-Transfer-Encoding: base64')
		lines.push('')
		lines.push(Buffer.from(params.html).toString('base64'))
	} else if (params.text) {
		lines.push('Content-Type: text/plain; charset=UTF-8')
		lines.push('Content-Transfer-Encoding: base64')
		lines.push('')
		lines.push(Buffer.from(params.text).toString('base64'))
	}

	// Attachments
	if (hasAttachments && params.attachments) {
		for (const attachment of params.attachments) {
			lines.push('')
			lines.push(`--${mixedBoundary}`)

			const contentType = attachment.contentType || 'application/octet-stream'
			lines.push(`Content-Type: ${contentType}; name="${attachment.filename}"`)
			lines.push('Content-Transfer-Encoding: base64')
			lines.push(
				`Content-Disposition: attachment; filename="${attachment.filename}"`
			)
			lines.push('')

			let content: string
			if (typeof attachment.content === 'string') {
				// Check if it's already base64 encoded
				content = Buffer.from(attachment.content).toString('base64')
			} else if (Buffer.isBuffer(attachment.content)) {
				content = attachment.content.toString('base64')
			} else {
				content = ''
			}

			lines.push(content)
		}

		lines.push('')
		lines.push(`--${mixedBoundary}--`)
	}

	return lines.join('\r\n')
}

function buildRequestBody(
	rawMessage: string,
	configurationSetName?: string
): string {
	const params: Record<string, string> = {
		Action: 'SendRawEmail',
		'RawMessage.Data': Buffer.from(rawMessage).toString('base64')
	}

	if (configurationSetName) {
		params['ConfigurationSetName'] = configurationSetName
	}

	return Object.entries(params)
		.map(
			([key, value]) =>
				`${encodeURIComponent(key)}=${encodeURIComponent(value)}`
		)
		.join('&')
}

function formatAmzDate(date: Date): string {
	return date.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

function formatDateStamp(date: Date): string {
	return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function hash(data: string): string {
	return createHash('sha256').update(data, 'utf8').digest('hex')
}

function hmac(key: string | Buffer, data: string, encoding?: 'hex'): Buffer
function hmac(key: string | Buffer, data: string, encoding: 'hex'): string
function hmac(
	key: string | Buffer,
	data: string,
	encoding?: 'hex'
): Buffer | string {
	const h = createHmac('sha256', key).update(data, 'utf8')
	return encoding === 'hex' ? h.digest('hex') : h.digest()
}

function createCanonicalRequest(
	method: string,
	uri: string,
	queryString: string,
	headers: Record<string, string>,
	payloadHash: string
): string {
	const sortedHeaders = Object.entries(headers)
		.map(([key, value]) => [key.toLowerCase(), value.trim()] as const)
		.sort((a, b) => a[0].localeCompare(b[0]))

	const canonicalHeaders = sortedHeaders
		.map(([key, value]) => `${key}:${value}`)
		.join('\n')

	const signedHeaders = sortedHeaders.map(([key]) => key).join(';')

	return [
		method,
		uri,
		queryString,
		canonicalHeaders,
		'',
		signedHeaders,
		payloadHash
	].join('\n')
}

function createStringToSign(
	amzDate: string,
	credentialScope: string,
	canonicalRequest: string
): string {
	return [
		'AWS4-HMAC-SHA256',
		amzDate,
		credentialScope,
		hash(canonicalRequest)
	].join('\n')
}

function getSigningKey(
	secretAccessKey: string,
	dateStamp: string,
	region: string,
	service: string
): Buffer {
	const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp)
	const kRegion = hmac(kDate, region)
	const kService = hmac(kRegion, service)
	const kSigning = hmac(kService, 'aws4_request')
	return kSigning
}

function parseAwsError(xmlResponse: string): {
	code?: string
	message?: string
} {
	// Parse error code
	const codeMatch = xmlResponse.match(/<Code>([^<]+)<\/Code>/)
	const code = codeMatch?.[1]

	// Parse error message
	const messageMatch = xmlResponse.match(/<Message>([^<]+)<\/Message>/)
	const message = messageMatch?.[1]

	return { code, message }
}

export type Ses<ID extends string = 'default'> = Provider<
	ID,
	'ses',
	SesProviderOptions,
	void,
	AnySesError
>

export type SesProviderOptions = ProviderOptions & {
	supportsAttachments: true
}

export type SesParams<ID extends string = 'default'> = {
	/**
	 * The identifier for the SES provider. This is useful when you have
	 * multiple providers and need to distinguish between them.
	 */
	id?: ID

	/**
	 * The AWS Access Key ID for authentication.
	 *
	 * @default process.env.AWS_ACCESS_KEY_ID
	 */
	accessKeyId?: string | (() => string) | (() => Promise<string>) | undefined

	/**
	 * The AWS Secret Access Key for authentication.
	 *
	 * @default process.env.AWS_SECRET_ACCESS_KEY
	 */
	secretAccessKey?:
		| string
		| (() => string)
		| (() => Promise<string>)
		| undefined

	/**
	 * The AWS region where the SES service is located.
	 *
	 * @default process.env.AWS_REGION
	 */
	region?: string | (() => string) | (() => Promise<string>) | undefined

	/**
	 * The name of the configuration set to use when sending emails.
	 */
	configurationSetName?: string
}
