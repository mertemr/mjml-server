# mjml-http-server

A self-hosted alternative to the mjml API. Built with express.

The API is compatible with https://mjml.io/api in that it only exposes one
endpoint - `/v1/render`, but doesn't require authentication. You should probably
run this within your own private network.

#### Why?

You're writing an app in another language than Javascript and need to interop
with MJML. Instead of embedding NodeJS in your Python image you can call MJML
compilation over HTTP.

You can alternatively use the [MJML API](https://mjml.io/api), but it's
currently invite only and has privacy implications (do you want your emails to
be sent to yet another third party?).

For an elaborate discussion see: https://github.com/mjmlio/mjml/issues/340

#### Local Usage

```
docker run -p 15500:15500 danihodovic/mjml-server
```

```
$ http POST localhost:15500/v1/render
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 2141
Content-Type: application/json; charset=utf-8
Date: Mon, 15 Jul 2019 12:26:48 GMT
ETag: W/"85d-hn49R397DBvYcOi5/4cb+gcoi/I"
X-Powered-By: Express

{
    "html": "\n    <!doctype html>\n    ..."
}
```

#### Configuration

A list of available configuration options can be found in
[./lib/parse_args.js](./lib/parse_args.js).

### Release Versioning
After merging the PR, a new version will be automatically released and pushed to MJML ECR with version bump by default.
By default, the release version is bumped by the `patch` scheme. 

#### How do I change the bump version scheme using Pull Requests?

If we need to override the default bump scheme, we can do this  but adding one of these labels to the PR has the 
label `release:major`, `release:minor`, or `release:patch`, this will override bump_version_scheme.


This repository's pull requests are an example of this in action. For example, [#19](https://github.com/rymndhng/release-on-push-action/pull/19).

### Using custom tags in sandbox Create:
When testing in a sandbox, you can use the commit id, timestamp or branch to test. If you want are wanting to use branch
name during testing to avoid having to retype the new `mjmlTag` in sandbox create, use the generated branch name in the 
action log. The branch name is normalized, so it doesn't break any of docker's rules for image tags, 
i.ie uppercase letters are not allowed. Pay attention to
the generated values used for the tag.

### Places to update after release
#### Direct Backend:

1. `.aws/task_definitions/directprod/mjml.json`
2. `.aws/task_definitions/directuat/mjml.json`
3. `.github/workflows/deploy.yml`
4. `docker-compose.yml`

#### Core Web:
TBD

#### Eunomia:
TBD