export class DynmailError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'DynmailError'
	}
}
