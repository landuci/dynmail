# Agent Guidelines for Dynmail

You are an expert TypeScript developer for Dynmail, a modern and dynamic Email 
SDK written in TypeScript.

## Commands

```bash
bun run test # Run the test suite
```

## Project Knowledge

**Tech Stack**:
- **Runtime**: Anywhere - the tests run on Node
- **Package Manager**: Bun
- **Language**: TypeScript
- **Testing Framework**: Vitest with Attest

**Code Style**
- Tabs for indentation
- Single quotes for strings
- No trailing commas
- No semicolons (unless ASI hazard)
- Tests should be in a `*.test.ts` file with only `it` - don't use `describe`
blocks

**Naming Conventions**
- Use camelCase for variables, functions, and files

## Attest

Attest is a testing library that makes your TypeScript types available at 
runtime, giving you access to precise type-level assertions and performance
benchmarks.

It is essential for testing Dynmail's type definitions and ensuring type safety.
DX is our priority!

**Example usage**
```ts
// @ark/attest assertions can be made from any unit test framework with a global setup/teardown
describe("attest features", () => {
	it("type and value assertions", () => {
		const Even = type("number%2")
		// asserts even.infer is exactly number
		attest<number>(even.infer)
		// make assertions about types and values seamlessly
		attest(even.infer).type.toString.snap("number")
		// including object literals- no more long inline strings!
		attest(even.json).snap({
			intersection: [{ domain: "number" }, { divisor: 2 }]
		})
	})

	it("error assertions", () => {
		// Check type errors, runtime errors, or both at the same time!
		// @ts-expect-error
		attest(() => type("number%0")).throwsAndHasTypeError(
			"% operator must be followed by a non-zero integer literal (was 0)"
		)
		// @ts-expect-error
		attest(() => type({ "[object]": "string" })).type.errors(
			"Indexed key definition 'object' must be a string, number or symbol"
		)
	})

	it("completion snapshotting", () => {
		// snapshot expected completions for any string literal!
		// @ts-expect-error (if your expression would throw, prepend () =>)
		attest(() => type({ a: "a", b: "b" })).completions({
			a: ["any", "alpha", "alphanumeric"],
			b: ["bigint", "boolean"]
		})
		type Legends = { faker?: "🐐"; [others: string]: unknown }
		// works for keys or index access as well (may need prettier-ignore to avoid removing quotes)
		// prettier-ignore
		attest({ "f": "🐐" } as Legends).completions({ "f": ["faker"] })
	})

	it("jsdoc snapshotting", () => {
		// match or snapshot expected jsdoc associated with the value passed to attest
		const T = type({
			/** FOO */
			foo: "string"
		})

		const out = T.assert({ foo: "foo" })

		attest(out.foo).jsdoc.snap("FOO")
	})

	it("integrate runtime logic with type assertions", () => {
		const ArrayOf = type("<t>", "t[]")
		const numericArray = arrayOf("number | bigint")
		// flexibly combine runtime logic with type assertions to customize your
		// tests beyond what is possible from pure static-analysis based type testing tools
		if (getTsVersionUnderTest().startsWith("5")) {
			// this assertion will only occur when testing TypeScript 5+!
			attest<(number | bigint)[]>(numericArray.infer)
		}
	})

	it("integrated type performance benchmarking", () => {
		const User = type({
			kind: "'admin'",
			"powers?": "string[]"
		})
			.or({
				kind: "'superadmin'",
				"superpowers?": "string[]"
			})
			.or({
				kind: "'pleb'"
			})
		attest.instantiations([7574, "instantiations"])
	})
})
```