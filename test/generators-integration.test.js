const execa = require("execa")
const jetpack = require("fs-jetpack")
const tempy = require("tempy")

const IGNITE = "ignite"
const APP = "IntegrationTest"
const BOILERPLATE = `${__dirname}/../`
// calling the ignite cli takes a while
jasmine.DEFAULT_TIMEOUT_INTERVAL = 800000

describe("a generated app", () => {
  // creates a new temp directory
  const appTemp = tempy.directory()
  beforeAll(async () => {
    // make sure we are in the temp directory. Do the initial git commit
    // manually, so we can set up the git user first on circleci.
    process.chdir(appTemp)
    await execa(IGNITE, ["new", APP, "--no-detox", "--skip-git", "--boilerplate", BOILERPLATE])
    process.chdir(APP)
    await execa.shell("git init")
    await execa.shell('git config user.email "test@example.com"')
    await execa.shell("git config user.name test")
    await execa.shell("git add -A")
    await execa.shell('git commit -m "Initial commit"')
  })

  afterAll(() => {
    // clean up generated test app
    jetpack.remove(appTemp)
  })

  test("can yarn install and pass tests", () => {
    return expect(
      execa
        .shell("yarn test 2>&1")
        .then(() => execa.shell("git status --porcelain"))
        .then(({ stdout }) => expect(stdout).toEqual(""))
        .then(() => execa.shell("yarn format && yarn lint --max-warnings 0"))
        .then(() => execa.shell("git status --porcelain")),
    ).resolves.toMatchObject({ stdout: "" }) // will fail & show the yarn or test errors
  })

  test("does have a linting script", () => {
    expect(jetpack.read("package.json", "json")["scripts"]["lint"]).toBe(
      "eslint index.js app --fix --ext .js,.ts,.tsx",
    )
  })

  test("generates a component", async () => {
    const simpleComponent = "Simple"
    await execa(IGNITE, ["g", "component", simpleComponent], { preferLocal: false })
    expect(jetpack.exists(`app/components/${simpleComponent}/${simpleComponent}.tsx`)).toBe("file")
    expect(jetpack.exists(`app/components/${simpleComponent}/${simpleComponent}.story.tsx`)).toBe(
      "file",
    )
    expect(jetpack.exists(`app/components/${simpleComponent}/index.ts`)).toBe("file")
    const lint = await execa("npm", ["-s", "run", "lint"])
    expect(lint.stderr).toBe("")
  })

  test("generates a screen", async () => {
    const simpleScreen = "test"
    await execa(IGNITE, ["g", "screen", simpleScreen], { preferLocal: false })
    expect(jetpack.exists(`app/screens/${simpleScreen}-screen/${simpleScreen}-screen.tsx`)).toBe(
      "file",
    )
    expect(jetpack.exists(`app/screens/${simpleScreen}-screen/index.ts`)).toBe("file")
    const lint = await execa("npm", ["-s", "run", "lint"])
    expect(lint.stderr).toBe("")
  })

  test("generates a model", async () => {
    const simpleModel = "test"
    await execa(IGNITE, ["g", "model", simpleModel], { preferLocal: false })
    expect(jetpack.exists(`app/models/${simpleModel}/${simpleModel}.ts`)).toBe("file")
    expect(jetpack.exists(`app/models/${simpleModel}/${simpleModel}.test.ts`)).toBe("file")
    expect(jetpack.exists(`app/models/${simpleModel}/index.ts`)).toBe("file")
    const lint = await execa("npm", ["-s", "run", "lint"])
    expect(lint.stderr).toBe("")
  })
})
