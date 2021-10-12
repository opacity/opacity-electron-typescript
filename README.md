## Environment Setup

- Install node modules on the root folder

```bash
yarn
```

- Install node modules on `ts-client-library` & `opaque`

```bash
cd ts-client-library
npx lerna bootstrap
cd ../opaque
npm i
cd ..
```

## Starting Development

Start the app in the `dev` environment:

```bash
yarn start
```

## Packaging for Production

To package apps for the local platform:

```bash
yarn package
```
