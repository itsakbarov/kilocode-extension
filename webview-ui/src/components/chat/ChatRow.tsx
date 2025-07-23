import React, { memo, useEffect, useRef } from "react"
import { useSize } from "react-use"
import { useTranslation } from "react-i18next"
import deepEqual from "fast-deep-equal"

import type { ClineMessage } from "@roo-code/types"

import { ClineSayTool } from "@roo/ExtensionMessage"
import { safeJsonParse } from "@roo/safeJsonParse"
import { FollowUpData, SuggestionItem } from "@roo-code/types"

import { useExtensionState } from "@src/context/ExtensionStateContext"
// import { Button } from "@src/components/ui" // kilocode_change

// import ChatTextArea from "./ChatTextArea" // kilocode_change

// import Thumbnails from "../common/Thumbnails" // kilocode_change

// import { Mention } from "./Mention" // kilocode_change

import { KiloChatRowGutterBar } from "../kilocode/chat/KiloChatRowGutterBar" // kilocode_change
import { cn } from "@/lib/utils"

interface ChatRowProps {
	message: ClineMessage
	lastModifiedMessage?: ClineMessage
	isExpanded: boolean
	isLast: boolean
	isStreaming: boolean
	onToggleExpand: (ts: number) => void
	onHeightChange: (isTaller: boolean) => void
	onSuggestionClick?: (suggestion: SuggestionItem, event?: React.MouseEvent) => void
	onBatchFileResponse?: (response: { [key: string]: boolean }) => void
	highlighted?: boolean // kilocode_change: Add highlighted prop
	onChatReset?: () => void // kilocode_change
	onFollowUpUnmount?: () => void
	isFollowUpAnswered?: boolean
	editable?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChatRowContentProps extends Omit<ChatRowProps, "onHeightChange"> {}

const ChatRow = memo(
	(props: ChatRowProps) => {
		const { highlighted } = props // kilocode_change: Add highlighted prop
		const { showTaskTimeline } = useExtensionState() // kilocode_change: Used by KiloChatRowGutterBar
		const { isLast, onHeightChange, message } = props
		// Store the previous height to compare with the current height
		// This allows us to detect changes without causing re-renders
		const prevHeightRef = useRef(0)

		const [chatrow, { height }] = useSize(
			<div
				className={cn(
					"group relative transition-all duration-200 ease-in-out",
					"border-b border-vscode-widget-border/20 last:border-b-0",
					highlighted && "animate-message-highlight",
				)}>
				{showTaskTimeline && <KiloChatRowGutterBar message={message} />}
				<div className="max-w-4xl mx-auto px-4 py-4">
					{/* Clean minimal layout without bubbles */}
					<div className="flex items-start gap-3">
						{/* User avatar */}
						<div className="flex-shrink-0 w-8 h-8 rounded-full bg-vscode-button-background text-vscode-button-foreground flex items-center justify-center text-sm font-medium">
							U
						</div>

						{/* Message content */}
						<div className="flex-1 min-w-0">
							<ChatRowContent {...props} />
						</div>
					</div>
				</div>
			</div>,
		)

		useEffect(() => {
			// used for partials, command output, etc.
			// NOTE: it's important we don't distinguish between partial or complete here since our scroll effects in chatview need to handle height change during partial -> complete
			const isInitialRender = prevHeightRef.current === 0 // prevents scrolling when new element is added since we already scroll for that
			// height starts off at Infinity
			if (isLast && height !== 0 && height !== Infinity && height !== prevHeightRef.current) {
				if (!isInitialRender) {
					onHeightChange(height > prevHeightRef.current)
				}
				prevHeightRef.current = height
			}
		}, [height, isLast, onHeightChange, message])

		// we cannot return null as virtuoso does not support it, so we use a separate visibleMessages array to filter out messages that should not be rendered
		return chatrow
	},
	// memo does shallow comparison of props, so we need to do deep comparison of arrays/objects whose properties might change
	deepEqual,
)

export default ChatRow

export const ChatRowContent = ({
	message,
	lastModifiedMessage: _lastModifiedMessage,
	isExpanded: _isExpanded,
	isLast: _isLast,
	isStreaming: _isStreaming,
	onToggleExpand: _onToggleExpand,
	onSuggestionClick: _onSuggestionClick,
	onFollowUpUnmount: _onFollowUpUnmount,
	onBatchFileResponse: _onBatchFileResponse,
	onChatReset: _onChatReset, // kilocode_change
	isFollowUpAnswered: _isFollowUpAnswered,
	editable: _editable,
}: ChatRowContentProps) => {
	const { t: _t } = useTranslation()

	// For user messages, extract the actual text content
	let displayText = ""

	// Check if this is the initial task message (first message in the conversation)
	const isInitialTask = message.ts === 1000 // Initial task messages have ts: 1000

	if (isInitialTask) {
		// For initial task, the text is the user's actual input
		displayText = message.text || ""
	} else {
		// Handle different ask types to extract user's actual input
		switch (message.ask) {
			case "tool":
				// For tool messages, check if there's user feedback in the text
				const toolData = safeJsonParse<any>(message.text)
				if (toolData && typeof toolData === "string") {
					// If text is a string, it's likely user feedback
					displayText = toolData
				} else if (message.text && !message.text.startsWith("{")) {
					// If text doesn't start with {, it's likely user input
					displayText = message.text
				} else {
					// Otherwise, show a simplified action description
					const tool = safeJsonParse<ClineSayTool>(message.text)
					if (tool) {
						switch (tool.tool) {
							case "editedExistingFile":
							case "appliedDiff":
								displayText = `Approved: Edit ${tool.path}`
								break
							case "newFileCreated":
								displayText = `Approved: Create ${tool.path}`
								break
							case "readFile":
								displayText = `Approved: Read ${tool.path}`
								break
							case "searchFiles":
								displayText = `Approved: Search for "${tool.regex}"`
								break
							default:
								displayText = `Approved: ${tool.tool}`
						}
					}
				}
				break

			case "followup":
				// For follow-up questions, show the actual question
				const followUpData = safeJsonParse<FollowUpData>(message.text)
				displayText = followUpData?.question || message.text || ""
				break

			case "command":
				// For commands, check if there's user input or just show the command
				if (message.text && !message.text.includes("$")) {
					// If no $ sign, it's likely user input/feedback
					displayText = message.text
				} else {
					displayText = `Approved: ${message.text}`
				}
				break

			case "mistake_limit_reached":
			case "api_req_failed":
			case "completion_result":
			case "resume_task":
			case "resume_completed_task":
				// These are typically user responses or feedback
				displayText = message.text || ""
				break

			default:
				// For any other ask type, show the text if available
				displayText = message.text || ""
		}
	}

	// If no text to display, don't render anything
	if (!displayText || displayText.trim() === "") {
		return null
	}

	// Render clean, minimal text like v0.dev
	return (
		<div className="text-vscode-editor-foreground">
			<p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{displayText}</p>
		</div>
	)
}
