import { log } from 'util';
import * as vscode from 'vscode';
const fs = require('fs');
const path = require('path');
const wxTags = [
  'movable-view',
  'cover-image',
  'cover-view',
  'movable-area',
  'scroll-view',
  'swiper',
  'swiper-item',
  'view',
  'icon',
  'progress',
  'rich-text',
  'text',
  'button',
  'checkbox',
  'checkbox-group',
  'editor',
  'form',
  'input',
  'label',
  'picker',
  'picker-view',
  'picker-view-column',
  'radio',
  'radio-group',
  'slider',
  'switch',
  'textarea',
  'functional-page-navigator',
  'navigator',
  'audio',
  'camera',
  'image',
  'live-player',
  'live-pusher',
  'video',
  'map',
  'canvas',
  'ad',
  'official-account',
  'open-data',
  'web-view',
];
const appFile = 'app.json';
let rootPath = '';

function lastLevelDir(filePath: string): string {
  return path.dirname(filePath);
}

function findRootPath(path: string): string {
  const dir = lastLevelDir(path);
  const files = fs.readdirSync(dir);

  if (files.includes(appFile)) {
    return dir;
  } else {
    return findRootPath(dir);
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      [{ scheme: 'file', language: 'wxml', pattern: '**/*.wxml' }],
      {
        provideDefinition(
          doc: vscode.TextDocument,
          position: vscode.Position,
          token: vscode.CancellationToken,
        ) {
          const lineText = doc.lineAt(position).text;
          const wordRange = doc.getWordRangeAtPosition(position, /[\w|\-]+\b/);
          const tag = (lineText.match(/(?<=<\/?)[\w|\-]+\b/) || [])[0];
          const word = doc.getText(wordRange);

          if (!tag) {
            return;
          }

          if (tag !== word) {
            return;
          }

          if (wxTags.includes(tag)) {
            return [];
          }

          const filePath = doc.fileName;
          let jsonFile = filePath.replace('.wxml', '.json');

          if (!rootPath) {
            rootPath = findRootPath(filePath);
          }

          let config = JSON.parse(fs.readFileSync(jsonFile).toString());
          let compPath;

          if (config.usingComponents && config.usingComponents[tag]) {
            compPath = config.usingComponents[tag];
          }

          // 获取当前json的path
          let prePath = path.parse(jsonFile).dir

          // 页面或者组件没有定义，查找一下全局配置
          if (!compPath) {
            jsonFile = path.join(rootPath, appFile);
            config = JSON.parse(fs.readFileSync(jsonFile).toString());

            if (config.usingComponents && config.usingComponents[tag]) {
              compPath = config.usingComponents[tag];
            }

            // 使用项目根path
            prePath = rootPath
          }

          const componentPath = path.join(prePath, `${compPath}.js`);

          return new vscode.Location(
            vscode.Uri.file(componentPath),
            new vscode.Position(0, 0),
          );
        },
      },
    ),
  );
}
