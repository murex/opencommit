import chalk from 'chalk';
import fs from 'fs/promises';

import { intro, outro, spinner } from '@clack/prompts';

import { generateCommitMessageByDiff } from '../generateCommitMessageFromGitDiff';
import { GitVCS } from '../utils/VCS/git';
import { getConfig } from './config';

const [messageFilePath, commitSource] = process.argv.slice(2);
const gitVCS = new GitVCS()

export const prepareCommitMessageHook = async (
  isStageAllFlag: Boolean = false
) => {
  try {
    if (!messageFilePath) {
      throw new Error(
        'Commit message file path is missing. This file should be called from the "prepare-commit-msg" git hook'
      );
    }

    if (commitSource) return;

    if (isStageAllFlag) {
      const changedFiles = await gitVCS.getChangedFiles();

      if (changedFiles) await gitVCS.isolateChanges({ files: changedFiles });
      else {
        outro('No changes detected, write some code and run `oco` again');
        process.exit(1);
      }
    }

    const staged = await gitVCS.getFilesToCommit();

    if (!staged) return;

    intro('opencommit');

    const config = getConfig();

    if (!config?.OCO_OPENAI_API_KEY && !config?.OCO_ANTHROPIC_API_KEY && !config?.OCO_AZURE_API_KEY) {
      throw new Error(
        'No OPEN_AI_API or OCO_ANTHROPIC_API_KEY or OCO_AZURE_API_KEY exists. Set your key in ~/.opencommit'
      );
    }

    const spin = spinner();
    spin.start('Generating commit message');

    const commitMessage = await generateCommitMessageByDiff(
      await gitVCS.getDiff({ files: staged })
    );
    spin.stop('Done');

    const fileContent = await fs.readFile(messageFilePath);

    await fs.writeFile(
      messageFilePath,
      commitMessage + '\n' + fileContent.toString()
    );
  } catch (error) {
    outro(`${chalk.red('✖')} ${error}`);
    process.exit(1);
  }
};
