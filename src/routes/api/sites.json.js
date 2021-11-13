import * as supabaseDB from '../../supabase/db'
import * as supabaseStorage from '../../supabase/storage'
import { authorizeRequest } from './_utils'

export async function get({ headers }) {
  return await authorizeRequest(headers, async () => {
    let finalSites = []
    const sites = await supabaseDB.sites.get({query: `id, name, password`})
    await Promise.all(
      sites.map(async site => {
        const data = await supabaseStorage.downloadSiteData(site.id)
        finalSites = [
          ...finalSites,
          {
            ...site,
            data
          }
        ]
      })
    )
    return {
      body: {
        sites: finalSites
      }
    };
  })
}