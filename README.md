# Well Ping Study File Editor

An editor for study files used by [Well Ping](https://github.com/wellping/wellping).

## Development

```bash
# Installation
yarn install

# Start
yarn start
```

### `@wellping/study-schemas`

After updating https://github.com/wellping/study-schemas, run
```bash
yarn up @wellping/study-schemas@https://github.com/wellping/study-schemas
```
to use the newest `@wellping/study-schemas` on the main branch of https://github.com/wellping/study-schemas.

## Deployment

Done in `.github/workflows/deploy-gh-pages.yml` on push.
