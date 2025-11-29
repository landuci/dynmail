export type { AsyncResult, Result } from './asyncResult'
export type { Attachment } from './attachment'
export type { DynmailParams } from './dynmail/dynmail'
export { dynmail } from './dynmail/dynmail'
export { DynmailError } from './dynmail/dynmail.error'
export type { Plunk, PlunkParams } from './provider/plunk/plunk'
export { plunk } from './provider/plunk/plunk'
export {
	MissingApiKeyConfigError as PlunkMissingApiKeyConfigError,
	PlunkError
} from './provider/plunk/plunk.error'
export type { ProviderOptions, SendMailParams } from './provider/provider'
export { Provider } from './provider/provider'
export { ProviderNotFoundError } from './provider/provider.error'
export type { Resend, ResendParams } from './provider/resend/resend'
export { resend } from './provider/resend/resend'
export {
	MissingApiKeyConfigError as ResendMissingApiKeyConfigError,
	ResendError
} from './provider/resend/resend.error'
export type { Ses, SesParams } from './provider/ses/ses'
export { ses } from './provider/ses/ses'
export {
	MissingCredentialsConfigError as SesMissingCredentialsConfigError,
	SesError
} from './provider/ses/ses.error'
export { Sender, sender } from './sender/sender'
export { SenderNotFoundError } from './sender/sender.error'
