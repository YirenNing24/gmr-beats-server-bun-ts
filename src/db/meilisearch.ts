import { MeiliSearch } from "meilisearch";

//@ts-ignore
const meili: MeiliSearch = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: '',
  })


export default meili