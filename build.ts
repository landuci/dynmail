const result = await Bun.build({
	entrypoints: ['./src/index.ts'],
	outdir: './dist',
	target: 'node',
	format: 'esm',
	sourcemap: 'linked',
	minify: false,
	root: './src'
})

if (!result.success) {
	console.error('Build failed:')
	for (const log of result.logs) {
		console.error(log)
	}
	process.exit(1)
}

console.log('Build succeeded!')
for (const output of result.outputs) {
	console.log(`  ${output.path}`)
}

export {}
