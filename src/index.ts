import type { Plugin } from "@opencode-ai/plugin"
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { homedir } from "node:os"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PLUGIN_NAME = "opencode-roadmap-plugin"
const PKG_VERSION = "1.0.0"

/**
 * Resolve the package root by walking up from the entry file
 * until we find package.json. Works whether the plugin is
 * loaded from dist/ or src/.
 */
function findPackageRoot(start: string): string {
  let cur = start
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(cur, "package.json"))) return cur
    const parent = dirname(cur)
    if (parent === cur) break
    cur = parent
  }
  return start
}

/**
 * Copy markdown files from a source dir to a target dir,
 * creating the target if needed. Returns the list of copied filenames.
 */
function syncMarkdownFiles(srcDir: string, targetDir: string): string[] {
  if (!existsSync(srcDir)) return []
  mkdirSync(targetDir, { recursive: true })

  const copied: string[] = []
  for (const file of readdirSync(srcDir)) {
    if (!file.endsWith(".md")) continue
    const srcFile = join(srcDir, file)
    const targetFile = join(targetDir, file)

    if (!statSync(srcFile).isFile()) continue

    // Always overwrite to keep the user's installed copy in sync with the plugin version
    copyFileSync(srcFile, targetFile)
    copied.push(file)
  }
  return copied
}

/**
 * Read the package's version from package.json (best effort).
 */
function readPackageVersion(packageRoot: string): string {
  try {
    const pkg = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf-8"))
    return pkg.version ?? PKG_VERSION
  } catch {
    return PKG_VERSION
  }
}

export const server: Plugin = async (_input) => {
  const packageRoot = findPackageRoot(__dirname)
  const version = readPackageVersion(packageRoot)

  const userConfigDir = join(homedir(), ".config", "opencode")
  const userAgentsDir = join(userConfigDir, "agents")
  const userCommandsDir = join(userConfigDir, "commands")

  const pkgAgents = join(packageRoot, "agents")
  const pkgCommands = join(packageRoot, "commands")

  let copiedAgents: string[] = []
  let copiedCommands: string[] = []

  try {
    copiedAgents = syncMarkdownFiles(pkgAgents, userAgentsDir)
    copiedCommands = syncMarkdownFiles(pkgCommands, userCommandsDir)
  } catch (err) {
    console.warn(`[${PLUGIN_NAME}] Failed to install assets:`, err)
  }

  console.log(
    `[${PLUGIN_NAME}@${version}] loaded — ${copiedAgents.length} agent(s), ${copiedCommands.length} command(s) synced`,
  )

  return {
    // Lightweight no-op hook so the plugin registers cleanly with opencode.
    // Surfaces a warning if the user's config diverges (file deleted manually).
    "shell.env": async (_input, output) => {
      output.env[`${PLUGIN_NAME.toUpperCase().replace(/-/g, "_")}_VERSION`] = version
    },
  }
}

export default server
