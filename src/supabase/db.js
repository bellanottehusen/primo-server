import supabase from './core'

export async function acceptInvitation(pass, userID) {
  const {data,error} = await supabase
    .from('sites')
    .select('password, id, collaborators, owner (username, id, websites)')
    .or(`password.eq.CONTENT-${pass},password.eq.DEV-${pass}`)
  const site = data[0]
  if (!site || error) { // password incorrect
    console.error(error)
    return {error}
  }

  const collaborators = site.collaborators || []
  const {websites} = await users.get(userID, `websites`)

  const role = site.password.includes('DEV') ? 'DEV' : 'CONTENT'
  const date = (new Date()).toJSON()

  // link is valid, add collaborator to site (user id, role)
  const [ collaboratorAdded ] = await Promise.all([
    sites.update(site.id, { 
      collaborators: JSON.stringify([ ...collaborators, {
        id: userID,
        role: 'DEV',
        created: date,
        loggedin: date
      }]),
      password: '' 
    }),
    users.update(userID, {
      websites: [ ...websites, site.id ] // concat 
    })
  ])
  
  return collaboratorAdded
}

export async function checkUsernameAvailability(username) {
  const {data,error} = await supabase
    .from('users')
    .select('id')
    .filter('username', 'eq', username)
  return data[0] ? false : true
}

const DEFAULT_SITES_QUERY = `
  id,
  name,
  password,
`

export const sites = {
  get: async ({id = null, path = null, query = DEFAULT_SITES_QUERY }) => {
    let site
    if (id) {
      const {data,error} = await supabase
        .from('sites')
        .select(query)
        .filter('id', 'eq', id)
      if (error) {
        console.error(error)
        return null
      } else {
        const site = data[0]
        if (site) {
          let { data, collaborators } = site
          if (data && typeof data === 'string') {
            site.data = JSON.parse(data)
          }
        }
        return site
      }
    } else if (path) {
      const [ user, siteUrl ] = path.split('/')
      const {data,error} = await supabase
        .from('sites')
        .select(query)
        .filter('owner.username', 'eq', user)
        .filter('url', 'eq', siteUrl)
      if (error) {
        console.error(error)
        site = null
      } else {
        site = data[0]
      }
    } else {
      const {data,error} = await supabase
        .from('sites')
        .select(query)
      site = data
    }
    if (site && typeof site.data === 'string') {
      site.data = JSON.parse(site.data)
    }
    return site
  },
  create: async ({ id, name }) => {
    const { data, error } = await supabase
      .from('sites')
      .insert([
        { id, name }
      ])
    if (error) {
      console.error(error)
      return null
    }
    return data[0]
  },
  delete: async (id) => {
    const { data, error } = await supabase
      .from('sites')
      .delete()
      .match({ id })
    if (error) {
      console.error(error)
      return null
    }
    return data
  },
  save: async (id, site) => {
    const json = JSON.stringify(site)
    const { data, error } = await supabase
      .from('sites')
      .update({ data:json }, {
        returning: 'minimal'
      })
      .filter('id', 'eq', id)
    if (error) {
      console.error(error)
      return false
    }
    return true
  },
  update: async (id, props) => {
    const { error } = await supabase
      .from('sites')
      .update(props, {
        returning: 'minimal'
      })
      .filter('id', 'eq', id)
    if (error) {
      console.error(error)
      return null
    }
    return true
  },
  subscribe: async (id, fn) => {
    const mySubscription = supabase
      // .from('countries:id=eq.200')
      .from(`websites:id=eq.${id}`)
      .on('UPDATE', fn)
      .subscribe()
  }
}

export const users = {
  get: async (uid, select = '*') => {
    let {data,error} = await supabase
      .from('users')
      .select(select)
      .eq('id', uid)

    if (error) {
      console.error(error)
      return null
    }
    data = data[0]
    // if (data.websites) {
    //   data.websites = data.websites.map(site => ({
    //     ...site,
    //     collaborators: site.collaborators && site.collaborators.length > 0 ? JSON.parse(site.collaborators) : []
    //   }))
    // }
    return data
  },
  create: async ({ email }) => {
    const { data, error } = await supabase
      .from('users')
      .insert([ { email } ], {
        returning: 'minimal'
      })
    if (error) {
      console.error(error)
      return false
    }
    return true
  },
  update: async (id, props) => {
    const { data, error } = await supabase
      .from('users')
      .update(props)
      .eq('id', id)

    if (error) {
      console.error(error)
      return null
    }
    return data[0]
  }
}

export const hosts = {
  get: async (id) => {
    const {data,error} = await supabase
      .from('hosts')
      .select('*')
    if (error) {
      console.error(error)
      return null
    }
    return data
  },
  create: async ({ name, token }) => {
    const { data, error } = await supabase
      .from('hosts')
      .insert([
        { name, token }
      ])
    if (error) {
      console.error(error)
      return null
    }
    return data[0]
  }
}

export const config = {
  get: async (id) => {
    const {data,error} = await supabase
      .from('config')
      .select('*')
      .eq('id', id)
    if (error) {
      console.error(error)
      return null
    }
    return data[0]['value']
  },
  update: async (id, value) => {
    const { data, error } = await supabase
      .from('config')
      .update({ value })
      .eq('id', id)
    if (error) {
      console.error(error)
      return null
    }
    return data[0] ? true : false
  }
}