const {InfluxDB, Point} = require('@influxdata/influxdb-client')


const url = "http://localhost:8086"
const token  = "s2rC7nAXmsmrpst_S4JnudkS06hSjqNzBaTgRFdxtGHwxMZv1-Jmt5hCSUf6UW1-kv1OHUofVfxTo9svqYKv-w=="

const client = new InfluxDB({ url, token })

let org = `GMETARAVE`
let bucket = `CHAT`

// let writeClient = client.getWriteApi(org, bucket, 'ns')

let queryClient = client.getQueryApi(org)
let fluxQuery = `from(bucket: "CHAT")
 |> range(start: -10m)
 |> filter(fn: (r) => r._measurement == "measurement1")`

queryClient.queryRows(fluxQuery, {
  next: (row: any, tableMeta: any) => {
    const tableObject = tableMeta.toObject(row)
    console.log(tableObject)
  },
  error: (error: any) => {
    console.error('\nError', error)
  },
  complete: () => {
    console.log('\nSuccess')
  },
})


