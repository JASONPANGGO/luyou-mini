const { execSync } = require("child_process")
const { writeFileSync, rmSync } = require("fs")

const denoRunner = code => {
    const filename = Date.now().toFixed() + '.js'
    writeFileSync(filename, code)
    const res = execSync(`deno run ${filename}`)
    rmSync(filename)
    return res
}

export default denoRunner