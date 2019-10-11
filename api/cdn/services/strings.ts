import { IDataSource, Stored } from 'db-types'

const STRING_COLLECTION = 'strings'

type StringType = {
  value: string
  changes: number
}

export default {
  async generateString(db: IDataSource, options: any) {
    const id = options.params.id
    const length = +options.params.length

    const {
      data: { changes },
    } = (await db.read<StringType>(STRING_COLLECTION, id)) as Stored<StringType>

    let i = 0
    let str = ''
    while (i++ < length) {
      const code = Math.floor(Math.random() * 26) + 97
      str += String.fromCharCode(code)
    }

    return db.update(STRING_COLLECTION, id, {
      value: str,
      changes: changes + 1,
    })
  },
}
