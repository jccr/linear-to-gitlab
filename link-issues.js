import 'dotenv/config'
import { LinearClient } from '@linear/sdk'
import { Gitlab } from '@gitbeaker/node'

const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_TOKEN,
})

const gitlab = new Gitlab({
  token: process.env.GITLAB_TOKEN,
})

const projectId = process.env.GITLAB_PROJECT_ID

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const getInput = () =>
    new Promise((resolve) => {
      var stdin = process.openStdin()

      var data = ''

      stdin.on('data', function (chunk) {
        data += chunk
      })

      stdin.on('end', function () {
        resolve(JSON.parse(data))
      })
    })

  const input = await getInput()

  for (const issueID of Object.keys(input)) {
    do {
      await delay(500)
      try {
        const issue = await linearClient.issue(issueID)
        const issueRelations = await issue.relations()

        while (issueRelations.pageInfo.hasNextPage) {
          await issueRelations.fetchNext()
        }

        for (const relation of issueRelations.nodes) {
          console.error('iterate', relation.id)
          do {
            await delay(500)
            try {
              const relatedIssue = await relation.relatedIssue
              const glIssueIid = input[issue.id]
              const glRelatedIssueIid = input[relatedIssue.id]
              if ((glIssueIid, glRelatedIssueIid)) {
                await gitlab.Issues.link(
                  projectId,
                  glIssueIid,
                  projectId,
                  glRelatedIssueIid,
                  {
                    link_type:
                      relation.type === 'blocks' ? 'blocks' : undefined,
                  }
                )
              }
            } catch (error) {
              if (
                error.description === 'Issue(s) already assigned' ||
                error.description.includes('cannot be related to itself')
              ) {
                console.error('relation', issue.identifier, error.description)
                break
              } else {
                console.error('relation', issue.identifier, error)
                await delay(3000)
                continue // go again
              }
            }
            break
          } while (true)
        }
      } catch (error) {
        console.error('issue', issueID, error)
        await delay(3000)
        continue // go again
      }
      break
    } while (true)
  }
}

await main()
