/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as net from "net";
import { workspace, ExtensionContext } from 'vscode';
import * as vscode from 'vscode';

import {
	integer,
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	StreamInfo,
	TransportKind
} from 'vscode-languageclient/node';
import { ChildProcess, spawn } from 'child_process';

let client: LanguageClient;
let process: ChildProcess;

export interface DocumentFormat {
	test: string;

}

function DecorationHandler(param: DocumentFormat) {
	console.log(param.test)

	const candidate = vscode.window.visibleTextEditors
		.filter(editor => editor.document.uri.path == "/home/johannes/Documents/projects/ptxdist_test_project/rules/test_foo.in")

	if (candidate.length == 0)
		return

	const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
		opacity: "70%"
	});


	const smallNumbers: vscode.DecorationOptions[] = [];
	const decoration = { range: new vscode.Range(new vscode.Position(8, 8), new vscode.Position(8, 17)) };
	smallNumbers.push(decoration)

	candidate[0].setDecorations(smallNumberDecorationType, smallNumbers)
}

export function activate(context: ExtensionContext) {
	console.log("activate ptxdist extension")

	let port: integer = 49152 + Math.round(Math.random() * 2 ^ 14);
	port = 5000;

	let connectionInfo = {
		port: port,
		host: "127.0.0.1"
	};

	let channel = vscode.window.createOutputChannel("Ptxdist PLS", "plaintext")

	process = spawn("/home/johannes/Documents/porjects/ptxdist_PLS/lps/lps",
		["-tcp", port.toString()],
		{
			detached: true,
		});
	process.stdout.on("data", (n: Buffer) => {
		channel.append(n.toString())
	})
	process.stderr.on("data", (n: Buffer) => {
		channel.append(n.toString())
	})

	console.log("started PLS")

	let serverOptions = () => {
		let socket = net.connect(connectionInfo);
		let result: StreamInfo = {
			writer: socket,
			reader: socket
		};
		return Promise.resolve(result);
	};

	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'ptxdistIn' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	client.onRequest("textDocument.documentDecoration", DecorationHandler)

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}

	process.kill();
	return client.stop();
}
