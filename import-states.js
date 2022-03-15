import 'dotenv/config'
import { LinearClient } from '@linear/sdk'
import { Gitlab } from '@gitbeaker/node'

const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_TOKEN,
})

const gitlab = new Gitlab({
  token: process.env.GITLAB_TOKEN,
})

const projectKey = process.env.LINEAR_PROJECT_KEY
const projectId = process.env.GITLAB_PROJECT_ID

async function main() {
  const teams = await linearClient.teams({
    filter: {
      key: { eq: projectKey },
    },
  })
  const team = teams.nodes[0]
  if (!team) {
    throw new Error('Team with key not found')
  }

  const states = await team.states()

  const output = {}
  while (states.pageInfo.hasNextPage) {
    await states.fetchNext()
  }

  for (const state of states.nodes) {
    const created = await gitlab.Labels.create(
      projectId,
      `status::${state.name}`,
      state.color
    )
    output[state.id] = created.id
  }

  console.log(JSON.stringify(output))
}

await main()
