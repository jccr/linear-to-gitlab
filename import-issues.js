import 'dotenv/config'
import { LinearClient } from '@linear/sdk'
import { Gitlab } from '@gitbeaker/node'
import { compareTwoStrings } from 'string-similarity'

const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_TOKEN,
})

const gitlab = new Gitlab({
  token: process.env.GITLAB_TOKEN,
})

const projectKey = process.env.LINEAR_PROJECT_KEY
const projectId = process.env.GITLAB_PROJECT_ID

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const gitlabProjectMembers = await gitlab.ProjectMembers.all(projectId, {
    includeInherited: true,
  })

  const teams = await linearClient.teams({
    filter: {
      key: { eq: projectKey },
    },
  })
  const team = teams.nodes[0]
  if (!team) {
    throw new Error('Team with key not found')
  }

  const issues = await team.issues()

  const output = {}
  while (issues.pageInfo.hasNextPage) {
    await issues.fetchNext()
  }

  for (const issue of issues.nodes) {
    const linearUser = await issue.assignee
    if (linearUser) {
      const gitlabUser = gitlabProjectMembers.find(
        (user) => compareTwoStrings(linearUser.name, user.name) > 0.5
      )
      do {
        await delay(500)
        try {
          const params = {
            title: issue.title,
            description: `\
${issue.description || ''}

##### Linear Import
Issue: [${issue.identifier}](${issue.url})  
Assignee: [${linearUser.name}](${linearUser.url})
`,
            created_at: issue.createdAt.toISOString(),
            assignee_id: gitlabUser?.id,
            labels: `status::${(await issue.state).name}`,
          }
          const gitlabIssue = await gitlab.Issues.create(projectId, params)

          output[issue.id] = gitlabIssue.iid
        } catch (error) {
          console.error(issue.identifier, error)
          await delay(3000)
          continue // go again
        }
        break
      } while (true)
    }
  }

  console.log(JSON.stringify(output))
}

await main()
