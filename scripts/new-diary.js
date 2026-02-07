/* This is a script to create a new diary markdown file with front-matter */

import fs from "fs"
import path from "path"

function getDate() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    const hour = String(today.getHours()).padStart(2, "0")
    const minute = String(today.getMinutes()).padStart(2, "0")
    const second = String(today.getSeconds()).padStart(2, "0")

    return `${year}-${month}-${day}--${hour}-${minute}-${second}`
}

let fileName = getDate();

// Add .md extension if not present
const fileExtensionRegex = /\.(md|mdx)$/i
if (!fileExtensionRegex.test(fileName)) {
    fileName += ".md"
}

const targetDir = "./src/content/diaries/"
const fullPath = path.join(targetDir, fileName)

if (fs.existsSync(fullPath)) {
    console.error(`Error: File ${fullPath} already exists `)
    process.exit(1)
}

// recursive mode creates multi-level directories
const dirPath = path.dirname(fullPath)
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
}

fs.writeFileSync(path.join(targetDir, fileName), "")

console.log(`Diary ${fullPath} created`)