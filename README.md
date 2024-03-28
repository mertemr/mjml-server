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

### Testing
When testing, you can use the commit id, timestamp or branch to test. If you want to use branch
name during testing to avoid having to constantly update the mjml tag the latest version, use the generated branch name in the 
action log. The latest image is always tagged with the branch name. The branch name is normalized, so it doesn't break any of docker's rules for image tags, 
i.e. uppercase letters are not allowed. Pay attention to the generated values used for the tag.

For testing, Consider using an admin function or a view that sends an email synchronously.  i.e

```python
            try:
                send_html_mail(
                    subject=subject, # parameterize so you can pass it in as a query, helpful when searching inbox
                    to_address="test@eatclub.com",
                    from_address="EAT Club Forecasting <forecasting@eatclub.com>",
                    html_template="meetings/emails/group_order_cancelled_timeout.mjml",
                    context={},
                    headers={"X-SMTPAPI": '{"category": ["test"]}'},
                    use_celery_override=email_use_celery, # set to False to send sychronousely,  parameterize so you can toggle for testing
                )
            except Exception as e:
                from django.conf import settings

                messages.error(
                    request,
                    f"MJML Host Address: {settings.MJML_HOST} "
                    f"Email Failed to send {user.email} email. Error: {str(e)}",
                )
            else:
                messages.success(request, f"Successfully sent {user.email} an email.")
```
#### Sandbox

To test the mjml server in a sandbox, use the  `mjmlTag` field for the tag in `sandbox_create` jenkins job. 
Set `buildScriptsWebBranch` and `webRef` to your branch. 
Pro-tip: use your branch name or anything other than "mjml" or a variation of for your sandbox name. When debugging the console output
it may get confusing since "mjml" is logged a lot, jenkins also uses the sandbox name to create a file. Jenkins' error messages are not always intuitive. You've been warned! 

#### Blue Green Environments (Staging, Demo, Test)
Use the `blue_green_create` jenkins job.
For blue-green environment testing, set `buildScriptsWebBranch` and `webRef` to your branch. You must update the mjmlTag default value in eunomia  `modules/main/variables.tf` AND hardcode 
your branch to the eunomia reference in web since there isn't a way to point to a specified eunomia branch. For example if you want to 
test in the staging environment you must update staging blue and green terraform files i.e. <br>
`build/terraform/environments/eatclubstaging/green/green.tf`,<br>
`build/terraform/environments/eatclubstaging/blue/blue.tf`<br>
from `"git@github.com:eatclub/eunomia.git//modules/main?ref=v9.0.0"` to `"git@github.com:eatclub/eunomia.git//modules/main?ref=<your-branch>"`

### Places to update after release
#### Direct Backend:

1. `.aws/task_definitions/directprod/mjml.json`
2. `.aws/task_definitions/directuat/mjml.json`
3. `.github/workflows/deploy.yml`
4. `docker-compose.yml`

#### Core Web:
1. `build/scripts/jenkins/sandbox_create/Jenkinsfile`
2. `build/scripts/jenkins/web_stable/Jenkinsfile`
3. `docker-compose.yml`
4. `build/docker/web_unittest/docker-compose.yml`
5. Update all `mjml_tag` values in blue-green terraform files. There should be 8 total references in, one ref in 8 different files (a blue and green file for each of prod, testing, staging and demo.)

In total there should be 13 references updated including mjmlTag description, 12 files total. 
