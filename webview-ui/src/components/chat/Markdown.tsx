import { memo, useState } from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"

import { useCopyToClipboard } from "@src/utils/clipboard"
import { StandardTooltip } from "@src/components/ui"

import MarkdownBlock from "../common/MarkdownBlock"

export const Markdown = memo(({ markdown, partial }: { markdown?: string; partial?: boolean }) => {
	const [isHovering, setIsHovering] = useState(false)

	// Shorter feedback duration for copy button flash.
	const { copyWithFeedback } = useCopyToClipboard(200)

	if (!markdown || markdown.length === 0) {
		return null
	}

	return (
		<div
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
			className="relative group">
			<div className="prose prose-sm max-w-none">
				<MarkdownBlock markdown={markdown} />
			</div>
			{markdown && !partial && isHovering && (
				<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
					<StandardTooltip content="Copy as markdown">
						<VSCodeButton
							className="copy-button"
							appearance="icon"
							style={{
								height: "24px",
								width: "24px",
								background: "var(--vscode-button-secondaryBackground, rgba(127, 127, 127, 0.1))",
								borderRadius: "4px",
								transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								border: "1px solid var(--vscode-widget-border, rgba(127, 127, 127, 0.1))",
							}}
							onClick={async () => {
								const success = await copyWithFeedback(markdown)
								if (success) {
									const button = document.activeElement as HTMLElement
									if (button) {
										button.style.background = "var(--vscode-button-background, #0078d4)"
										button.style.color = "var(--vscode-button-foreground, #ffffff)"
										setTimeout(() => {
											button.style.background =
												"var(--vscode-button-secondaryBackground, rgba(127, 127, 127, 0.1))"
											button.style.color = ""
										}, 200)
									}
								}
							}}>
							<span
								className="codicon codicon-copy"
								style={{
									fontSize: "12px",
									color: "var(--vscode-foreground)",
								}}
							/>
						</VSCodeButton>
					</StandardTooltip>
				</div>
			)}
		</div>
	)
})
