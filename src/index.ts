import { GitHub } from "@actions/github/lib/github";
import { debug, error, getInput, info } from "@actions/core";
import * as github from "@actions/github";

// To enable core.debug output in action logs,
// create GitHub Secret: ACTIONS_STEP_DEBUG = true

const githubContext = github.context;
const githubToken = getInput("github-token");
const githubClient = new GitHub(githubToken);
const pr = githubContext.issue;
const REVIEW_EVENT_APPROVE = "APPROVE";
const REVIEW_EVENT_REQUEST_CHANGES = "REQUEST_CHANGES";

async function createReview(body: string, event: any) {
  debug(`Creating review event: (${event}) with body: ${body}`);
  await githubClient.pulls.createReview({
    owner: pr.owner,
    repo: pr.repo,
    pull_number: pr.number,
    body: body,
    event: event,
  });
}

async function dismissReviews(message: string) {
  debug(`Getting all reviews in the Pull Request`);
  const reviews = await githubClient.pulls.listReviews({
    owner: pr.owner,
    repo: pr.repo,
    pull_number: pr.number,
  });

  reviews.data.forEach((review) => {
    debug(
      `Pull Request review ID: (${review.id}) User login: ${review.user.login}`
    );
    if (review.user.login == "github-actions[bot]") {
      debug(`Pull Request review ID: (${review.id}) Status: ${review.state}`);
      if (review.state == "CHANGES_REQUESTED") {
        info(
          `Dismissing 'changes requested' Pull Request review ID: (${review.id})`
        );
        githubClient.pulls.dismissReview({
          owner: pr.owner,
          repo: pr.repo,
          pull_number: pr.number,
          review_id: review.id,
          message: message,
        });
      } else if (review.state == "PENDING") {
        info(`Deleting 'pending' Pull Request review ID: (${review.id})`);
        githubClient.pulls.deletePendingReview({
          owner: pr.owner,
          repo: pr.repo,
          pull_number: pr.number,
          review_id: review.id,
        });
      }
    }
  });
}

async function run(): Promise<void> {
  let review_comment;
  const body: string = githubContext.payload.pull_request?.body ?? "";
  debug(`Pull Request body: ${body}`);
  const title: string = githubContext.payload.pull_request?.title ?? "";
  debug(`Pull Request title: ${title}`);
  const ifTitleHasRegex: RegExp = new RegExp(
    getInput("lint-body-if-pr-title-has-regex")
  );
  debug(`If Pull Request title has regex: ${ifTitleHasRegex}`);
  const bodyRegex: RegExp = new RegExp(getInput("pr-body-regex"));
  debug(`Pull Request body regex: ${bodyRegex}`);
  const titleRegex: RegExp = new RegExp(getInput("pr-title-regex"));
  debug(`Pull Request title regex: ${titleRegex}`);
  const bodyRegexFailedComment = getInput(
    "pr-body-regex-failed-comment"
  ).replace("%regex%", bodyRegex.source);
  debug(`Pull Request body regex failed comment: ${bodyRegexFailedComment}`);
  const bodyRegexPassedComment = getInput(
    "pr-body-regex-passed-comment"
  ).replace("%regex%", bodyRegex.source);
  debug(`Pull Request body regex passed comment: ${bodyRegexPassedComment}`);
  const titleRegexFailedComment = getInput(
    "pr-title-regex-failed-comment"
  ).replace("%regex%", titleRegex.source);
  debug(`Pull Request title regex failed comment: ${titleRegexFailedComment}`);
  const titleRegexPassedComment = getInput(
    "pr-title-regex-passed-comment"
  ).replace("%regex%", titleRegex.source);
  debug(`Pull Request title regex passed comment: ${titleRegexPassedComment}`);
  const pullRequestPassedComment = "👍 Pull Request looks good to me! 💯";

  const titleHasRegexMatches: boolean = ifTitleHasRegex.test(title);
  const bodyMatchesRegex: boolean = bodyRegex.test(body);
  const titleMatchesRegex: boolean = titleRegex.test(title);

  if (titleHasRegexMatches && !bodyMatchesRegex && !titleMatchesRegex) {
    debug(`Using 'core.error' to report errors`);
    error(
      `The Pull Request title contains the regex: ${ifTitleHasRegex}, and the body does NOT match the regex: ${bodyRegex}`
    );
    error(`The Pull Request title does NOT match the regex: ${titleRegex}`);
    info(`Requesting changes to the Pull Request with the failed comments`);
    review_comment = `The PR title matches the regex: %re%,\nand ${bodyRegexFailedComment}\n\nAlso, ${titleRegexFailedComment}`.replace(
      "%re%",
      ifTitleHasRegex.source
    );
    createReview(review_comment, REVIEW_EVENT_REQUEST_CHANGES);
  } else if (titleHasRegexMatches && !bodyMatchesRegex) {
    debug(`Using 'core.error' to report errors`);
    error(
      `The Pull Request title contains the regex: ${ifTitleHasRegex}, and the body does NOT match the regex: ${bodyRegex}`
    );
    info(`Requesting changes to the Pull Request with the failed comment`);
    review_comment = `The PR title matches the regex: %re%,\nand ${bodyRegexFailedComment}`.replace(
      "%re%",
      ifTitleHasRegex.source
    );
    createReview(review_comment, REVIEW_EVENT_REQUEST_CHANGES);
  } else if (!titleMatchesRegex) {
    debug(`Using 'core.error' to report errors`);
    error(`Pull Request title does NOT match the regex: ${titleRegex}`);
    info(`Requesting changes to the Pull Request with the failed comment`);
    review_comment = titleRegexFailedComment;
    createReview(review_comment, REVIEW_EVENT_REQUEST_CHANGES);
  } else if (titleHasRegexMatches && bodyMatchesRegex && titleMatchesRegex) {
    debug(`Using 'core.info' to give info`);
    info(
      `The Pull Request title contains the regex: ${ifTitleHasRegex},\nand the body DOES match the regex: ${bodyRegex}.\nAlso, the Pull Request title DOES match the regex: ${titleRegex}`
    );
    dismissReviews(pullRequestPassedComment);
    info(`Approving the Pull Request`);
    review_comment = `${titleRegexPassedComment}\n\n${bodyRegexPassedComment}`;
    createReview(review_comment, REVIEW_EVENT_APPROVE);
  } else {
    debug(`Using 'core.info' to give info`);
    info(`Pull Request title DOES match the regex: ${titleRegex}`);
    dismissReviews(pullRequestPassedComment);
    info(`Approving the Pull Request`);
    review_comment = titleRegexPassedComment;
    createReview(review_comment, REVIEW_EVENT_APPROVE);
  }
}

run().catch((error) => {
  debug(`Error Caught - Action failed with error: ${error}`);
});
