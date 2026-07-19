import { copyFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { resolve } from 'node:path'

const examplePath = resolve('.env.example')
const localPath = resolve('.env.local')

try {
  await access(localPath, constants.F_OK)
  console.log('.env.local already exists. No files were changed.')
} catch {
  await copyFile(examplePath, localPath, constants.COPYFILE_EXCL)
  console.log('Created .env.local from .env.example.')
}

console.log('Run `npm run dev`, then open http://localhost:3000.')
