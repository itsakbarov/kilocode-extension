import { Package } from "../../shared/package"

export const DEFAULT_HEADERS = {
	"HTTP-Referer": "https://kilocode.ai",
	"X-Title": "O Code",
	"X-KiloCode-Version": Package.version,
	"User-Agent": `O-Code/${Package.version}`,
}
