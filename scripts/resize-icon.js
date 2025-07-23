const sharp = require("sharp")
const path = require("path")
const fs = require("fs")

const inputPath = path.join(__dirname, "../src/assets/icons/kilo-dark.png")
const outputPath = path.join(__dirname, "../src/assets/icons/icon-128.png")

async function resizeIcon() {
	try {
		await sharp(inputPath).resize(128, 128).toFile(outputPath)

		console.log("Icon resized successfully!")
	} catch (error) {
		console.error("Error resizing icon:", error)
		process.exit(1)
	}
}

resizeIcon()
