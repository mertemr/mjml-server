# mjml-http-server

A self-hosted alternative to the mjml API. Built with express.

The API is compatible with https://mjml.io/api in that it exposes only a single endpoint: `/v1/render`.  
Unlike the official API, authentication is optional and can be configured via parameters. It is recommended to run this server within your private network.

**Jump to:**

- [Configuration](#configuration)
- [Usage](#usage)
  - [Docker](#docker)
  - [Docker Compose](#docker-compose)
  - [Development](#development)
- [Contributing](#contributing)
- [License](#license)

#### Why?

You're writing an app in another language than Javascript and need to interop
with MJML. Instead of embedding NodeJS in your Python image you can call MJML
compilation over HTTP.

You can alternatively use the [MJML API](https://mjml.io/api), but it's
currently invite only and has privacy implications (do you want your emails to
be sent to yet another third party?).

For an elaborate discussion see: https://github.com/mjmlio/mjml/issues/340

#### Configuration

These options can be set globally via CLI or per-request via JSON:
| Option (POST) | CLI Flag | ENV Var | Default | Description |
| ----------------- | -------------------------- | --------------------------- | ------- | ----------------------------------------------- |
| `keepComments` | `--keep-comments` | `MJML_KEEP_COMMENTS` | true | Keep MJML comments in the HTML output |
| `beautify` | `--beautify` | `MJML_BEAUTIFY` | false | Pretty print the output HTML |
| `minify` | `--minify` | `MJML_MINIFY` | false | Minify the resulting HTML |
| `validationLevel` | `--validation-level` | `MJML_VALIDATION_LEVEL` | soft | MJML validation: `strict`, `soft`, or `skip` |
| | `--host` | `MJML_HOST` | 0.0.0.0 | Host to bind the server |
| | `--port` | `MJML_PORT` | 15500 | Port to run the server on |
| | `--max-body` | `MJML_MAX_BODY` | 1mb | Maximum HTTP request body size |
| | `--use-compression` | `MJML_USE_COMPRESSION` | true | Gzip compress HTTP responses |
| | `--auth-user` | `MJML_AUTH_USER` | | HTTP Basic Auth username (requires `auth-pass`) |
| | `--auth-pass` | `MJML_AUTH_PASS` | | HTTP Basic Auth password (requires `auth-user`) |
| | `--enable-rate-limit` | `MJML_ENABLE_RATE_LIMIT` | false | Enable rate limiting |
| | `--rate-limit-max` | `MJML_RATE_LIMIT_MAX` | 100 | Max requests per window |
| | `--rate-limit-window` | `MJML_RATE_LIMIT_WINDOW` | 15 | Rate limit window in minutes |

## Usage

### Docker

To run the MJML server using Docker, you can use the following command:

```bash
docker run -p 15500:15500 mactorient/mjml-server:latest
```

You can then use the following command to render MJML to HTML:

```bash
$ curl -i -X POST http://localhost:15500/v1/render \
    -H "Content-Type: application/json" \
    -d '{"mjml": "<mjml><mj-body><mj-section><mj-column><mj-text>Hello world</mj-text></mj-column></mj-section></mj-body></mjml>"}'

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 4272
ETag: ...
Vary: Accept-Encoding
Date: Tue, 17 Jun 2025 18:55:22 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{
    "html": "<!doctype html>\n<html ...</html>",
    "mjml": "<mjml>...</mjml>",
    "mjml_version": "^4.15.3",
    "errors": [],
}
```

#### Using Template Variables

You can use template variables (mustache syntax) in your MJML:

```bash
$ curl -X POST http://localhost:15500/v1/render \
    -H "Content-Type: application/json" \
    -d '{
      "mjml": "<mjml><mj-body><mj-section><mj-column><mj-text>Hello {{name}}, your order #{{orderId}} is confirmed!</mj-text></mj-column></mj-section></mj-body></mjml>",
      "variables": {
        "name": "John Doe",
        "orderId": "12345"
      }
    }'
```

The `variables` field (or `data` field) supports any JSON object with key-value pairs.

#### Batch Rendering

Render multiple MJML templates in a single request:

```bash
$ curl -X POST http://localhost:15500/v1/render/batch \
    -H "Content-Type: application/json" \
    -d '{
      "requests": [
        {
          "mjml": "<mjml><mj-body><mj-section><mj-column><mj-text>Email for {{name}}</mj-text></mj-column></mj-section></mj-body></mjml>",
          "variables": {"name": "Alice"}
        },
        {
          "mjml": "<mjml><mj-body><mj-section><mj-column><mj-text>Email for {{name}}</mj-text></mj-column></mj-section></mj-body></mjml>",
          "variables": {"name": "Bob"}
        }
      ]
    }'
```

Maximum batch size: 50 requests per batch.

#### Template Validation

Validate MJML without rendering:

```bash
$ curl -X POST http://localhost:15500/v1/validate \
    -H "Content-Type: application/json" \
    -d '{"mjml": "<mjml><mj-body><mj-section><mj-column><mj-text>Test</mj-text></mj-column></mj-section></mj-body></mjml>"}'

{
  "valid": true,
  "errors": []
}
```

You can run the server using Docker with the following command:

```bash
docker run -d -p 15500:15500 mactorient/mjml-server:latest
```

### Docker Compose

For docker compose, you can use the following `docker-compose.yml`:

```yaml
services:
  mjml-server:
    image: mactorient/mjml-server:latest
    expose:
      - '15500'
    environment:
      MJML_MINIFY: 'true'
      MJML_KEEP_COMMENTS: 'false'
      MJML_AUTH_USER: 'mjml'
      MJML_AUTH_PASS: 'password'
      MJML_VALIDATION_LEVEL: 'strict'
```

### Development

To run the MJML server in development mode, you can clone the repository and run it using Bun:

```bash
$ git clone https://github.com/mertemr/mjml-server.git
```

```bash
$ cd mjml-server
```

```bash
$ bun install
```

```bash
$ bun start -h

Usage: index.js [options]

Server Options
      --host             Server host [env: MJML_HOST]  [string] [default: "0.0.0.0"]
      --port             Server port [env: MJML_PORT]  [number] [default: 15500]
      --use-compression  Use compression for responses [env: MJML_USE_COMPRESSION]  [boolean] [default: true]

Output Options
      --keep-comments     Keep comments in the HTML output [env: MJML_KEEP_COMMENTS]  [boolean] [default: true]
      --beautify          Beautify the HTML output [env: MJML_BEAUTIFY]  [boolean] [default: false]
      --minify            Minify the HTML output [env: MJML_MINIFY]  [boolean] [default: false]
      --validation-level  Available values for the validator [env: MJML_VALIDATION_LEVEL]  [string] [choices: "strict", "soft", "skip"] [default: "soft"]
      --max-body          Max size of the http body [env: MJML_MAX_BODY]  [string] [default: "1mb"]

Authentication Options
      --auth-user  Username for HTTP Basic Authentication [env: MJML_AUTH_USER]  [string]
      --auth-pass  Password for HTTP Basic Authentication [env: MJML_AUTH_PASS]  [string]

Options:
  -h, --help     Show help  [boolean]
  -v, --version  Show version number  [boolean]

Examples:
  index.js --port 3000                         Start the server on port 3000.
  index.js --minify --no-keep-comments         Minify the output and do not keep comments.
  index.js --auth-user admin --auth-pass 1234  Use HTTP basic auth.

For more information, visit https://github.com/mertemr/mjml-server
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests for any improvements or features you would like to see.

### Fork Overview

This project originates from `eatclub/mjml-server`, which itself is a fork of the original `mertemr/mjml-server` by Dani Hodovic.

This fork has been significantly modernized and improved to better suit our needs, including:

- A modernized Docker build with significantly reduced CVE exposure

- Security-first defaults in HTTP and container configuration

- Improved logging, monitoring, and error handling

- Enhanced configuration management for scalability and maintainability

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details
