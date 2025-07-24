import { TextShimmer } from "@/components/ui/text-shimmer"

// Basic usage example
export function TextShimmerBasic() {
	return (
		<TextShimmer className="font-mono text-sm" duration={1}>
			Generating code...
		</TextShimmer>
	)
}

// Custom color example
export function TextShimmerColor() {
	return (
		<TextShimmer
			duration={1.2}
			className="text-xl font-medium [--base-color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]">
			Hi, how are you?
		</TextShimmer>
	)
}

// Loading state example
export function TextShimmerLoading() {
	return (
		<div className="space-y-4">
			<TextShimmer duration={2} className="text-lg font-semibold">
				Loading your data...
			</TextShimmer>

			<TextShimmer duration={1.5} className="text-sm text-gray-600">
				This may take a few moments
			</TextShimmer>
		</div>
	)
}

// Custom element example
export function TextShimmerCustomElement() {
	return (
		<TextShimmer as="h1" duration={2.5} className="text-3xl font-bold">
			Welcome to Kilo Code
		</TextShimmer>
	)
}

// Different spread example
export function TextShimmerSpread() {
	return (
		<div className="space-y-2">
			<TextShimmer duration={1} spread={1} className="block">
				Small spread animation
			</TextShimmer>

			<TextShimmer duration={1} spread={3} className="block">
				Large spread animation
			</TextShimmer>
		</div>
	)
}

// Usage examples for integration
export const textShimmerExamples = {
	TextShimmerBasic,
	TextShimmerColor,
	TextShimmerLoading,
	TextShimmerCustomElement,
	TextShimmerSpread,
}
