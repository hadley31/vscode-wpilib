'use strict';
import * as fs from 'fs';
import * as jsonc from 'jsonc-parser';
import * as path from 'path';
import { localize as i18n } from '../locale';
import { logger } from '../logger';
import * as vscode from '../vscodeshim';
import { IExampleTemplateAPI, IExampleTemplateCreator } from '../wpilibapishim';
import { generateCopyCpp, generateCopyJava } from './generator';

export interface IExampleJsonLayout {
  name: string;
  description: string;
  tags: string[];
  foldername: string;
  gradlebase: string;
  commandversion: number;
}

export class Examples {
  private readonly exampleResourceName = 'examples.json';

  constructor(resourceRoot: string, java: boolean, core: IExampleTemplateAPI) {
    const examplesFolder = path.join(resourceRoot, 'src', 'examples');
    const resourceFile = path.join(examplesFolder, this.exampleResourceName);
    const gradleBasePath = path.join(path.dirname(resourceRoot), 'gradle');
    fs.readFile(resourceFile, 'utf8', (err, data) => {
      if (err) {
        logger.log('Example Error error: ', err);
        return;
      }
      const examples: IExampleJsonLayout[] = jsonc.parse(data) as IExampleJsonLayout[];
      for (const e of examples) {
        const provider: IExampleTemplateCreator = {
          getLanguage(): string {
            return java ? 'java' : 'cpp';
          },
          getDescription(): string {
            return e.description;
          },
          getDisplayName(): string {
            return e.name;
          },
          async generate(folderInto: vscode.Uri): Promise<boolean> {
            try {
              if (java) {
                if (!await generateCopyJava(resourceRoot, path.join(examplesFolder, e.foldername),
                  path.join(gradleBasePath, e.gradlebase), folderInto.fsPath, 'frc.robot.Main', path.join('frc', 'robot'),
                  false)) {
                  vscode.window.showErrorMessage(i18n('message', 'Cannot create into non empty folder'));
                  return false;
                }
              } else {
                if (!await generateCopyCpp(resourceRoot, path.join(examplesFolder, e.foldername),
                  path.join(gradleBasePath, e.gradlebase), folderInto.fsPath, false, false)) {
                  vscode.window.showErrorMessage(i18n('message', 'Cannot create into non empty folder'));
                  return false;
                }
              }
            } catch (err) {
              logger.error('Example generation error: ', err);
              return false;
            }
            return true;
          },
        };
        core.addExampleProvider(provider);
      }
    });
  }

  // tslint:disable-next-line:no-empty
  public dispose() {

  }
}
