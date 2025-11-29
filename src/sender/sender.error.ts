import { DynmailError } from '~/dynmail/dynmail.error'

export class SenderNotFoundError extends DynmailError {
	constructor(senderId: string) {
		super(`Sender '${senderId}' not found.`)
		this.name = 'SenderNotFoundError'
	}
}
