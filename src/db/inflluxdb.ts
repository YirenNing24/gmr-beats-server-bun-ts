import { InfluxDB, Point, QueryApi, WriteApi } from "@influxdata/influxdb-client";
import { INFLUXDB_BUCKET, INFLUXDB_ORG } from "../config/constants";


const token: string | undefined = process.env.INFLUXDB_TOKEN
const url: string = 'http://localhost:8086'

const client: InfluxDB = new InfluxDB({url, token})
export const writeClient: WriteApi = client.getWriteApi(INFLUXDB_ORG, INFLUXDB_BUCKET, 'ns')
export const queryClient: QueryApi = client.getQueryApi(INFLUXDB_ORG)

