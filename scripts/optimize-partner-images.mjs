#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { createHash } from 'crypto'

const PARTNER_IMAGES_DIR = 'public/images/partners'
const SIZES = [128, 256, 512]

/**
 * Generate a hash for a file to check if it has changed
 */
async function getFileHash(filePath) {
  try {
    const buffer = await fs.readFile(filePath)
    return createHash('sha256').update(buffer).digest('hex')
  } catch {
    return null
  }
}

/**
 * Check if optimized images exist and are up to date
 */
async function areOptimizedImagesUpToDate(sourceFile, baseName) {
  const sourceHash = await getFileHash(sourceFile)
  if (!sourceHash) return false

  // Check if all size variants exist and have the same source hash
  for (const size of SIZES) {
    const optimizedFile = path.join(PARTNER_IMAGES_DIR, `${baseName}-${size}.webp`)
    const hashFile = path.join(PARTNER_IMAGES_DIR, `.${baseName}-${size}.hash`)

    try {
      const storedHash = await fs.readFile(hashFile, 'utf8')
      await fs.access(optimizedFile)

      if (storedHash.trim() !== sourceHash) {
        return false
      }
    } catch {
      return false
    }
  }

  return true
}

/**
 * Optimize a single image file
 */
async function optimizeImage(sourceFile, baseName) {
  console.log(`Optimizing ${sourceFile}...`)

  const sourceHash = await getFileHash(sourceFile)
  if (!sourceHash) {
    console.warn(`Could not read source file: ${sourceFile}`)
    return
  }

  for (const size of SIZES) {
    const outputFile = path.join(PARTNER_IMAGES_DIR, `${baseName}-${size}.webp`)
    const hashFile = path.join(PARTNER_IMAGES_DIR, `.${baseName}-${size}.hash`)

    try {
      await sharp(sourceFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .webp({ quality: 90 })
        .toFile(outputFile)

      // Store the source hash for future comparisons
      await fs.writeFile(hashFile, sourceHash)

      console.log(`  ✓ Generated ${baseName}-${size}.webp`)
    } catch (error) {
      console.error(`  ✗ Failed to generate ${baseName}-${size}.webp:`, error.message)
    }
  }
}

/**
 * Get the base name for a file (without extension)
 */
function getBaseName(fileName) {
  return path.parse(fileName).name
}

/**
 * Check if file is an image
 */
function isImageFile(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)
}

/**
 * Main optimization function
 */
async function optimizePartnerImages() {
  try {
    // Ensure the partner images directory exists
    await fs.mkdir(PARTNER_IMAGES_DIR, { recursive: true })

    // Read all files in the partner images directory
    const files = await fs.readdir(PARTNER_IMAGES_DIR)

    // Filter for image files and exclude already optimized files
    const sourceImages = files.filter(file => {
      return isImageFile(file) &&
             !file.includes('-128.webp') &&
             !file.includes('-256.webp') &&
             !file.includes('-512.webp') &&
             !file.startsWith('.')
    })

    if (sourceImages.length === 0) {
      console.log('No partner images found to optimize.')
      return
    }

    console.log(`Found ${sourceImages.length} partner images to check for optimization`)

    let optimizedCount = 0
    let skippedCount = 0

    for (const imageFile of sourceImages) {
      const sourceFile = path.join(PARTNER_IMAGES_DIR, imageFile)
      const baseName = getBaseName(imageFile)

      // Check if optimization is needed
      if (await areOptimizedImagesUpToDate(sourceFile, baseName)) {
        console.log(`Skipping ${imageFile} (already optimized and up to date)`)
        skippedCount++
        continue
      }

      await optimizeImage(sourceFile, baseName)
      optimizedCount++
    }

    console.log(`\nOptimization complete:`)
    console.log(`  ✓ ${optimizedCount} images optimized`)
    console.log(`  - ${skippedCount} images skipped (up to date)`)
    console.log(`  → Generated ${optimizedCount * SIZES.length} optimized variants`)

  } catch (error) {
    console.error('Error optimizing partner images:', error)
    process.exit(1)
  }
}

// Run the optimization if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizePartnerImages()
}

export { optimizePartnerImages }