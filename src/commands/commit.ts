import chalk from 'chalk';
import { execa } from 'execa';

import {
  confirm,
  intro,
  isCancel,
  multiselect,
  outro,
  spinner
} from '@clack/prompts';

import { generateCommitMessageByDiff } from '../generateCommitMessageFromGitDiff';
import { trytm } from '../utils/trytm';
import { getConfig } from './config';
import { getVCS } from '../utils/vcs';

const config = getConfig();
const vcs = getVCS();

const getGitRemotes = async () => {
  const { stdout } = await execa('git', ['remote']);
  return stdout.split('\n').filter((remote) => Boolean(remote.trim()));
};

// Check for the presence of message templates
const checkMessageTemplate = (extraArgs: string[]): string | false => {
  for (const key in extraArgs) {
    if (extraArgs[key].includes(config?.OCO_MESSAGE_TEMPLATE_PLACEHOLDER))
      return extraArgs[key];
  }
  return false;
};

const generateCommitMessageFromGitDiff = async (
  diff: string,
  extraArgs: string[],
  fullGitMojiSpec: boolean,
  skipCommitConfirmation: boolean,
  jiraIssue: String
): Promise<void> => {
  await vcs.assertVCS();
  const commitSpinner = spinner();
  commitSpinner.start('Generating the commit message');

  try {
    let commitMessage = await generateCommitMessageByDiff(
      diff,
      fullGitMojiSpec                     
    );

    const messageTemplate = checkMessageTemplate(extraArgs);
    if (
      config?.OCO_MESSAGE_TEMPLATE_PLACEHOLDER &&
      typeof messageTemplate === 'string'
    ) {
      const messageTemplateIndex = extraArgs.indexOf(messageTemplate);
      extraArgs.splice(messageTemplateIndex, 1);

      commitMessage = messageTemplate.replace(
        config?.OCO_MESSAGE_TEMPLATE_PLACEHOLDER,
        commitMessage
      );
    }

    if( jiraIssue ) commitMessage += "\n\n[" + jiraIssue + "]"
    
    commitSpinner.stop('📝 Commit message generated');

    outro(
      `Generated commit message:
${chalk.grey('——————————————————')}
${commitMessage}
${chalk.grey('——————————————————')}`
    );

    const isCommitConfirmedByUser = skipCommitConfirmation || await confirm({
      message: 'Confirm the commit message?'
    });

    if (isCommitConfirmedByUser && !isCancel(isCommitConfirmedByUser)) {
        await vcs.commitAndPush(commitMessage, extraArgs)
    }
    if (!isCommitConfirmedByUser && !isCancel(isCommitConfirmedByUser)) {
      const regenerateMessage = await confirm({
        message: 'Do you want to regenerate the message ?'
      });
      if (regenerateMessage && !isCancel(isCommitConfirmedByUser)) {
        await generateCommitMessageFromGitDiff(
          diff,
          extraArgs,
          fullGitMojiSpec,
          skipCommitConfirmation,
          jiraIssue
        )
      }
    }
  } catch (error) {
    commitSpinner.stop('📝 Commit message generated');

    const err = error as Error;
    outro(`${chalk.red('✖')} ${err?.message || err}`);
    process.exit(1);
  }
};

export async function commit(
  extraArgs: string[] = [],
  isStageAllFlag: Boolean = false,
  fullGitMojiSpec: boolean = false,
  skipCommitConfirmation: boolean = false,
  jiraIssue: String = ""
) {
  if (isStageAllFlag) {
    const changedFiles = await vcs.getChangedFiles();

    if (changedFiles) await vcs.isolateChanges({ files: changedFiles });
    else {
      outro('No changes detected, write some code and run `oco` again');
      process.exit(1);
    }
  }

  const [stagedFiles, errorStagedFiles] = await trytm(vcs.getFilesToCommit());
  const [changedFiles, errorChangedFiles] = await trytm(vcs.getChangedFiles());
  
  if (!changedFiles?.length && !stagedFiles?.length) {
    outro(chalk.red('No changes detected'));
    process.exit(1);
  }

  intro('open-commit');
  if (errorChangedFiles ?? errorStagedFiles) {
    outro(`${chalk.red('✖')} ${errorChangedFiles ?? errorStagedFiles}`);
    process.exit(1);
  }

  const stagedFilesSpinner = spinner();

  stagedFilesSpinner.start('Counting staged files');

  if (!stagedFiles.length) {
    stagedFilesSpinner.stop('No files are staged');
    const isStageAllAndCommitConfirmedByUser = await confirm({
      message: 'Do you want to stage all files and generate commit message?'
    });

    if (
      isStageAllAndCommitConfirmedByUser &&
      !isCancel(isStageAllAndCommitConfirmedByUser)
    ) {
      await commit(extraArgs, true, fullGitMojiSpec);
      process.exit(1);
    }

    if (stagedFiles.length === 0 && changedFiles.length > 0) {
      const files = (await multiselect({
        message: chalk.cyan('Select the files you want to add to the commit:'),
        options: changedFiles.map((file) => ({
          value: file,
          label: file
        }))
      })) as string[];

      if (isCancel(files)) process.exit(1);

      await vcs.isolateChanges({ files });
    }

    await commit(extraArgs, false, fullGitMojiSpec, skipCommitConfirmation, jiraIssue);
    process.exit(1);
  }

  stagedFilesSpinner.stop(
    `${stagedFiles.length} staged files:\n${stagedFiles
      .map((file) => `  ${file}`)
      .join('\n')}`
  );

  const [, generateCommitError] = await trytm(
    generateCommitMessageFromGitDiff(
      await vcs.getDiff({ files: stagedFiles }),
      extraArgs,
      fullGitMojiSpec,
      skipCommitConfirmation,
      jiraIssue
    )
  );

  if (generateCommitError) {
    outro(`${chalk.red('✖')} ${generateCommitError}`);
    process.exit(1);
  }

  process.exit(0);
}
