import React, { memo, useEffect } from "react"
import { useRemark } from "react-remark"
import styled from "styled-components"
import { visit } from "unist-util-visit"
import rehypeKatex from "rehype-katex"
import remarkMath from "remark-math"

import { vscode } from "@src/utils/vscode"
import { useExtensionState } from "@src/context/ExtensionStateContext"

import CodeBlock from "./CodeBlock"
import MermaidBlock from "./MermaidBlock"

interface MarkdownBlockProps {
	markdown?: string
}

/**
 * Custom remark plugin that converts plain URLs in text into clickable links
 *
 * The original bug: We were converting text nodes into paragraph nodes,
 * which broke the markdown structure because text nodes should remain as text nodes
 * within their parent elements (like paragraphs, list items, etc.).
 * This caused the entire content to disappear because the structure became invalid.
 */
const remarkUrlToLink = () => {
	return (tree: any) => {
		// Visit all "text" nodes in the markdown AST (Abstract Syntax Tree)
		visit(tree, "text", (node: any, index, parent) => {
			const urlRegex = /https?:\/\/[^\s<>)"]+/g
			const matches = node.value.match(urlRegex)

			if (!matches || !parent) {
				return
			}

			const parts = node.value.split(urlRegex)
			const children: any[] = []
			const cleanedMatches = matches.map((url: string) => url.replace(/[.,;:!?'"]+$/, ""))

			parts.forEach((part: string, i: number) => {
				if (part) {
					children.push({ type: "text", value: part })
				}

				if (cleanedMatches[i]) {
					const originalUrl = matches[i]
					const cleanedUrl = cleanedMatches[i]
					const removedPunctuation = originalUrl.substring(cleanedUrl.length)

					// Create a proper link node with all required properties
					children.push({
						type: "link",
						url: cleanedUrl,
						title: null,
						children: [{ type: "text", value: cleanedUrl }],
						data: {
							hProperties: {
								href: cleanedUrl,
							},
						},
					})

					if (removedPunctuation) {
						children.push({ type: "text", value: removedPunctuation })
					}
				}
			})

			// Replace the original text node with our new nodes in the parent's children array.
			// This preserves the document structure while adding our links.
			parent.children.splice(index!, 1, ...children)

			// Return SKIP to prevent visiting the newly created nodes
			return ["skip", index! + children.length]
		})
	}
}

const StyledMarkdown = styled.div`
	/* Base font styling with GeistSans */
	font-family: "GeistSans", "GeistSans Fallback", ui-sans-serif, system-ui, sans-serif;
	font-size: 14px;
	line-height: 1.6;
	color: inherit;

	/* Improved inline code styling */
	code:not(pre > code) {
		font-family: var(
			--vscode-editor-font-family,
			"SF Mono",
			Consolas,
			"Liberation Mono",
			Menlo,
			Courier,
			monospace
		);
		font-size: 0.85em;
		color: var(--vscode-textPreformat-foreground) !important;
		background-color: var(--vscode-textCodeBlock-background, rgba(127, 127, 127, 0.1)) !important;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		white-space: pre-wrap;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	/* Target only high-contrast theme(s) using the data attribute VS Code adds to the body */
	body[data-vscode-theme-kind*="high-contrast"] & code:not(pre > code) {
		color: var(
			--vscode-editorInlayHint-foreground,
			var(--vscode-symbolIcon-stringForeground, var(--vscode-charts-orange, #e9a700))
		);
	}

	/* Clean headings */
	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		font-family: "GeistSans", "GeistSans Fallback", ui-sans-serif, system-ui, sans-serif;
		font-weight: 600;
		line-height: 1.3;
		margin: 1rem 0 0.5rem 0;
		color: inherit;
	}

	h1 {
		font-size: 1.5rem;
	}
	h2 {
		font-size: 1.3rem;
	}
	h3 {
		font-size: 1.1rem;
	}
	h4 {
		font-size: 1rem;
	}
	h5 {
		font-size: 0.9rem;
	}
	h6 {
		font-size: 0.85rem;
		opacity: 0.8;
	}

	/* Clean paragraphs */
	p {
		margin: 0.5rem 0;
		white-space: pre-wrap;
		line-height: 1.6;
		color: inherit;
	}

	/* Simple lists */
	ol,
	ul {
		padding-left: 1.5rem;
		margin: 0.5rem 0;
		line-height: 1.6;
	}

	li {
		margin: 0.25rem 0;
		line-height: 1.6;
	}

	/* Clean blockquotes */
	blockquote {
		margin: 0.75rem 0;
		padding: 0.5rem 0.75rem;
		border-left: 3px solid var(--vscode-textLink-foreground, #0078d4);
		background: var(--vscode-textCodeBlock-background, rgba(127, 127, 127, 0.05));
		border-radius: 0 0.25rem 0.25rem 0;
		font-style: italic;
		opacity: 0.9;

		p:first-child {
			margin-top: 0;
		}
		p:last-child {
			margin-bottom: 0;
		}
	}

	/* Simple tables */
	table {
		border-collapse: collapse;
		margin: 0.75rem 0;
		width: 100%;
		font-size: 0.9em;
		border-radius: 0.25rem;
		overflow: hidden;
		border: 1px solid var(--vscode-widget-border, rgba(127, 127, 127, 0.1));
	}

	th,
	td {
		padding: 0.5rem;
		text-align: left;
		border-bottom: 1px solid var(--vscode-widget-border, rgba(127, 127, 127, 0.1));
	}

	th {
		background: var(--vscode-list-hoverBackground, rgba(127, 127, 127, 0.05));
		font-weight: 600;
		color: inherit;
	}

	/* Clean links */
	a {
		color: var(--vscode-textLink-foreground, #0078d4);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}

	/* Simple horizontal rules */
	hr {
		border: none;
		height: 1px;
		background: var(--vscode-widget-border, rgba(127, 127, 127, 0.1));
		margin: 1rem 0;
	}

	/* Code blocks */
	pre {
		margin: 0.75rem 0;
		border-radius: 0.375rem;
		overflow: hidden;
		border: 1px solid var(--vscode-widget-border, rgba(127, 127, 127, 0.1));
	}

	/* Clean spacing */
	> *:first-child {
		margin-top: 0;
	}

	> *:last-child {
		margin-bottom: 0;
	}

	/* KaTeX styling */
	.katex {
		font-size: 1.1em;
		color: inherit;
		font-family: KaTeX_Main, "Times New Roman", serif;
		line-height: 1.2;
		white-space: normal;
		text-indent: 0;
	}

	.katex-display {
		display: block;
		margin: 1rem 0;
		text-align: center;
		padding: 0.75rem;
		overflow-x: auto;
		overflow-y: hidden;
		background-color: var(--vscode-textCodeBlock-background, rgba(127, 127, 127, 0.05));
		border-radius: 0.375rem;
		border: 1px solid var(--vscode-widget-border, rgba(127, 127, 127, 0.1));
	}

	.katex-error {
		color: var(--vscode-errorForeground);
	}
`

const MarkdownBlock = memo(({ markdown }: MarkdownBlockProps) => {
	const { theme } = useExtensionState()
	const [reactContent, setMarkdown] = useRemark({
		remarkPlugins: [
			remarkUrlToLink,
			remarkMath,
			() => {
				return (tree) => {
					visit(tree, "code", (node: any) => {
						if (!node.lang) {
							node.lang = "text"
						} else if (node.lang.includes(".")) {
							node.lang = node.lang.split(".").slice(-1)[0]
						}
					})
				}
			},
		],
		rehypePlugins: [rehypeKatex as any],
		rehypeReactOptions: {
			components: {
				a: ({ href, children, ...props }: any) => {
					const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
						// Only process file:// protocol or local file paths
						const isLocalPath = href.startsWith("file://") || href.startsWith("/") || !href.includes("://")

						if (!isLocalPath) {
							return
						}

						e.preventDefault()

						// Handle absolute vs project-relative paths
						let filePath = href.replace("file://", "")

						// Extract line number if present
						const match = filePath.match(/(.*):(\d+)(-\d+)?$/)
						let values = undefined
						if (match) {
							filePath = match[1]
							values = { line: parseInt(match[2]) }
						}

						// Add ./ prefix if needed
						if (!filePath.startsWith("/") && !filePath.startsWith("./")) {
							filePath = "./" + filePath
						}

						vscode.postMessage({
							type: "openFile",
							text: filePath,
							values,
						})
					}

					return (
						<a {...props} href={href} onClick={handleClick}>
							{children}
						</a>
					)
				},
				pre: ({ node: _, children }: any) => {
					// Check for Mermaid diagrams first
					if (Array.isArray(children) && children.length === 1 && React.isValidElement(children[0])) {
						const child = children[0] as React.ReactElement<{ className?: string }>

						if (child.props?.className?.includes("language-mermaid")) {
							return child
						}
					}

					// For all other code blocks, use CodeBlock with copy button
					const codeNode = children?.[0]

					if (!codeNode?.props?.children) {
						return null
					}

					const language =
						(Array.isArray(codeNode.props?.className)
							? codeNode.props.className
							: [codeNode.props?.className]
						).map((c: string) => c?.replace("language-", ""))[0] || "javascript"

					const rawText = codeNode.props.children[0] || ""
					return <CodeBlock source={rawText} language={language} />
				},
				code: (props: any) => {
					const className = props.className || ""

					if (className.includes("language-mermaid")) {
						const codeText = String(props.children || "")
						return <MermaidBlock code={codeText} />
					}

					return <code {...props} />
				},
			},
		},
	})

	useEffect(() => {
		setMarkdown(markdown || "")
	}, [markdown, setMarkdown, theme])

	return (
		<div style={{}}>
			<StyledMarkdown>{reactContent}</StyledMarkdown>
		</div>
	)
})

export default MarkdownBlock
