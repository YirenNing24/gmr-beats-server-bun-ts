export const apps = [
  {
    name: "my-bun-app",
    script: "src/index.ts",
    interpreter: "~/.bun/bin/bun",
    env: {
      NODE_TLS_REJECT_UNAUTHORIZED: 0
    },
    watch: true
  }
];
  