import * as vscode from "vscode"
import delay from "delay"

import type { CommandId } from "@roo-code/types"
import { TelemetryService } from "@roo-code/telemetry"

import { getCommand } from "../utils/commands"
import { ClineProvider } from "../core/webview/ClineProvider"
import { exportSettings } from "../core/config/importExport" // kilocode_change
import { ContextProxy } from "../core/config/ContextProxy"
import { focusPanel } from "../utils/focusPanel"

import { registerHumanRelayCallback, unregisterHumanRelayCallback, handleHumanRelayResponse } from "./humanRelay"
import { handleNewTask } from "./handleTask"
import { CodeIndexManager } from "../services/code-index/manager"
import { importSettingsWithFeedback } from "../core/config/importExport"
import { MdmService } from "../services/mdm/MdmService"
import { t } from "../i18n"

// Types for task analysis and model recommendations
interface ModelRecommendation {
	name: string
	provider: string
	reasoning: string
}

interface TaskAnalysis {
	taskType: string
	complexity: string
	domain: string
	recommendedModel: ModelRecommendation
	alternatives: ModelRecommendation[]
	tips: string[]
}

/**
 * Analyzes the user's prompt and suggests the best model for the task
 * This is a mock implementation with predefined patterns and suggestions
 */
function analyzePromptAndSuggestModel(prompt: string, mode: string): TaskAnalysis {
	const lowercasePrompt = prompt.toLowerCase()

	// Mock analysis based on prompt keywords and patterns
	let taskType = "General Assistance"
	let complexity = "Medium"
	let domain = "General"
	let recommendedModel: ModelRecommendation = {
		name: "Claude 3.5 Sonnet",
		provider: "Anthropic",
		reasoning: "Well-balanced model with strong reasoning capabilities suitable for general tasks.",
	}
	let alternatives: ModelRecommendation[] = [
		{ name: "GPT-4", provider: "OpenAI", reasoning: "Versatile model with broad capabilities for various tasks." },
		{ name: "Gemini Pro", provider: "Google", reasoning: "Good general-purpose model with factual accuracy." },
	]
	let tips: string[] = [
		"Be specific about your requirements",
		"Provide relevant context",
		"Break down complex tasks into smaller parts",
	]

	// Analyze prompt for different task types
	if (
		lowercasePrompt.includes("code") ||
		lowercasePrompt.includes("program") ||
		lowercasePrompt.includes("function") ||
		lowercasePrompt.includes("debug")
	) {
		taskType = "Code Development"
		domain = "Software Engineering"
		complexity = detectCodeComplexity(lowercasePrompt)
		recommendedModel = {
			name: "Claude 3.5 Sonnet",
			provider: "Anthropic",
			reasoning:
				"Excellent at code generation, debugging, and understanding complex programming patterns with strong reasoning capabilities.",
		}
		alternatives = [
			{
				name: "GPT-4",
				provider: "OpenAI",
				reasoning: "Strong coding abilities with extensive training on programming languages.",
			},
			{
				name: "Codestral",
				provider: "Mistral",
				reasoning: "Specialized code model with good performance on specific programming tasks.",
			},
		]
		tips = [
			"Include specific programming language requirements",
			"Provide context about your project structure",
			"Mention any frameworks or libraries you're using",
		]
	} else if (
		lowercasePrompt.includes("write") ||
		lowercasePrompt.includes("article") ||
		lowercasePrompt.includes("blog") ||
		lowercasePrompt.includes("content")
	) {
		taskType = "Content Creation"
		domain = "Writing & Communication"
		complexity = detectWritingComplexity(lowercasePrompt)
		recommendedModel = {
			name: "GPT-4",
			provider: "OpenAI",
			reasoning: "Outstanding creative writing abilities with excellent language flow and style adaptation.",
		}
		alternatives = [
			{
				name: "Claude 3.5 Sonnet",
				provider: "Anthropic",
				reasoning: "Great for analytical and structured writing with clear explanations.",
			},
			{
				name: "Gemini Pro",
				provider: "Google",
				reasoning: "Good for factual content and research-based writing.",
			},
		]
		tips = [
			"Specify your target audience",
			"Mention desired tone and style",
			"Include any SEO or formatting requirements",
		]
	} else if (
		lowercasePrompt.includes("analyze") ||
		lowercasePrompt.includes("research") ||
		lowercasePrompt.includes("study") ||
		lowercasePrompt.includes("data")
	) {
		taskType = "Analysis & Research"
		domain = "Research & Analytics"
		complexity = detectAnalysisComplexity(lowercasePrompt)
		recommendedModel = {
			name: "Claude 3.5 Sonnet",
			provider: "Anthropic",
			reasoning: "Exceptional analytical reasoning with ability to break down complex problems systematically.",
		}
		alternatives = [
			{
				name: "GPT-4",
				provider: "OpenAI",
				reasoning: "Strong analytical capabilities with broad knowledge base.",
			},
			{
				name: "Gemini Pro",
				provider: "Google",
				reasoning: "Excellent for factual analysis and data interpretation.",
			},
		]
		tips = [
			"Provide clear research objectives",
			"Include relevant data sources or context",
			"Specify the format you want for results",
		]
	} else if (
		lowercasePrompt.includes("creative") ||
		lowercasePrompt.includes("story") ||
		lowercasePrompt.includes("design") ||
		lowercasePrompt.includes("brainstorm")
	) {
		taskType = "Creative Tasks"
		domain = "Creative & Design"
		complexity = "Medium"
		recommendedModel = {
			name: "GPT-4",
			provider: "OpenAI",
			reasoning: "Superior creative capabilities with imaginative and diverse outputs.",
		}
		alternatives = [
			{
				name: "Claude 3.5 Sonnet",
				provider: "Anthropic",
				reasoning: "Good creative writing with structured approach to storytelling.",
			},
			{ name: "Gemini Pro", provider: "Google", reasoning: "Decent creative abilities with factual grounding." },
		]
		tips = [
			"Provide creative constraints or guidelines",
			"Specify the target audience or style",
			"Include examples of desired output if available",
		]
	} else if (
		lowercasePrompt.includes("explain") ||
		lowercasePrompt.includes("teach") ||
		lowercasePrompt.includes("learn") ||
		lowercasePrompt.includes("how to")
	) {
		taskType = "Educational Content"
		domain = "Education & Learning"
		complexity = "Low"
		recommendedModel = {
			name: "Claude 3.5 Sonnet",
			provider: "Anthropic",
			reasoning: "Excellent at clear explanations with step-by-step breakdowns and educational structure.",
		}
		alternatives = [
			{
				name: "GPT-4",
				provider: "OpenAI",
				reasoning: "Great teaching abilities with adaptive explanations for different skill levels.",
			},
			{
				name: "Gemini Pro",
				provider: "Google",
				reasoning: "Good for factual explanations and educational content.",
			},
		]
		tips = [
			"Specify the learner's skill level",
			"Mention preferred learning style (visual, examples, etc.)",
			"Include any specific topics to focus on or avoid",
		]
	}

	// Adjust recommendations based on mode
	if (mode === "architecture") {
		recommendedModel = {
			name: "Claude 3.5 Sonnet",
			provider: "Anthropic",
			reasoning: "Exceptional at system design and architectural thinking with strong analytical capabilities.",
		}
		tips.push("Consider mentioning scalability requirements", "Include performance constraints if applicable")
	} else if (mode === "edit") {
		tips.push("Be specific about what needs to be changed", "Provide context about the original intent")
	}

	return {
		taskType,
		complexity,
		domain,
		recommendedModel,
		alternatives,
		tips,
	}
}

/**
 * Detects code complexity based on prompt keywords
 */
function detectCodeComplexity(prompt: string): string {
	if (
		prompt.includes("algorithm") ||
		prompt.includes("optimization") ||
		prompt.includes("architecture") ||
		prompt.includes("system design")
	) {
		return "High"
	} else if (
		prompt.includes("refactor") ||
		prompt.includes("implement") ||
		prompt.includes("class") ||
		prompt.includes("database")
	) {
		return "Medium"
	} else {
		return "Low"
	}
}

/**
 * Detects writing complexity based on prompt keywords
 */
function detectWritingComplexity(prompt: string): string {
	if (
		prompt.includes("technical") ||
		prompt.includes("research") ||
		prompt.includes("academic") ||
		prompt.includes("white paper")
	) {
		return "High"
	} else if (prompt.includes("blog") || prompt.includes("article") || prompt.includes("report")) {
		return "Medium"
	} else {
		return "Low"
	}
}

/**
 * Detects analysis complexity based on prompt keywords
 */
function detectAnalysisComplexity(prompt: string): string {
	if (
		prompt.includes("statistical") ||
		prompt.includes("machine learning") ||
		prompt.includes("predictive") ||
		prompt.includes("model")
	) {
		return "High"
	} else if (prompt.includes("trend") || prompt.includes("comparison") || prompt.includes("performance")) {
		return "Medium"
	} else {
		return "Low"
	}
}

/**
 * Helper to get the visible ClineProvider instance or log if not found.
 */
export function getVisibleProviderOrLog(outputChannel: vscode.OutputChannel): ClineProvider | undefined {
	const visibleProvider = ClineProvider.getVisibleInstance()
	if (!visibleProvider) {
		outputChannel.appendLine("Cannot find any visible O Code instances.")
		return undefined
	}
	return visibleProvider
}

// Store panel references in both modes
let sidebarPanel: vscode.WebviewView | undefined = undefined
let tabPanel: vscode.WebviewPanel | undefined = undefined

/**
 * Get the currently active panel
 * @returns WebviewPanel或WebviewView
 */
export function getPanel(): vscode.WebviewPanel | vscode.WebviewView | undefined {
	return tabPanel || sidebarPanel
}

/**
 * Set panel references
 */
export function setPanel(
	newPanel: vscode.WebviewPanel | vscode.WebviewView | undefined,
	type: "sidebar" | "tab",
): void {
	if (type === "sidebar") {
		sidebarPanel = newPanel as vscode.WebviewView
		tabPanel = undefined
	} else {
		tabPanel = newPanel as vscode.WebviewPanel
		sidebarPanel = undefined
	}
}

export type RegisterCommandOptions = {
	context: vscode.ExtensionContext
	outputChannel: vscode.OutputChannel
	provider: ClineProvider
}

export const registerCommands = (options: RegisterCommandOptions) => {
	const { context } = options

	for (const [id, callback] of Object.entries(getCommandsMap(options))) {
		const command = getCommand(id as CommandId)
		context.subscriptions.push(vscode.commands.registerCommand(command, callback))
	}
}

const getCommandsMap = ({ context, outputChannel }: RegisterCommandOptions): Record<CommandId, any> => ({
	activationCompleted: () => {},
	accountButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("account")

		visibleProvider.postMessageToWebview({ type: "action", action: "accountButtonClicked" })
	},
	plusButtonClicked: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("plus")

		await visibleProvider.removeClineFromStack()
		await visibleProvider.postStateToWebview()
		await visibleProvider.postMessageToWebview({ type: "action", action: "chatButtonClicked" })
	},
	mcpButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("mcp")

		visibleProvider.postMessageToWebview({ type: "action", action: "mcpButtonClicked" })
	},
	promptsButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("prompts")

		visibleProvider.postMessageToWebview({ type: "action", action: "promptsButtonClicked" })
	},
	popoutButtonClicked: () => {
		TelemetryService.instance.captureTitleButtonClicked("popout")

		return openClineInNewTab({ context, outputChannel })
	},
	openInNewTab: () => openClineInNewTab({ context, outputChannel }),
	settingsButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("settings")

		visibleProvider.postMessageToWebview({ type: "action", action: "settingsButtonClicked" })
		// Also explicitly post the visibility message to trigger scroll reliably
		visibleProvider.postMessageToWebview({ type: "action", action: "didBecomeVisible" })
	},
	historyButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("history")

		visibleProvider.postMessageToWebview({ type: "action", action: "historyButtonClicked" })
	},
	// kilocode_change begin
	profileButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		visibleProvider.postMessageToWebview({ type: "action", action: "profileButtonClicked" })
	},
	helpButtonClicked: () => {
		vscode.env.openExternal(vscode.Uri.parse("https://kilocode.ai"))
	},
	// kilocode_change end
	marketplaceButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) return
		visibleProvider.postMessageToWebview({ type: "action", action: "marketplaceButtonClicked" })
	},
	suggestButtonClicked: async (mode: string = "chat", prompt: string = "") => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) return

		// Check if user has provided a prompt
		if (!prompt.trim()) {
			vscode.window.showWarningMessage(
				"Please enter a prompt first, then click the suggest button to get model recommendations.",
			)
			return
		}

		// Mock data for task analysis and model suggestions
		const taskAnalysis = analyzePromptAndSuggestModel(prompt, mode)

		// Create suggestion message with analysis results
		const suggestionMessage = `## 🎯 Task Analysis & Model Recommendation

**Your prompt:** "${prompt}"

**Current Mode:** ${mode}

**Analysis Results:**
- **Task Type:** ${taskAnalysis.taskType}
- **Complexity:** ${taskAnalysis.complexity}
- **Domain:** ${taskAnalysis.domain}

**📊 Recommended Model:**
- **Model:** ${taskAnalysis.recommendedModel.name}
- **Provider:** ${taskAnalysis.recommendedModel.provider}
- **Reasoning:** ${taskAnalysis.recommendedModel.reasoning}

**🔧 Alternative Options:**
${taskAnalysis.alternatives.map((alt) => `- **${alt.name}** (${alt.provider}): ${alt.reasoning}`).join("\n")}

**💡 Optimization Tips:**
${taskAnalysis.tips.map((tip) => `- ${tip}`).join("\n")}

*This analysis is based on mock data for demonstration. In a production environment, this would use real AI model performance metrics and task categorization.*`

		// Send the suggestion to the chat
		visibleProvider.postMessageToWebview({
			type: "invoke",
			invoke: "newChat",
			text: suggestionMessage,
			images: [],
		})

		// Show success message
		vscode.window.showInformationMessage(
			`Generated model recommendations for your "${taskAnalysis.taskType}" task!`,
		)
	},
	showHumanRelayDialog: (params: { requestId: string; promptText: string }) => {
		const panel = getPanel()

		if (panel) {
			panel?.webview.postMessage({
				type: "showHumanRelayDialog",
				requestId: params.requestId,
				promptText: params.promptText,
			})
		}
	},
	registerHumanRelayCallback: registerHumanRelayCallback,
	unregisterHumanRelayCallback: unregisterHumanRelayCallback,
	handleHumanRelayResponse: handleHumanRelayResponse,
	newTask: handleNewTask,
	setCustomStoragePath: async () => {
		const { promptForCustomStoragePath } = await import("../utils/storage")
		await promptForCustomStoragePath()
	},
	importSettings: async (filePath?: string) => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}

		await importSettingsWithFeedback(
			{
				providerSettingsManager: visibleProvider.providerSettingsManager,
				contextProxy: visibleProvider.contextProxy,
				customModesManager: visibleProvider.customModesManager,
				provider: visibleProvider,
			},
			filePath,
		)
	},
	focusPanel: async () => {
		try {
			await focusPanel(tabPanel, sidebarPanel)
		} catch (error) {
			outputChannel.appendLine(`Error focusing panel: ${error}`)
		}
	},
	acceptInput: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		visibleProvider.postMessageToWebview({ type: "acceptInput" })
	}, // kilocode_change begin
	focusChatInput: async () => {
		try {
			await vscode.commands.executeCommand("o-code.SidebarProvider.focus")
			await delay(100)

			let visibleProvider = getVisibleProviderOrLog(outputChannel)

			if (!visibleProvider) {
				// If still no visible provider, try opening in a new tab
				const tabProvider = await openClineInNewTab({ context, outputChannel })
				await delay(100)
				visibleProvider = tabProvider
			}

			visibleProvider?.postMessageToWebview({
				type: "action",
				action: "focusChatInput",
			})
		} catch (error) {
			outputChannel.appendLine(`Error in focusChatInput: ${error}`)
		}
	},
	exportSettings: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) return

		await exportSettings({
			providerSettingsManager: visibleProvider.providerSettingsManager,
			contextProxy: visibleProvider.contextProxy,
		})
	},
	// kilocode_change end
})

export const openClineInNewTab = async ({ context, outputChannel }: Omit<RegisterCommandOptions, "provider">) => {
	// (This example uses webviewProvider activation event which is necessary to
	// deserialize cached webview, but since we use retainContextWhenHidden, we
	// don't need to use that event).
	// https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
	const contextProxy = await ContextProxy.getInstance(context)
	const codeIndexManager = CodeIndexManager.getInstance(context)

	// Get the existing MDM service instance to ensure consistent policy enforcement
	let mdmService: MdmService | undefined
	try {
		mdmService = MdmService.getInstance()
	} catch (error) {
		// MDM service not initialized, which is fine - extension can work without it
		mdmService = undefined
	}

	const tabProvider = new ClineProvider(context, outputChannel, "editor", contextProxy, codeIndexManager, mdmService)
	const lastCol = Math.max(...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0))

	// Check if there are any visible text editors, otherwise open a new group
	// to the right.
	const hasVisibleEditors = vscode.window.visibleTextEditors.length > 0

	if (!hasVisibleEditors) {
		await vscode.commands.executeCommand("workbench.action.newGroupRight")
	}

	const targetCol = hasVisibleEditors ? Math.max(lastCol + 1, 1) : vscode.ViewColumn.Two

	const newPanel = vscode.window.createWebviewPanel(ClineProvider.tabPanelId, "O Code", targetCol, {
		enableScripts: true,
		retainContextWhenHidden: true,
		localResourceRoots: [context.extensionUri],
	})

	// Save as tab type panel.
	setPanel(newPanel, "tab")

	newPanel.iconPath = {
		light: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "kilo-light.svg"),
		dark: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "kilo-dark.svg"),
	}

	await tabProvider.resolveWebviewView(newPanel)

	// Add listener for visibility changes to notify webview
	newPanel.onDidChangeViewState(
		(e) => {
			const panel = e.webviewPanel
			if (panel.visible) {
				panel.webview.postMessage({ type: "action", action: "didBecomeVisible" }) // Use the same message type as in SettingsView.tsx
			}
		},
		null, // First null is for `thisArgs`
		context.subscriptions, // Register listener for disposal
	)

	// Handle panel closing events.
	newPanel.onDidDispose(
		() => {
			setPanel(undefined, "tab")
		},
		null,
		context.subscriptions, // Also register dispose listener
	)

	// Lock the editor group so clicking on files doesn't open them over the panel.
	await delay(100)
	await vscode.commands.executeCommand("workbench.action.lockEditorGroup")

	return tabProvider
}
