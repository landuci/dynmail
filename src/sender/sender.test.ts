import { attest } from '@ark/attest'
import { it } from 'vitest'
import { Sender, sender } from './sender'

it('creates a default sender when no id is provided', () => {
	const support = sender({
		email: 'support@example.com'
	})

	attest<Sender<'default'>>(support)
	attest(support.id).snap('default')
	attest(support.email).snap('support@example.com')
	attest(support.name).snap(undefined)
})

it('creates a sender with a custom id', () => {
	const support = sender({
		id: 'support',
		email: 'support@example.com'
	})

	attest<Sender<'support'>>(support)
	attest(support.id).snap('support')
})

it('creates a sender with name and email', () => {
	const support = sender({
		id: 'support',
		name: 'Support Team',
		email: 'support@example.com'
	})

	attest(support.name).snap('Support Team')
	attest(support.email).snap('support@example.com')
})

it('formats sender as email only when no name is provided', () => {
	const support = sender({
		email: 'support@example.com'
	})

	attest(support.toString()).snap('support@example.com')
})

it('formats sender with name and email when both are provided', () => {
	const support = sender({
		name: 'Support Team',
		email: 'support@example.com'
	})

	attest(support.toString()).snap('"Support Team" <support@example.com>')
})

it('can instantiate Sender class directly', () => {
	const support = new Sender({
		id: 'direct',
		name: 'Direct',
		email: 'direct@example.com'
	})

	attest<Sender<'direct'>>(support)
	attest(support.id).snap('direct')
})

it('infers correct types for sender properties', () => {
	const support = sender({
		id: 'typed',
		email: 'typed@example.com'
	})

	attest(support.id).type.toString.snap('"typed"')
	attest(support.email).type.toString.snap('string')
	attest(support.name).type.toString.snap('string | undefined')
})
