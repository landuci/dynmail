import { DynmailError } from '~/dynmail/dynmail.error'

export class ProviderNotFoundError extends DynmailError {
	constructor(providerId: string) {
		super(`Provider '${providerId}' not found.`)
		this.name = 'ProviderNotFoundError'
	}
}
