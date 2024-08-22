import { execa } from 'execa';
import { VCS } from "./VCS"
import { getOpenCommitIgnore } from './helper';
import { isCancel, select, confirm, outro, spinner } from '@clack/prompts';
import chalk from 'chalk';
import { getConfig } from '../../commands/config';

const getGitRemotes = async (): Promise<string[]> => {
    const { stdout } = await execa('git', ['remote']);
    return stdout.split('\n').filter((remote) => Boolean(remote.trim()));
};

const config = getConfig();

export class GitVCS implements VCS {

    async assertVCS() { //tested 
        try {
            await execa('git', ['rev-parse']);
        } catch (error) {
            throw new Error(error as string);
        }
    };

    async getFilesToCommit(): Promise<string[]> { //tested 
        try{
            const { stdout: gitDir } = await execa('git', [
                'rev-parse',
                '--show-toplevel'
            ]);
        
            const { stdout: files } = await execa('git', [
            'diff',
            '--name-only',
            '--cached',
            '--relative',
            gitDir
            ]);
            
            if (!files) return [];
        
            const filesList = files.split('\n');
        
            const ig = getOpenCommitIgnore();
            const allowedFiles = filesList.filter((file) => !ig.ignores(file));
        
            if (!allowedFiles) return [];
        
            return allowedFiles.sort();
        } catch( error ) {
            throw new Error( error as string )
        }
    };

    async getChangedFiles() : Promise<string[]> { 
        
        try{

            const { stdout: modified } = await execa('git', ['ls-files', '--modified']);
            const { stdout: others } = await execa('git', [
                'ls-files',
                '--others',
                '--exclude-standard'
            ]);

            const files = [...modified.split('\n'), ...others.split('\n')].filter(
                (file) => !!file
            );

            return files.sort();


        } catch( error ) {

            throw new Error( error as string );
        
        }

    };

    async isolateChanges({ files }: { files: string[] }): Promise<void> { 
        const gitAddSpinner = spinner();

        gitAddSpinner.start('Adding files to commit');

        await execa('git', ['add', ...files]);

        gitAddSpinner.stop('Done');
    };

    async getDiff( { files }: { files: string[] } ): Promise<string>{ 
        const lockFiles = files.filter(
            (file) =>
              file.includes('.lock') ||
              file.includes('-lock.') ||
              file.includes('.svg') ||
              file.includes('.png') ||
              file.includes('.jpg') ||
              file.includes('.jpeg') ||
              file.includes('.webp') ||
              file.includes('.gif')
          );
        
          if (lockFiles.length) {
            outro(
              `Some files are excluded by default from 'git diff'. No commit messages are generated for this files:\n${lockFiles.join(
                '\n'
              )}`
            );
          }
        
          const filesWithoutLocks = files.filter(
            (file) => !file.includes('.lock') && !file.includes('-lock.')
          );

          const { stdout: diff } = await execa('git', [
            'diff',
            '--staged',
            '--',
            ...filesWithoutLocks
          ]);
          return diff;
    };

    async commitAndPush(commitMessage: string, extraArgs: string[] ): Promise<void> {
        const { stdout } = await execa('git', [
            'commit',
            '-m',
            commitMessage,
        ]);

        outro(`${chalk.green('✔')} Successfully committed`);
        outro(stdout);
        const remotes = await getGitRemotes();
        if (config?.OCO_GITPUSH === false)
            return

        if( !remotes.length ){
            const { stdout } = await execa( 'git', ['push'] );
            if( stdout ) outro( stdout );
            process.exit();
        }
        if (remotes.length === 1 && config?.OCO_GITPUSH !== true) {
            const isPushConfirmedByUser = await confirm({
              message: 'Do you want to run `git push`?'
            });
    
            if (isPushConfirmedByUser && !isCancel(isPushConfirmedByUser)) {
              const pushSpinner = spinner();
    
              pushSpinner.start(`Running 'git push ${remotes[0]}'`);
    
              const { stdout } = await execa('git', [ // actually pushing
                'push',
                '--verbose',
                remotes[0]
              ]);
    
              pushSpinner.stop(
                `${chalk.green('✔')} Successfully pushed all commits to ${
                  remotes[0]
                }`
              );
    
              if (stdout) outro(stdout);
            } else {
              outro('`git push` aborted');
              process.exit(0);
            }
          } else {
            const selectedRemote = (await select({
              message: 'Choose a remote to push to',
              options: remotes.map((remote) => ({ value: remote, label: remote }))
            })) as string;
    
            if (!isCancel(selectedRemote)) {
              const pushSpinner = spinner();
    
              pushSpinner.start(`Running 'git push ${selectedRemote}'`);
    
              const { stdout } = await execa('git', ['push', selectedRemote]);
    
              pushSpinner.stop(
                `${chalk.green(
                  '✔'
                )} Successfully pushed all commits to ${selectedRemote}`
              );
    
              if (stdout) outro(stdout);
            } else outro(`${chalk.gray('✖')} process cancelled`);
          }

    };

}