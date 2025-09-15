import pg from 'pg'

export const getDb = () => {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Missing DATABASE_URL')
  const client = new pg.Client({ connectionString: url })
  return client
}

export const checkTable = async (client: pg.Client, table: string) => {
  await client.query(`SELECT 1 FROM ${table} LIMIT 1`)
}
