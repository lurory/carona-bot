import express, { Request, Response } from 'express'
import { AddressInfo } from 'net'
import bodyParser from 'body-parser'
import packageInfo from './package.json'

const port = process.env.PORT || '80'
const app = express()

app.use(bodyParser.json())

app.get('/', function (_: Request, res: Response) {
  res.json({ version: packageInfo.version })
})

let server = app.listen(parseInt(port), '0.0.0.0', () => {
  let serverInfo = server.address()
  if (isAddressInfo(serverInfo)) {
    console.log('Web server started at http://%s:%s', serverInfo.address, serverInfo.port)
  }
})

function isAddressInfo(info: string | AddressInfo | null): info is AddressInfo {
  return (info as AddressInfo).address !== undefined
}

export default (bot: any) => {
  app.post('/' + bot.token, (req: Request, res: Response) => {
    bot.processUpdate(req.body)
    res.sendStatus(200)
  })
}
