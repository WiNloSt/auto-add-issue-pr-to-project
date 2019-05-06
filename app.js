/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.log('App is started')

  app.on('issues.opened', async context => {
    await handleOpen(context, payload => ({
      content_id: payload.issue.id,
      content_type: 'Issue'
    }))

    app.log('done')
  })

  app.on('pull_request.opened', async context => {
    await handleOpen(context, payload => ({
      content_id: payload.pull_request.id,
      content_type: 'PullRequest'
    }))

    app.log('done')
  })

  async function handleOpen(context, payloadGenerator) {
    const { projects: targetProjectConfigs } = await context.config('projects.yml', {
      projects: []
    })

    const promises = [context.github.projects.listForRepo(context.repo())]
    const org = context.payload.organization && context.payload.organization

    if (org) {
      promises.push(context.github.projects.listForOrg({ org: org.login }))
    } else {
      promises.push(Promise.resolve({ data: [] }))
    }

    const [{ data: repoProjects }, { data: orgProjects }] = await Promise.all(promises)
    const allProjects = repoProjects.concat(orgProjects)

    for (let project of allProjects) {
      const projectConfig = targetProjectConfigs.find(
        targetProjectConfig => targetProjectConfig.url === project.html_url
      )

      if (projectConfig) {
        const { data: columns } = await context.github.projects.listColumns({
          project_id: project.id
        })

        const matchedColumn = columns.find(column => column.name === projectConfig.column)
        if (matchedColumn) {
          app.log('adding card to the project')

          await context.github.projects.createCard({
            column_id: matchedColumn.id,
            ...payloadGenerator(context.payload)
          })

          return 'card added'
        }
      }
    }
  }
}
