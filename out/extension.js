"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
let files = {};
let webView;
function loadFilesInWorkingspace() {
    vscode.workspace.findFiles("**/*").then(urls => {
        for (let fileUri of urls) {
            let path = fileUri.toString();
            let splitedPath = path.split("/");
            let fileName = splitedPath[splitedPath.length - 1].toLocaleLowerCase();
            files[fileName] = path;
        }
        vscode.window.showInformationMessage("Indexed " + urls.length + " files");
    });
}
function showSearchPanel(context) {
    webView = vscode.window.createWebviewPanel('aSearch', 'ASearch', vscode.ViewColumn.One, {
        enableScripts: true
    });
    webView.webview.html = getWebviewContent();
    webView.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'doSearch':
                searchAndReturnMessage(message.text);
                //vscode.window.showInformationMessage("Do search with" + message.text);
                return;
            case 'open':
                openFile(message.path);
                return;
            case 'ok':
                //console.log("ok");
                return;
        }
    }, undefined, context.subscriptions);
}
function searchAndReturnMessage(phrase) {
    let foundPath = [];
    let needle = phrase.toLocaleLowerCase();
    if (phrase.length == 0) {
        webView.webview.postMessage({ command: "filesFound", filesFound: [] });
        return;
    }
    for (let key in files) {
        if (key.search(needle) != -1)
            foundPath.push(files[key]);
    }
    webView.webview.postMessage({ command: "filesFound",
        filesFound: foundPath });
    //console.log("Returned " + foundPath.length);						  
}
function openFile(path) {
    //console.log("Open: " + path);
    vscode.window.showTextDocument(vscode.Uri.parse(path));
}
function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>ASearch</title>
	<style>
		input{
			width: 100%;
		}
		searchResult{
			color: white;
		}
	</style>
</head>
<body>
	<input id="fileName" placeholder="Search file name" onKeyUp="doSearch()" autofocus/>
	<div id="searchResult">Empty Result</div>
	
	<script>
		const vscode = acquireVsCodeApi();
		var keyupTimer;

		function doSearchDelay()
		{
			clearTimeout(keyupTimer);
			keyupTimer = setTimeout(doSearch, 500);
		}

		function doSearch()
		{
			var fieldValue = document.getElementById("fileName").value;
			vscode.postMessage({command: 'doSearch',
								text: fieldValue})
		}

		window.addEventListener('message', event => {
			const message = event.data;

			switch (message.command){
				case 'filesFound':
					var holder = document.getElementById("searchResult");
					holder.innerHTML = "";
					for(var file of message.filesFound)
					{
						var a = "openText('"+file+"')";
						holder.innerHTML += '<li onClick="'+a+'">' + file + '</li>';
					}
					vscode.postMessage({command: 'ok'})
				break;
			}
		});

		function openText(path)
		{
			vscode.postMessage({command: 'open', path: path});
		}
	</script>
</body>
</html>`;
}
function activate(context) {
    loadFilesInWorkingspace();
    let disposable = vscode.commands.registerCommand('extension.showSearchWindow', () => {
        showSearchPanel(context);
    });
    context.subscriptions.push(disposable);
    let disposable2 = vscode.commands.registerCommand('extension.reindexFiles', () => {
        loadFilesInWorkingspace();
    });
    context.subscriptions.push(disposable2);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map