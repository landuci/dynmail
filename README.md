<h3 align="center">
  dynmail
</h3>

<p align="center">
  A modern and dynamic Email SDK written in TypeScript
  <br />
  <a href="https://dynmail.landuci.com"><strong>Learn more »</strong></a>
  <br />
  <br />
  <a href="#installation"><strong>Installation</strong></a> ·
  <a href="#usage"><strong>Usage</strong></a> ·
  <a href="#contribution"><strong>Contribution</strong></a> ·
</p>

<br />

## Installation

```bash
npm install dynmail # bun, pnpm, yarn
```

## Usage

```typescript
import { dymail, resend, sender } from 'dynmail'

const mail = dymail({
  providers: [resend()],
  senders: [
    sender({
      name: 'Support',
      from: 'support@myapp.com'
    })
  ]
})

await mail.send({
  to: 'johndoe@email.com',
  subject: 'Welcome to MyApp',
  body: '<h1>Welcome to MyApp</h1>'
})
```

To learn more about the usage, check out the [documentation](https://dynmail.landuci.com).

## Contribution

Contributions are welcome! Specifically, you can help with:

- Adding new providers
- Improving the documentation
- Fixing bugs (or opening issues)

## License

This project is licensed under the MIT License.